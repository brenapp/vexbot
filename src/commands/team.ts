import { Message } from "discord.js";
import * as robotevents from "robotevents";
import { Alliance, Match } from "robotevents/out/endpoints/matches";
import { ProgramAbbr } from "robotevents/out/endpoints/programs";
import Command, { Permissions } from "../lib/command";
import { makeEmbed } from "../lib/util";
import { HelpCommand } from "./help";
import { debug } from "./debug";

enum MatchOutcome {
  WIN,
  TIE,
  LOSS,
}

function outcome(team: number, match: Match) {
  const red = match.alliances.find((a) => a.color == "red") as Alliance;
  const blue = match.alliances.find((a) => a.color == "blue") as Alliance;

  if (red.score === blue.score) {
    return MatchOutcome.TIE;
  }

  const redteams = red.teams.map((t) => t.team.id);
  const blueteams = red.teams.map((t) => t.team.id);

  if (
    (red.score > blue.score && redteams.includes(team)) ||
    (blue.score > red.score && blueteams.includes(team))
  ) {
    return MatchOutcome.WIN;
  }

  return MatchOutcome.LOSS;
}

function buildRecord(team: number, matches: Match[]) {
  const record = {
    team,
    wins: 0,
    losses: 0,
    ties: 0,
    matches: 0,
  };

  for (const match of matches) {
    const result = outcome(team, match);

    record.matches++;

    if (result == MatchOutcome.WIN) {
      record.wins++;
    } else if (result == MatchOutcome.LOSS) {
      record.losses++;
    } else {
      record.ties++;
    }
  }

  return record;
}

export const TeamCommand = Command({
  names: ["team", "awards", "record"],

  documentation: {
    description: "Lists team record for this season",
    usage: "team 3796B VRC",
    group: "VEX",
  },

  check: Permissions.all,
  async exec(message: Message, args: string[]) {
    if (args.length < 1) {
      return HelpCommand.exec(message, ["team"]);
    }

    const number = args[0].toUpperCase();
    const program = args.slice(1).join(" ").toUpperCase();

    const team = await robotevents.teams.get(number, program as ProgramAbbr);

    if (!team) {
      return message.channel.send(
        `Cannot find data about ${program || "Team"} \`${number}\``
      );
    }
    debug(`${team.team_name} loaded`, message);

    const season = [robotevents.seasons.current(team.program.code) as number];

    // Get match records
    const matches = await team
      .matches({ season })
      .then((collection) => collection.array());

    debug(`${matches.length} loaded`, message);

    const record = buildRecord(team.id, matches);
    const winrate = (100 * record.wins) / record.matches;

    debug(
      `Record Built: ${record.wins}-${record.losses}-${record.ties}`,
      message
    );

    const embed = makeEmbed(message);
    embed
      .setTitle(`${team.team_name} (${team.program.code} ${team.number})`)
      .setDescription(
        [
          `${team.grade} Team @ ${team.organization} (${team.location.region}, ${team.location.country})`,
          `${record.wins}-${record.losses}-${record.ties} (${winrate.toFixed(
            2
          )}% WR)`,
        ].join("\n")
      );

    return message.channel.send({ embed });
  },
});
