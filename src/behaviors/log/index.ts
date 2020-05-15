import { addMessageHandler } from "../../lib/message";
import { TextChannel, Guild, Message } from "discord.js";
import { client } from "../../client";

import "./important";
import "./images";
import { DEBUG } from "../../commands/debug";
import report from "../../lib/report";

function matchAll(str: string, re: RegExp) {
  return (str.match(re) || [])
    .map((e) => RegExp(re.source, re.flags).exec(e))
    .filter((v) => v !== null);
}

async function clean(message: Message) {
  let content = message.content;

  const roles = await Promise.all(
    matchAll(content, /\<\@\&([0-9]+)\>/g).map(async (match) => ({
      key: (match as RegExpExecArray)[0],
      role: (message.guild as Guild).roles.cache.get(
        (match as RegExpExecArray)[1]
      ),
    }))
  );
  const members = await Promise.all(
    matchAll(content, /\<\@\!([0-9]+)\>/g).map(async (match) => ({
      key: (match as RegExpExecArray)[0],
      member: (message.guild as Guild).members.cache.get(
        (match as RegExpExecArray)[1]
      ),
    }))
  );

  // Replace mentions
  roles.forEach(
    ({ key, role }) =>
      (content = content.replace(key, `@[ROLE: ${role?.name}]`))
  );
  members.forEach(
    ({ key, member }) =>
      (content = content.replace(key, `@[MEMBER: ${member?.nickname}]`))
  );

  return content;
}

addMessageHandler(async (message) => {
  if (message.channel.type === "dm") {
    return false;
  }
  let log = message.guild?.channels.resolve("server-log") as TextChannel;
  if (!log) {
    report(client)(new Error("Could not find server log channel"));
  }

  if (message.author.bot) return true;

  if (process.env["DEV"] && !DEBUG) return false;

  log.send(
    `${message.author.username}#${
      message.author.discriminator
    } in ${message.channel.toString()}: ${await clean(message)}`,
    {
      files: message.attachments.map((attach) => attach.url),
    }
  );

  return false;
});

client.on("messageUpdate", async (old, current) => {
  if (old.partial) {
    old = await old.fetch();
  }

  if (current.partial) {
    current = await current.fetch();
  }

  if (old.channel.type === "dm") {
    return false;
  }
  let log = old.guild?.channels.resolve("server-log") as TextChannel;
  if (!log) {
    report(client)(new Error("Could not find server log channel"));
  }

  if (old.author.bot) return true;

  if (process.env["DEV"] && !DEBUG) return false;

  log.send(
    `${old.author.username}#${
      old.author.discriminator
    } in ${old.channel.toString()}: ${old.content.toString()} => ${current.content.toString()}`
  );
});
