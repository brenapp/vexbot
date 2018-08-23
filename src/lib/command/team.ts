/**
 * Gets information about a team
 */

import { addCommand } from "../message";
import vexdb, { get } from "vexdb";
import { EventsResponseObject } from "vexdb/out/constants/ResponseObjects";

addCommand("team", async (args, message) => {
  let [team] = args;

  if (!team) {
    message.reply(
      "You didn't specify a team! Usage: `!team YNOT` or `!team 3796B`"
    );
    return true;
  }

  let record = await get("teams", { team }).then(res => res[0]);

  if (!record) {
    message.reply("There doesn't appear to be a team with that number!");
    return true;
  }

  let events = await Promise.all(
    // @ts-ignore
    (await get("events", { team })).map(async event => ({
      ...(event as EventsResponseObject),
      awards: await get("awards", { team, sku: event.sku }),
      ranking: (await get("rankings", { team, sku: event.sku }))[0]
    }))
  );

  message.channel.send({
    embed: {
      color: 3447003,
      title: `${record.team_name} (${record.number})`,
      url: `https://vexdb.io/teams/view/${record.number}`,
      description: `${
        record.program == "VEXU" ? "VEXU" : record.grade
      } Team @ ${record.organisation} (${record.city}, ${record.region})`,
      fields: events.map(event => ({
        name: event.name,
        value: `${
          event.ranking ? `Ranked #${event.ranking.rank}` : `Unranked`
        }. ${event.awards.map(award => award.name.split(" (")[0]).join(", ")}`
      })),
      timestamp: new Date(),
      footer: {
        icon_url: message.author.avatarURL,
        text: `Invoked by ${message.member.displayName}`
      }
    }
  });
});
