import { Message, RichEmbed } from "discord.js";
import Command, { Permissions } from "../lib/command";
import { makeEmbed } from "../lib/util";
import * as vexdb from "vexdb";
import * as keya from "keya";

import fetch from "isomorphic-fetch";
import cheerio from "cheerio";
import { EventsRequestObject } from "vexdb/out/constants/RequestObjects";
import { EventsResponseObject } from "vexdb/out/constants/ResponseObjects";
import listen from "../lib/reactions";

export async function html(url: string) {
  const store = await keya.store("fetched");
  let record = await store.get(url);

  if (record) {
    return record as string;
  } else {
    return fetch(url)
      .then((res) => res.text())
      .then(async (text) => {
        await store.set(url, text);
        return text;
      });
  }
}

function constructFields(
  events: { capacity: string; open: string; event: EventsResponseObject }[],
  embed: RichEmbed
) {
  events.forEach(({ event, open, capacity }) => {
    embed.addField(
      `[${new Date(Date.parse(event.end)).toLocaleDateString()}] ${event.name}`,
      `${open} open / ${capacity} teams @ ${event.loc_venue} (${event.loc_city}, ${event.loc_region})\n[RobotEvents](https://www.robotevents.com/robot-competitions/vex-robotics-competition/${event.sku}.html)`
    );
  });

  return embed;
}

function makeEmbedFromPage(
  events: { capacity: string; open: string; event: EventsResponseObject }[],
  message: Message,
  page: number
) {
  const start = page * 5,
    end = start + 5;

  const subset = events.slice(start, end);
  const embed = makeEmbed(message);

  embed.setTitle(`Events (Page ${page})`);
  embed.setDescription(`For the current season`);

  constructFields(subset, embed);

  return embed;
}

async function getCapacityInformation(
  sku: string
): Promise<{ capacity: string; open: string }> {
  return html(
    `https://www.robotevents.com/robot-competitions/vex-robotics-competition/${sku}.html`
  )
    .then((html) => cheerio.load(html))
    .then(($) =>
      $(
        "#front-app > div.panel.panel-default > div.panel-body > div > div:nth-child(2) > p:nth-child(4)"
      ).text()
    )
    .then((text) => {
      let [capacity, open] = text.split(" / ").map((t) => t.split(": ")[1]);
      return { capacity, open };
    });
}

Command({
  names: ["events"],
  documentation: {
    description: "Lists events in a given region",
    usage: "events South Carolina",
    group: "VEX",
  },
  check: Permissions.all,
  async exec(message: Message, args: string[]) {
    let region = args
      .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(" ");

    let params: EventsRequestObject = {
      season: "current",
      status: ["future", "current"],
    };

    // Special cases
    switch (region) {
      case "All":
        break;
      case "Signature":
        params = {
          ...params,
          name: (name) => name.includes("Signature Event"),
        };
        break;
      default:
        params = { ...params, region };
        break;
    }

    const events = await Promise.all(
      (await vexdb.get("events", params))
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
        .map(async (event) => ({
          event,
          ...(await getCapacityInformation(event.sku)),
        }))
    );

    const embed = makeEmbedFromPage(events, message, 0);

    if (!events.length) {
      embed.addField("Empty", "No events have been listed!");
    }

    const response = (await message.channel.send({ embed })) as Message;
    await response.react("⬇");

    let page = 0;
    let lastPage = Math.ceil(events.length / 5);

    let resp;
    listen(
      response,
      ["⬇", "⬆"],
      (resp = async (reaction, collector) => {
        await response.clearReactions();

        console.log(reaction);

        if (reaction.emoji.name === "⬆" && page > 0) {
          page--;
        } else if (reaction.emoji.name === "⬇" && page < lastPage) {
          page++;
        }

        const embed = makeEmbedFromPage(events, message, page);
        await response.edit({ embed });
        listen(response, ["⬇", "⬆"], resp);

        if (page > 0) {
          response.react("⬆");
        }

        if (page < lastPage) {
          response.react("⬇");
        }
      })
    );

    return response;
  },
});
