import { Message, TextChannel, Guild } from "discord.js";
import { information } from "../lib/report";

import { client } from "../client";
import { getLastCommit, Commit } from "git-last-commit";

const getCommit = () =>
  new Promise<Commit>((res, rej) => {
    getLastCommit((err, commit) => (err ? rej(err) : res(commit)));
  });

export let DEBUG = false;

const info = information(client);
export const debug = (m: string, context?: Message | Guild): void => {
  let location: string | null = null;
  let author: string | null = null;
  let content: string | null = null;

  if (context && context instanceof Message) {
    location = context.channel.type;

    author = `${context.author.username}#${context.author.discriminator}`;

    content = context.content;
  } else if (content && context instanceof Guild) {
    location = `${context.name} (${context.id})`;
  }

  const log = `[${new Date().toISOString()}] [${
    process.env["DEV"] ? "DEV" : "PROD"
  }] ${m}${location ? ` I: ${location}` : ""}${author ? ` A: ${author}` : ""}${
    content ? ` "${content}"` : ""
  }`;

  DEBUG ? info(log) : console.log(log);
};