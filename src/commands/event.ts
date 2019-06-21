import { Message } from "discord.js";
import Command, { Permissions, makeEmbed } from "../lib/command";
import * as vexdb from "vexdb";
import * as keya from "keya";

import fetch from "isomorphic-fetch";
import cheerio from "cheerio";
import { EventsRequestObject } from "vexdb/out/constants/RequestObjects";

async function html(url: string) {
  const store = await keya.store("fetched");
  let record = await store.get(url);

  if (record) {
    return record as string;
  } else {
    return fetch(url)
      .then(res => res.text())
      .then(async text => {
        await store.set(url, text);
        return text;
      });
  }
}

async function getCapacityInformation(
  sku: string
): Promise<{ capacity: string; open: string }> {
  return html(
    `https://www.robotevents.com/robot-competitions/vex-robotics-competition/${sku}.html`
  )
    .then(html => cheerio.load(html))
    .then($ =>
      $(
        "#front-app > div.panel.panel-default > div.panel-body > div > div:nth-child(2) > p:nth-child(4)"
      ).text()
    )
    .then(text => {
      let [capacity, open] = text.split(" / ").map(t => t.split(": ")[1]);
      return { capacity, open };
    });
}

export class EventCommand extends Command("events") {
  check = Permissions.all;

  documentation() {
    return {
      description: "Lists events in a given region",
      usage: "events South Carolina",
      group: "VEX"
    };
  }

  async exec(message: Message, args: string[]) {
    let region = args
      .map(word => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(" ");

    let params: EventsRequestObject = {};

    // Special cases
    switch (region) {
      case "All":
        params = {};
        break;
      case "Signature":
        params = {
          name: name => name.includes("Signature Event")
        };
        break;
      default:
        params = { region };
        break;
    }

    const events = await Promise.all(
      (await vexdb.get("events", { ...params, season: "current" }))
        .slice(0, 25)
        .map(async event => ({
          event,
          ...(await getCapacityInformation(event.sku))
        }))
    );

    const embed = makeEmbed(message);

    embed.setTitle(`${region} Events`);
    embed.setDescription(`For the current season (most recent 25)`);

    events.forEach(({ event, open, capacity }) => {
      embed.addField(
        `[${new Date(Date.parse(event.end)).toLocaleDateString()}] ${
          event.name
        }`,
        `${open} open / ${capacity} teams @ ${event.loc_venue} (${
          event.loc_city
        }, ${
          event.loc_region
        })\n[RobotEvents](https://www.robotevents.com/robot-competitions/vex-robotics-competition/${
          event.sku
        }.html)`
      );
    });

    if (!events.length) {
      embed.addField("Empty", "No events have been listed!");
    }

    return message.channel.send({ embed });
  }
}

export default new EventCommand();
