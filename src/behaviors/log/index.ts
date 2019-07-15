import { addMessageHandler } from "../../lib/message";
import { TextChannel, Guild, Message } from "discord.js";
import { client } from "../../client";

import "./important";
import { DEBUG } from "../../commands/debug";

function matchAll(str: string, re: RegExp) {
  return (str.match(re) || [])
    .map(e => RegExp(re.source, re.flags).exec(e))
    .filter(v => v !== null);
}

async function clean(message: Message) {
  let content = message.content;




  const roles = await Promise.all(
    matchAll(content, /\<\@\&([0-9]+)\>/g).map(async match => ({
      key: match[0],
      role: message.guild.roles.get(match[1])
    }))
  );
  const members = await Promise.all(
    matchAll(content, /\<\@\!([0-9]+)\>/g).map(async match => ({
      key: match[0],
      member: message.guild.members.get(match[1])
    }))
  );

  // Replace mentions
  roles.forEach(
    ({ key, role }) => (content = content.replace(key, `@[ROLE: ${role.name}]`))
  );
  members.forEach(
    ({ key, member }) =>
      (content = content.replace(key, `@[MEMBER: ${member.nickname}]`))
  );

  return content;
}

addMessageHandler(async message => {
  let log: TextChannel;
  if (message.channel.type === "dm") {
    return false;
  } else {
    log = message.guild.channels.find(
      channel => channel.name === "server-log"
    ) as TextChannel;
  }

  if (message.author.bot) return true;

  if (!log) return false;
  if (process.env["DEV"] && !DEBUG) return false;

  log.send(
    `${message.member.user.username}#${message.member.user.discriminator} in ${
      message.type === "dm" ? "DM" : message.channel.toString()
    }: ${await clean(message)}`,
    {
      files: message.attachments.map(attach => attach.url)
    }
  );

  return false;
});

client.on("messageUpdate", (old, current) => {
  let log;
  if (old.channel.type === "dm") {
    return false;
  } else {
    log = old.guild.channels.find(
      channel => channel.name === "server-log"
    ) as TextChannel;
  }

  if (!log) return false;
  if (old.author.bot) return false;

  log.send(
    `${old.member.user.username}#${old.member.user.discriminator} in ${
      old.type === "dm" ? "DM" : old.channel.toString()
    }: ${old.content.toString()} => ${current.content.toString()}`
  );
});
