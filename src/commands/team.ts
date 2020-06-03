import { Message } from "discord.js";
import * as vexdb from "vexdb";
import { MatchesResponseObject } from "vexdb/out/constants/ResponseObjects";
import Command, { Permissions } from "../lib/command";
import { makeEmbed } from "../lib/util";
import { Seasons } from "vexdb/out/constants/RequestObjects";

enum MatchOutcome {
  WIN,
  TIE,
  LOSS,
}

function outcome(team: string, match: MatchesResponseObject) {
  if (match.redscore === match.bluescore) {
    return MatchOutcome.TIE;
  }

  if (
    (match.redscore > match.bluescore &&
      [match.red1, match.red2, match.red3].includes(team)) ||
    (match.bluescore > match.redscore &&
      [match.blue1, match.blue2, match.blue3].includes(team))
  ) {
    return MatchOutcome.WIN;
  }

  return MatchOutcome.LOSS;
}

function buildRecord(team: string, matches: MatchesResponseObject[]) {
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
  names: ["team"],

  documentation: {
    description: "Lists team record for this season",
    usage: "team 3796B",
    group: "VEX",
  },

  check: Permissions.all,
  async exec(message: Message, args: string[]) {
    const team = args[0].toUpperCase();
    const season = (args.slice(1).join(" ") as Seasons) || "current";

    if (!team) {
      message.reply(
        "You didn't specify a team! Usage: `!team BCUZ` or `!team 3796B`. Optionally list a season after to get records for that seaosn"
      );
      return;
    }

    const record = await vexdb.get("teams", { team }).then((res) => res[0]);

    if (!record) {
      message.reply("There doesn't appear to be a team with that number!");
      return;
    }

    const events = await vexdb.get("events", { team, season });
    const matches = await vexdb.get("matches", {
      team,
      season,
      scored: 1,
    });
    const awards = await vexdb.get("awards", { team, season });
    const rankings = await vexdb.get("rankings", { team, season });

    // Make the season record
    const seasonRecord = buildRecord(team, matches);

    const embed = makeEmbed(message);
    embed
      .setColor(3447003)
      .setTitle(
        `${record.team_name} (${record.number}) — ${
          season === "current" ? "Change Up" : season
        }`
      )
      .setURL(`https://vexdb.io/teams/view/${record.number}`)
      .setDescription(
        `${record.program == "VEXU" ? "VEXU" : record.grade} Team @ ${
          record.organisation
        } (${record.city}, ${record.region})\nSeason Record: ${
          seasonRecord.wins
        }-${seasonRecord.losses}-${seasonRecord.ties} (${(
          (100 * seasonRecord.wins) /
          matches.length
        ).toFixed(2)}% WR)`
      );

    for (const event of events) {
      const localAwards = awards.filter((award) => award.sku === event.sku);
      const ranking = rankings.find((rank) => rank.sku === event.sku);
      const eventRecord = buildRecord(
        team,
        matches.filter((match) => match.sku === event.sku)
      );

      let output = "";

      if (ranking) {
        output += `Ranked #${ranking.rank} (${ranking.wins}-${ranking.losses}-${ranking.ties} in quals and ${eventRecord.wins}-${eventRecord.losses}-${eventRecord.ties} total)\n`;
      }

      if (localAwards.length > 0) {
        output +=
          localAwards.map((award) => award.name.split("(")[0]).join(", ") +
          "\n";
      }

      if (!output || new Date(event.start).getTime() > Date.now()) {
        output = "No Data Available";
      }

      embed.addField(
        `${new Date(event.end).toLocaleDateString()} ${event.name}`,
        output
      );
    }

    return message.channel.send(embed);
  },
});

export const WinRateRankingCommand = Command({
  names: ["winrates"],

  documentation: {
    group: "VEX",
    description: "Calcuates winrates for the given region",
    usage: "winrates South Carolina",
  },

  check: Permissions.all,
  async exec(message: Message, args: string[]) {
    // Get all the teams in the region
    const region = args[0] || "South Carolina";
    const teams = await vexdb.get("teams", { region });

    // Get all their matches
    const teamMatches = await Promise.all(
      teams.map(async (team) => ({
        team,
        matches: await vexdb.get("matches", {
          team: team.number,
          season: "current",
        }),
      }))
    );

    const records = teamMatches
      .map(({ team, matches }) => buildRecord(team.number, matches))
      .filter((record) => record.matches > 0);

    // Sort the records by winrate
    const rankings = records.sort(
      (b, a) => a.wins / a.matches - b.wins / b.matches
    );

    const embed = makeEmbed(message)
      .setTitle(`${region} Season Record Leaderboard`)
      .setDescription("Ranking by Win Rate");

    for (let rank = 0; rank < Math.min(25, rankings.length); rank++) {
      const ranking = rankings[rank];

      embed.addField(
        `${rank + 1}. ${ranking.team} — ${(
          (100 * ranking.wins) /
          ranking.matches
        ).toFixed(2)}%`,
        `${ranking.wins}-${ranking.losses}-${ranking.ties}`
      );
    }

    return message.channel.send({ embed });
  },
});
