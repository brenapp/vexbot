/**
 * Gets skills data
 *
 * Options:
 *  /skills BCUZ (shows skills data for a single team)
 *  /skills South Carolina (shows skills info for a given region)
 */

import Command, { Permissions, PREFIX } from "../lib/command";
import { Message, MessageEmbed } from "discord.js";
import { makeEmbed } from "../lib/util";

import * as robotevents from "robotevents";
import { ProgramAbbr } from "robotevents/out/endpoints/programs";
import { Grade, Team } from "robotevents/out/endpoints/teams";
import {
  SkillsLeaderboardOptions,
  SkillsLeaderboardSpot,
} from "robotevents/out/v1/skills";
import { Season } from "robotevents/out/endpoints/seasons";
import { HelpCommand } from "./help";
import { Skill } from "robotevents/out/endpoints/skills";

export const CURRENT_SEASONS = [
  robotevents.seasons.current("VRC") as number,
  robotevents.seasons.current("VEXU") as number,
  robotevents.seasons.current("VAIC-HS") as number,
  robotevents.seasons.current("VAIC-U") as number,
  robotevents.seasons.current("VIQC") as number,
];

const PROGRAMS: robotevents.programs.ProgramAbbr[] = [
  "VRC",
  "VEXU",
  "WORKSHOP",
  "CREATE",
  "VIQC",
  "DIS",
  "NRL",
  "RAD",
  "TVCR",
  "TIQC",
  "VAIC-HS",
  "VAIC-U",
];

function defaultGradeLevel(grade: string, program: ProgramAbbr): Grade {
  switch (grade) {
    case "ES":
      // robotevents is typed incorrectly
      return "Elementary" as "Elementary School";

    case "MS":
      return "Middle School";

    case "HS":
      return "High School";

    default: {
      if (program === "VAIC-U" || program === "VEXU") {
        return "College";
      } else if (program === "VIQC" || program === "TIQC") {
        return "Middle School";
      } else {
        return "High School";
      }
    }
  }
}

function rankingListing(rankings: SkillsLeaderboardSpot[]) {
  let description = "";

  for (const [i, rank] of Object.entries(rankings.slice(0, 20))) {
    description += `${+i + 1}. ${rank.team.team} - ${rank.scores.score} (${
      rank.scores.driver
    } + ${rank.scores.programming}) \n`;
  }

  return description;
}

async function programLeaderboard(
  message: Message,
  season: Season,
  options: SkillsLeaderboardOptions
): Promise<MessageEmbed> {
  const embed = makeEmbed(message);

  embed.setTitle(
    `${season.program.code} Skills Leaderboard (${options.grade_level})`
  );
  let description = "";

  const rankings = await robotevents.v1.getSkillsLeaderboard(
    season.id,
    options
  );

  description += rankingListing(rankings);

  embed.setDescription(description);

  return embed;
}

async function regionalLeaderboard(
  message: Message,
  region: string,
  program: ProgramAbbr,
  grade_level: Grade
): Promise<MessageEmbed | null> {
  const season = await robotevents.seasons.fetch(
    robotevents.seasons.current(program) as number
  );

  const embed = makeEmbed(message);

  embed.setTitle(
    `${season.program.code} ${region} Skills Leaderboard (${grade_level})`
  );
  let description = "";

  const rankings = await robotevents.v1.getSkillsLeaderboard(season.id, {
    region,
    grade_level,
  });

  if (
    Object.prototype.hasOwnProperty.call(rankings, "error") ||
    rankings.length < 1
  ) {
    return null;
  }

  description += rankingListing(rankings);
  embed.setDescription(description);

  return embed;
}

async function teamLeaderboard(message: Message, team: Team) {
  const embed = makeEmbed(message);

  embed.setTitle(`${team.program.code} ${team.number} Skills`);

  const runs = await team.skills({ season: CURRENT_SEASONS });
  let description = "";

  const bestRuns: { [key: string]: Skill } = {};

  for (const [, run] of runs) {
    if (bestRuns[run.type]) {
      const compare = bestRuns[run.type] as Skill;

      if (run.score > compare.score) {
        bestRuns[run.type] = run;
      }
    } else {
      bestRuns[run.type] = run;
    }
  }

  description = Object.entries(bestRuns)
    .map(([t, s]) => `${t}: ${s.score}`)
    .join(" ");

  embed.setDescription(description || "No Skills Data Available");

  return embed;
}

function toTitleCase(string: string) {
  return string
    .split(" ")
    .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

export const SkillsCommand = Command({
  names: ["skills"],

  documentation: {
    description: "Gets skills rankings for teams, regions, or programs",
    usage: `skills BCUZ or ${PREFIX[0]}skills South Carolina or ${PREFIX[0]}skills VEXU`,
    group: "VEX",
  },

  check: Permissions.all,

  async exec(message: Message, args: string[]) {
    // All of the options require at least one parameter, so display the help
    // if they don't specify anything
    if (args.length < 1) {
      return HelpCommand.exec(message, ["skills"]);
    }

    const loadingMessage = await message.channel.send(
      `Retriving skills data...`
    );

    // Handle Program Declaractions
    if (PROGRAMS.includes(args[0] as ProgramAbbr)) {
      const abbr = args[0] as ProgramAbbr;
      const grade = (args[1] || "").toUpperCase();

      const season = await robotevents.seasons.fetch(
        robotevents.seasons.current(abbr) as number
      );

      // Decode the Grade Level, or find sensible defaults
      const grade_level: Grade = defaultGradeLevel(grade, abbr);

      // Return the Embed
      const embed = await programLeaderboard(message, season, { grade_level });
      return message.channel.send(embed);

      // Otherwise, check to see if there is a team
    } else {
      const team = await robotevents.teams.get(
        args[0],
        args[1] as ProgramAbbr | undefined
      );

      // Display skills rankings for a team
      if (team) {
        const embed = await teamLeaderboard(message, team);

        loadingMessage.delete();
        return message.channel.send(embed);

        // Handle regional rankings
      } else {
        const region = toTitleCase(args[0]);
        const program = (args[1] as ProgramAbbr) || "VRC";
        const grade = defaultGradeLevel(args[2] || "", program);

        const embed = await regionalLeaderboard(
          message,
          region,
          program,
          grade
        );

        if (embed) {
          loadingMessage.delete();
          return message.channel.send(embed);
        } else {
          loadingMessage.delete();
          return message.channel.send(
            `Could not skills data about \`${args[0]}\``
          );
        }
      }
    }
  },
});
