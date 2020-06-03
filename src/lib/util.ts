import { Message, MessageEmbed } from "discord.js";

export function code(text: string): string {
  return `\`\`\`${text}\`\`\``;
}

export function inline(text: string): string {
  return `\`${text}\``;
}

export function escape(text: string): string {
  /*eslint no-control-regex: "off"*/
  return (text + "").replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
}

export function makeEmbed(message?: Message): MessageEmbed {
  const embed = new MessageEmbed().setTimestamp();

  if (message) {
    const invoker = message?.member?.displayName ?? message.author.username;
    embed.setFooter(`Invoked by ${invoker}`);
  }

  return embed;
}
