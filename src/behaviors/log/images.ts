import { addMessageHandler } from "../../lib/message";
import { TextChannel, Guild, Message, Attachment } from "discord.js";
import { client } from "../../client";

import { DEBUG } from "../../commands/debug";

addMessageHandler(async (message: Message) => {
  const channel = client.channels.get("613961623866179585") as TextChannel;

  if (!message.guild) {
    return false;
  }

  if (message.guild.id !== "387717101554499584") return false;

  if (message.attachments.size < 1) return false;

  channel.send(
    `${message.member.user.username}#${message.member.user.discriminator} in ${
      message.type === "dm" ? "DM" : message.channel.toString()
    }: ${message.cleanContent}`,
    {
      files: message.attachments.map((attach) => attach.url),
    }
  );

  return true;
});
