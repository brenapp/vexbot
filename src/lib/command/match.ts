/**
 * Match tools for events
 */

import * as vexdb from "vexdb";
import { RichEmbed } from "discord.js";
import {
  MatchesResponseObject,
  EventsResponseObject
} from "../../../node_modules/vexdb/out/constants/ResponseObjects";
import { addCommand } from "../message";

async function matchEmbed(match: MatchesResponseObject) {
  let redAlliance = [match.red1, match.red2, match.red3].filter(
    team => team !== match.redsit
  );
  let blueAlliance = [match.blue1, match.blue2, match.blue3].filter(
    team => team !== match.bluesit
  );

  let winColor =
    match.redscore > match.bluescore
      ? 0xe74c3c
      : match.bluescore > match.redscore
        ? 0x3498db
        : 0x95a5a6;

  let round = [
    ,
    "Practice",
    "Qualifier",
    "Quarter Finals",
    "Semi Finals",
    "Finals",
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    "Round of 16"
  ][match.round];

  // @ts-ignore
  let event: EventsResponseObject = (await vexdb.get("events", {
    sku: match.sku
  }))[0];

  return new RichEmbed()
    .setDescription(event.name)
    .setAuthor(
      `${round} #${match.round > 2 ? match.matchnum : match.instance}${
        match.round > 2 ? `-${match.matchnum}` : ""
      }`
    )
    .setTitle(`${redAlliance.join(" ")} vs ${blueAlliance.join(" ")}`)
    .setColor(winColor);
}

addCommand("match", async (args, message) => {
  let invoker = message.member;

  if (invoker.highestRole.name !== "Admins") {
    message.reply("You're forbidden from doing that for now");
    return true;
  }

  let [team] = args;
  let matches = await Promise.all(
    (await vexdb.get("matches", { team })).map(matchEmbed)
  );

  matches.forEach(match => message.channel.send(match));

  return true;
});
