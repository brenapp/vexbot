/**
 * Gets information about a team
 */

import { addCommand } from "../message";
import vexdb, { get } from "vexdb";
import { EventsResponseObject } from "../../../node_modules/vexdb/out/constants/ResponseObjects";

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

  console.log("Responding...", events);

  message.channel.send({
    embed: {
      color: 3447003,
      title: `${record.team_name} (${record.number})`,
      url: `https://io/teams/view/${record.number}`,
      description: `${
        record.program == "VEXU" ? "VEXU" : record.grade
      } team @ ${record.organisation} (${record.city}, ${record.region})`,
      // TypeScript is being dumb!
      fields: events.map(event => {
        [
          // @ts-ignore
          `${event.name}`,
          `Ranked ${
            // @ts-ignore
            event.ranking.rank
          }`,
          // @ts-ignore
          event.awards.map(award => award.name)
        ].join("\n");
      })
    }
  });
});
