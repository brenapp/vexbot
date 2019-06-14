import * as vexdb from "vexdb";
import {
  EventsResponseObject,
  MatchesResponseObject
} from "vexdb/out/constants/ResponseObjects";
import Command, { makeEmbed, Permissions } from "../lib/command";
import { Message } from "discord.js";

function outcome(team: string, match: MatchesResponseObject) {
  if (match.redscore === match.bluescore) {
    return "tie";
  }

  if (
    (match.redscore > match.bluescore &&
      [match.red1, match.red2, match.red3].includes(team)) ||
    (match.bluescore > match.redscore &&
      [match.blue1, match.blue2, match.blue3].includes(team))
  ) {
    return "win";
  }

  return "loss";
}

export class TeamCommand extends Command("team") {
  check = Permissions.all;

  constructor() {
    super();
  }

  async exec(message: Message, args: string[]) {
    const team = args[0];
    const season = args.slice(1).join(" ") || "current";

    if (!team) {
      message.reply(
        "You didn't specify a team! Usage: `!team BCUZ` or `!team 3796B`. Optionally list a season after to get records for that seaosn"
      );
      return;
    }

    let record = await vexdb.get("teams", { team }).then(res => res[0]);

    if (!record) {
      message.reply("There doesn't appear to be a team with that number!");
      return;
    }

    let events = await vexdb.get("events", { team, season });
    let rankings = await Promise.all(
      events.map(evt =>
        vexdb
          .get("rankings", { sku: evt.sku, team, season })
          .then(
            rank => rank[0] || { wins: 0, losses: 0, ties: 0, rank: "Unranked" }
          )
      )
    );
    let awards = await Promise.all(
      events.map(evt => vexdb.get("awards", { sku: evt.sku, team, season }))
    );

    let totalWins = events
      .map((evt, i) => rankings[i].wins)
      .reduce((a, b) => a + b, 0);
    let totalLosses = events
      .map((evt, i) => rankings[i].losses)
      .reduce((a, b) => a + b, 0);
    let totalTies = events
      .map((evt, i) => rankings[i].ties)
      .reduce((a, b) => a + b, 0);

    // Get eliminations matches
    const elims = (await vexdb.get("matches", { season, team })).filter(match =>
      [16, 3, 4, 5].includes(match.round)
    );

    // Add wins, losses and ties
    totalWins += elims.filter(match => outcome(team, match) === "win").length;
    totalLosses += elims.filter(match => outcome(team, match) === "loss")
      .length;
    totalTies += elims.filter(match => outcome(team, match) === "tie").length;

    const embed = makeEmbed(message);
    embed
      .setColor(3447003)
      .setTitle(
        `${record.team_name} (${record.number}) — ${
          season === "current" ? "Tower Takeover" : season
        }`
      )
      .setURL(`https://vexdb.io/teams/view/${record.number}`)
      .setDescription(
        `${record.program == "VEXU" ? "VEXU" : record.grade} Team @ ${
          record.organisation
        } (${record.city}, ${
          record.region
        })\nSeason Record: ${totalWins}-${totalLosses}-${totalTies} (${(
          (totalWins / (totalLosses + totalTies + totalWins)) *
          100
        ).toPrecision(4)}% WR)`
      );

    for (let [i, event] of events.entries()) {
      embed.addField(
        new Date(event.start).getTime() > Date.now()
          ? `(FUTURE EVENT) ${event.name}`
          : event.name,
        `${
          rankings[i].rank && new Date(event.start).getTime() < Date.now()
            ? `Ranked #${rankings[i].rank} (${rankings[i].wins}-${
                rankings[i].losses
              }-${rankings[i].ties})`
            : `Unranked`
        }. ${awards[i].map(award => award.name.split(" (")[0]).join(", ")}`
      );
    }

    if (events.length < 1) {
      embed.addField(
        "Empty",
        `No logged events for ${
          season === "current" ? "Tower Takeover" : season
        }`
      );
    }

    embed.setTimestamp();

    return message.channel.send(embed);
  }
}

export default new TeamCommand();
