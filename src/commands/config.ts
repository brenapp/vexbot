import Command, { Permissions, Subcommand, Group } from "../lib/command";
import { Message } from "discord.js";
import { behavior, setBehavior } from "../lib/access";
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
    usage: "list",
    group: "META",
  },

  async exec(message: Message) {
    if (!message.guild) {
      return;
    }

    const guild = message.guild;

    const server = await behavior(guild.id);

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

    return message.channel.send({ embed });
  },
});

export const ConfigSetCommand = Subcommand({
  names: ["set"],
  check,

  documentation: {
    description: "Set a configuration for this server",
    usage: "set server-log true",
    group: "META",
  },

  async exec(message: Message, [setting, value]: [string, string]) {
    if (!message.guild) {
      return;
    }
    const settings = ["server-log", "probation", "event-log", "verify"];
    const guild = message.guild;

    if (!setting || !settings.includes(setting)) {
      return message.channel.send(
        `Unknown setting ${setting}. Valid settings are ${settings.join(", ")}.`
      );
    }

    if (value !== "true" && value !== "false") {
      return message.channel.send(
        `Unknown setting value. Use true to enable or false to disable`
      );
    }

    await setBehavior(guild.id, { [setting]: value });
    return ConfigListCommand.exec(message, []);
  },
});

const subcommands = [ConfigListCommand, ConfigSetCommand];

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

  fail(message: Message) {
    return message.channel.send(
      "Only administrators are allowed to update server configuration"
    );
  },
});
