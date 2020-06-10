import Command, { Permissions } from "../lib/command";
import { Message } from "discord.js";
import { behavior } from "../lib/access";
import { makeEmbed } from "../lib/util";

export const ConfigCommand = Command({
  names: ["config"],
  check: Permissions.any(
    Permissions.admin,
    Permissions.compose(Permissions.owner, Permissions.guild)
  ),

  documentation: {
    description: "Shows this servers configuration",
    usage: "config",
    group: "META",
  },

  async exec(message: Message) {
    if (!message.guild) {
      return;
    }

    const guild = message.guild;

    const server = behavior(guild.id);

    if (!server) {
      return message.channel.send(
        `No config is listed for ${guild.name}. Therefore, all server behaviors (logging, verification, probation, etc) are disabled.`
      );
    }

    const embed = makeEmbed(message);

    if (guild.icon) {
      const url = guild.iconURL();

      if (url) {
        embed.setAuthor(guild.name, url);
      }
    }

    embed.setTitle("Server Configuration");

    let body = "";

    for (const [behavior, value] of Object.entries(server)) {
      body += `**${behavior}**\n`;
      body += value + "\n";
    }

    embed.setDescription(body);

    console.log(body);

    return message.channel.send({ embed });
  },
});
