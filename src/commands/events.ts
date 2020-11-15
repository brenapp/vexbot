import { Message, MessageEmbed, MessageReaction } from "discord.js";
import Command, { Permissions } from "../lib/command";
import { makeEmbed } from "../lib/util";
import * as keya from "keya";

import * as robotevents from "robotevents";

import fetch from "isomorphic-fetch";
import cheerio from "cheerio";
import listen from "../lib/reactions";
import { Event } from "robotevents/out/endpoints/events";
import { CURRENT_SEASONS } from "./skills";

export async function html(url: string): Promise<string> {
  const store = await keya.store("fetched");
  const record = await store.get(url);

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
  events: { capacity: string; open: string; event: Event }[],
  embed: MessageEmbed
) {
  events.forEach(({ event, open, capacity }) => {
    embed.addField(
      `[${new Date(event.end.split("T")[0]).toLocaleDateString()}] ${
        event.name
      }`,
      `${open} open / ${capacity} teams @ ${event.location.venue} (${
        event.location.city
      }, ${event.location.region})\n[RobotEvents](${event.getURL()})`
    );
  });

  return embed;
}

function makeEmbedFromPage(
  events: { capacity: string; open: string; event: Event }[],
  message: Message,
  page: number,
  maxPage: number
) {
  const start = page * 5,
    end = start + 5;

  const subset = events.slice(start, end);
  const embed = makeEmbed(message);

  embed.setTitle(`Events (Page ${page} / ${maxPage})`);
  embed.setDescription(`For the current season`);

  constructFields(subset, embed);

  return embed;
}

async function getCapacityInformation(
  event: Event
): Promise<{ capacity: string; open: string }> {
  return html(event.getURL())
    .then((html) => cheerio.load(html))
    .then(($) =>
      $(
        "#front-app > div.panel.panel-default > div.panel-body > div > div:nth-child(2) > p:nth-child(4)"
      ).text()
    )
    .then((text) => {
      const [capacity, open] = text.split(" / ").map((t) => t.split(": ")[1]);
      return { capacity, open };
    });
}

export const EventsCommand = Command({
  names: ["events"],
  documentation: {
    description: "Lists events in a given region",
    usage: "events South Carolina",
    group: "VEX",
  },
  check: Permissions.all,
  async exec(message: Message, args: string[]) {
    const region = args
      .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(" ");

    // Get events for the given region, sorted into chronological order
    const listings = await robotevents.events
      .search({ season: CURRENT_SEASONS }, 24 * 60 * 60 * 1000)
      .then((events) => events.filter((ev) => ev.location.region === region));

    // Get event capacity from the HTML
    const capacity = await Promise.all(
      listings.map((ev) => getCapacityInformation(ev))
    );

    const events = listings.map((event, i) => ({ event, ...capacity[i] }));

    // Pagination (ironic because robotevents module flattens the API's
    // pagination)
    let page = 0;
    const lastPage = Math.ceil(events.length / 5) - 1;
    const embed = makeEmbedFromPage(events, message, page, lastPage);

    const response = (await message.channel.send({ embed })) as Message;
    await response.react("⬇");
    await response.react("⏬")

    let resp: (reaction: MessageReaction) => void;
    listen(
      response,
      ["⬇", "⬆", "⏬", "⏫"],
      (resp = async (reaction: MessageReaction) => {
        await response.reactions.removeAll();

        if (reaction.emoji.name === "⬆" && page > 0) {
          page--;
        } else if (reaction.emoji.name === "⬇" && page < lastPage) {
          page++;
        }

        if (reaction.emoji.name === "⏫") {
          page = 0;
        } else if (reaction.emoji.name === "⏬") {
          page = lastPage;
        }

        const embed = makeEmbedFromPage(events, message, page, lastPage);
        await response.edit({ embed });
        listen(response, ["⬇", "⬆", "⏫", "⏬"], resp);

        if (page > 0) {
          await response.react("⬆");
          await response.react("⏫")
        }

        if (page < lastPage) {
          await response.react("⬇");
          await response.react("⏬")
        }

      })
    );

    return response;
  },
});
