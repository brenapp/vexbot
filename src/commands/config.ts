import Command, { Permissions, Subcommand, Group } from "../lib/command";
import { Message } from "discord.js";
import { behavior } from "../lib/access";
import { makeEmbed } from "../lib/util";

const check = Permissions.any(
  Permissions.admin,
  Permissions.compose(Permissions.owner, Permissions.guild)
);

export const ConfigListCommand = Subcommand({
  names: ["list"],
  check,

  documentation: {
    description: "Shows this servers configuration",
    usage: "config list",
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

const subcommands = [ConfigListCommand];

export const ConfigCommand = Command({
  names: ["config"],

  documentation: {
    description: "Utilites for managing the server configuration",
    usage: "config",
    group: "META",
  },

  check,
  exec: Group(subcommands),
  subcommands,
});
