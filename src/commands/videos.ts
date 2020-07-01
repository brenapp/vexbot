/**
 * Search for videos about a specific team
 *
 * It will do the following (cached) actions:
 *  - Look at events this team has gone to, and try and find livestreams
 *  - Search YouTube for videos that mention the team in the title or description
 *
 */

import * as robotevents from "robotevents";
import fetch from "node-fetch";
import Command, { Permissions } from "../lib/command";
import { Message } from "discord.js";
import { ProgramAbbr } from "robotevents/out/endpoints/programs";
import { makeEmbed } from "../lib/util";
import { google, youtube_v3 } from "googleapis";
import { authorization } from "../lib/access";
import { Team } from "robotevents/out/endpoints/teams";
import { Year } from "robotevents/out/endpoints/seasons";
import * as keya from "keya";

const youtube = google.youtube({
  version: "v3",
  auth: authorization("youtube") as string,
});

/**
 * Searches body for a substring starting with start and ending with end.
 * Returns null if no substring is found
 * @param start Starting substring
 * @param end Ending substring
 * @param body string to search
 */
function matchRange(
  start: string,
  end: string,
  body: string
): [number, number] | null {
  const s = body.indexOf(start);
  if (s < 0) {
    return null;
  }

  for (let i = s; i < body.length; i++) {
    const ending = body.substring(i, i + end.length);
    if (ending === end) {
      return [s, i + end.length];
    }
  }

  return null;
}

/**
 * Finds the associated YouTube livestream link
 * @param sku
 */
async function findEventLivestream(sku: string): Promise<string | null> {
  const event = await robotevents.events.get(sku);
  if (!event) {
    return null;
  }

  // Get the event on RobotEvents
  try {
    const response = await fetch(event.getURL(), { redirect: "error" });

    if (!response.ok) {
      return null;
    }

    // Look I know this is bad practice, but the HTML that RobotEvents returns
    // is so malformed that Cheerio can't even parse it. This is fairly
    // fragile but should be good enought
    const html = await response.text();
    const result = matchRange(`<tab name="Webcast">`, `</tab>`, html);

    if (!result) {
      return null;
    }

    // Get the webcast tab
    const tab = html.substring(result[0], result[1]);

    // Search for links
    const youtube = tab.match(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
    );

    return youtube?.[0] ?? null;
  } catch (e) {
    return null;
  }
}

async function searchForTeamVideos(team: Team, year_start: number) {
  const store = await keya.store<youtube_v3.Schema$Video[]>("teamvideos");

  // Check for cached values
  const record = await store.get(team.id.toString());

  if (record) {
    return record;
  }

  // Get the start filter
  const start = new Date();
  start.setFullYear(year_start, 4, 1);
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);

  // End filter
  const end = new Date(start);
  end.setFullYear(year_start + 1, 4, 1);

  // Search query
  const search = await youtube.search.list({
    q: `${team.number} ${team.program.code}`,
    publishedAfter: start.toISOString(),
    publishedBefore: end.toISOString(),
    part: ["snippet"],
    type: ["video"],
    maxResults: 20,
  });

  if (!search.data.items) {
    return [];
  }

  const id = search.data.items.map((item) => item.id?.videoId) as string[];
  const info = await youtube.videos.list({ part: ["snippet", "id"], id });

  if (!info.data.items) {
    return [];
  }

  // Only include videos which include the number in key sections
  const relevant = info.data.items.filter(
    (video) =>
      video.snippet &&
      (video.snippet?.title?.includes(team.number) ||
        video.snippet?.description?.includes(team.number) ||
        video.snippet?.channelTitle?.includes(team.number))
  );

  // Save in cache
  await store.set(team.id.toString(), relevant);

  return relevant;
}

export const VideosCommand = Command({
  names: ["videos", "video", "vid"],

  documentation: {
    description: "Finds videos that feature a team",
    group: "VEX",
    usage: "vid BCUZ 2019-2020 [VEXU]",
  },

  check: Permissions.all,

  async exec(message: Message, [number, year, program]: string[]) {
    const team = await robotevents.teams.get(number, program as ProgramAbbr);

    if (!team) {
      return message.channel.send(
        `Could not find${program ? ` ${program}` : ""} team \`${number}\``
      );
    }

    if (!year) {
      year = "2020-2021";
    }

    if (!year.match(/[0-9]+-[0-9]+/)) {
      return message.channel.send(`Year must look like "2019-2020"`);
    }

    // Get all events they've gone to (for livestream links)
    const season = robotevents.seasons.get(team.program.code, year as Year);

    if (!season) {
      return message.channel.send(
        `Program ${team.program.code} has no season for ${year}`
      );
    }

    const progress = await message.channel.send("Searching for videos...");
    message.channel.startTyping();

    // Search for livestreamed events

    const events = await team.events({ season: [season] });

    let body = "**Livestreams:** \n";
    let foundSome = false;

    for (const event of events.values()) {
      const link = await findEventLivestream(event.sku);

      if (link) {
        body += `*${event.name}*\n`;
        body += `${link}\n`;
        foundSome = true;
      }
    }

    if (!foundSome) {
      body += `*Empty*\n`;
    }

    foundSome = false;
    body += `\n**Youtube Videos:**\n`;

    // Search for videos on Youtube
    const videos = await searchForTeamVideos(team, +year.split("-")[0]);

    for (const video of videos) {
      body += `[${video.snippet?.title}](https://youtu.be/${video.id})\n`;
    }

    const embed = makeEmbed(message).setDescription(body);

    message.channel.stopTyping();
    progress.delete();
    return message.channel.send({ embed });
  },
});
