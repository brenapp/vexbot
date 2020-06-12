/**
 * Gets skills data
 *
 * Options:
 *  /skills BCUZ (shows skills data for a single team)
 *  /skills South Carolina (shows skills info for a given region)
 */

import Command, { Permissions, PREFIX } from "../lib/command";
import { Message, MessageEmbed } from "discord.js";
import * as vexdb from "vexdb";
import { makeEmbed } from "../lib/util";
import {
  TeamsResponseObject,
  SkillsResponseObject,
} from "vexdb/out/constants/ResponseObjects";

async function getSkillsAtEvents(events: string[]) {
  const runs: SkillsResponseObject[] = [];

  for (const sku of events) {
    runs.push(...(await vexdb.get("skills", { sku })));
  }

  return runs;
}

function findBest(type: number, skills: SkillsResponseObject[]) {
  let best: SkillsResponseObject | null = null;

  for (const run of skills) {
    if (run.type !== type) continue;

    if (!best) {
      best = run;
    } else if (best.score === run.score && run.attempts < best.attempts) {
      best = run;
    } else if (run.score > best.score) {
      best = run;
    }
  }

  return best;
}

function href(sku: string) {
  return `https://www.robotevents.com/robot-competitions/vex-robotics-competition/${sku}.html`;
}

async function teamRecord(
  team: TeamsResponseObject,
  message: Message
): Promise<MessageEmbed> {
  const embed = makeEmbed(message);

  embed.setAuthor(
    `${team.number} - ${decodeURIComponent(team.team_name)} (${team.region})`
  );

  let body = `**Records** (May not include VEXU skills runs at VRC events)\n`;

  const skills = await vexdb.get("skills", {
    season: "current",
    team: team.number,
  });

  // Find the best in each category
  const best = [0, 1, 2].map((type) => findBest(type, skills));

  for (let type = 0; type <= 2; type++) {
    const challenge = ["Driver Skills", "Programming Skills", "Robot Skills"][
      type
    ];
    const run = best[type];
    if (!run) continue;

    const event = await vexdb
      .get("events", { sku: run.sku })
      .then((ev) => ev[0]);

    body += `🥇 ${challenge} — ${run.score} @ [${event.name}](${href(
      event.sku
    )})\n`;
  }

  body += "\n**Recent Events:**\n";

  // Now, include summaries for the most recent few runs
  const runs = skills.filter((run) => run.type === 2).slice(0, 5);

  for (const run of runs) {
    const event = await vexdb
      .get("events", { sku: run.sku })
      .then((ev) => ev[0]);

    const date = new Date(Date.parse(event.start));

    body += `${run.score} on ${date.toLocaleDateString()} @ [${
      event.name
    }](${href(event.sku)}) (Ranked ${run.rank})\n\n`;
  }

  embed.setDescription(body);

  return embed;
}

async function groupRecord(
  skillsData: SkillsResponseObject[],
  label: string,
  message: Message
): Promise<MessageEmbed> {
  const embed = makeEmbed(message);

  const skills: {
    [team: string]: (SkillsResponseObject | null)[];
  } = {};

  for (const run of skillsData) {
    // Create the skills object if it doesn't exist
    if (!skills[run.team]) {
      skills[run.team] = [null, null, null];
    }

    // Update it if it's greater
    if (
      !skills[run.team][run.type] ||
      (skills[run.team][run.type] as SkillsResponseObject).score < run.score
    ) {
      skills[run.team][run.type] = run;
      continue;
    }
  }

  // Get the top teams
  const top = Object.keys(skills)
    .filter((team) => skills[team][2]) // Only consider teams who have Robot Skills Score
    .sort((a, b) => (skills[b][2]?.score || 0) - (skills[a][2]?.score || 0)); // Sort by highest score

  let body = "";

  for (const [index, team] of Object.entries(top.slice(0, 10))) {
    const [driver, programming, robot] = skills[team];

    body += `${+index + 1}. ${team} — ${robot?.score} (${driver?.score ||
      0} + ${programming?.score || 0})\n`;
  }

  embed.setAuthor(`${label} Skills Leaderboard`).setDescription(body);

  return embed;
}

export const SkillsCommand = Command({
  names: ["skills"],

  documentation: {
    description: "Gets skills rankings for teams or regions",
    usage: `skills BCUZ or ${PREFIX[0]}skills South Carolina or ${PREFIX[0]}skills VEXU`,
    group: "VEX",
  },

  check: Permissions.all,

  async exec(message: Message, args: string[]) {
    const teamOrRegion = args.join(" ");

    let embed: MessageEmbed;

    // First see if there is a team
    const team = await vexdb.get("teams", { team: teamOrRegion });

    let intermediate: Message | undefined = undefined;

    if (team.length > 0) {
      intermediate = await message.channel.send(
        `Getting skills data for ${teamOrRegion}...`,
        { split: false }
      );

      embed = await teamRecord(team[0], message);
    } else if (teamOrRegion.toUpperCase() === "VEXU") {
      intermediate = await message.channel.send(
        `Getting skills data for ${teamOrRegion}...`,
        { split: false }
      );

      const events = await vexdb.get("events", {
        program: "VEXU",
        season: "current",
      });
      const skillsData = await getSkillsAtEvents(events.map((r) => r.sku));

      embed = await groupRecord(skillsData, "VEXU", message);
    } else {
      intermediate = await message.channel.send(
        `Getting skills data for ${teamOrRegion}...`,
        { split: false }
      );

      const events = await vexdb.get("events", {
        region: teamOrRegion,
        season: "current",
      });

      if (events.length < 1) {
        return message.channel.send(
          "No team or region `" + teamOrRegion + "`."
        );
      }

      const skillsData = await getSkillsAtEvents(events.map((r) => r.sku));

      embed = await groupRecord(skillsData, teamOrRegion, message);
    }

    intermediate.delete();

    return message.channel.send({ embed });
  },
});
