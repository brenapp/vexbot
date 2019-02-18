/**
 * Gets information about a team
 */

import { addCommand } from "../message";
import { get } from "vexdb";
import {
  EventsResponseObject,
  MatchesResponseObject
} from "vexdb/out/constants/ResponseObjects";

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

addCommand("team", async (args, message) => {
  let team = args[0];
  let season = args.slice(1).join(" ") || "current";

  if (!team) {
    message.reply(
      "You didn't specify a team! Usage: `!team BCUZ` or `!team 3796B`. Optionally list a season after to get records for that seaosn"
    );
    return true;
  }

  let record = await get("teams", { team }).then(res => res[0]);

  if (!record) {
    message.reply("There doesn't appear to be a team with that number!");
    return true;
  }

  let events = await Promise.all(
    (await get("events", { team, season })).map(async event => ({
      ...event,
      awards: await get("awards", { team, sku: event.sku }),
      ranking: (await get("rankings", { team, sku: event.sku }))[0] || {
        wins: 0,
        losses: 0,
        ties: 0,
        rank: null
      }
    }))
  );

  let totalWins = events
    .map(evt => evt.ranking.wins)
    .reduce((a, b) => a + b, 0);
  let totalLosses = events
    .map(evt => evt.ranking.losses)
    .reduce((a, b) => a + b, 0);
  let totalTies = events
    .map(evt => evt.ranking.ties)
    .reduce((a, b) => a + b, 0);

  // Get eliminations matches
  const elims = (await get("matches", { season, team })).filter(match =>
    [16, 3, 4, 5].includes(match.round)
  );

  // Add wins, losses and ties
  totalWins += elims.filter(match => outcome(team, match) === "win").length;
  totalLosses += elims.filter(match => outcome(team, match) === "loss").length;
  totalTies += elims.filter(match => outcome(team, match) === "tie").length;

  message.channel.send({
    embed: {
      color: 3447003,
      title: `${record.team_name} (${record.number}) — ${
        season === "current" ? "Turning Point" : season
      }`,
      url: `https://vexdb.io/teams/view/${record.number}`,
      description: `${
        record.program == "VEXU" ? "VEXU" : record.grade
      } Team @ ${record.organisation} (${record.city}, ${
        record.region
      })\nSeason Record: ${totalWins}-${totalLosses}-${totalTies} (${(
        (totalWins / (totalLosses + totalTies + totalWins)) *
        100
      ).toPrecision(4)}% WR)`,
      fields:
        events.length > 0
          ? events.map(event => ({
              name:
                new Date(event.start).getTime() > Date.now()
                  ? `(FUTURE EVENT) ${event.name}`
                  : event.name,
              value: `${
                event.ranking && new Date(event.start).getTime() < Date.now()
                  ? `Ranked #${event.ranking.rank} (${event.ranking.wins}-${
                      event.ranking.losses
                    }-${event.ranking.ties})`
                  : `Unranked`
              }. ${event.awards
                .map(award => award.name.split(" (")[0])
                .join(", ")}`
            }))
          : [
              { name: "Empty", value: `This team has no records for ${season}` }
            ],
      timestamp: new Date(),
      footer: {
        icon_url: message.author.avatarURL,
        text: `Invoked by ${message.member.displayName}`
      }
    }
  });
});
