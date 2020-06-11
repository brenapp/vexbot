import Command, { Permissions, Subcommand, Group } from "../lib/command";
import { Message } from "discord.js";
import {
  behavior,
  setBehavior,
  ServerConfiguration,
  config,
} from "../lib/access";
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
      body += (value instanceof Array ? value.join("") : value) + "\n";
    }

    embed.setDescription(body);

    return message.channel.send({ embed });
  },
});

const validPrefixes = config("prefix.prod") as string[];

const bool = (setting: string) => setting === "true" || setting === "false";
const validators: {
  [P in keyof ServerConfiguration]: (setting: string) => boolean;
} = {
  "event-log": bool,
  "server-log": bool,
  verify: bool,
  probation: bool,
  prefixes: (setting) =>
    setting.split("").every((s) => validPrefixes.includes(s)),
};

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
    const settings = Object.keys(validators);
    const guild = message.guild;

    if (!setting || !settings.includes(setting)) {
      return message.channel.send(
        `Unknown setting ${setting}. Valid settings are ${settings.join(", ")}.`
      );
    }

    const valid = validators[setting as keyof ServerConfiguration](value);

    if (!valid) {
      if (setting === "prefixes") {
        return message.channel.send(
          `Acceptable vexbot prefixes are \`${validPrefixes.join("")}\``
        );
      }

      return message.channel.send(
        `Invalid setting value. Refer to documentation at https://vexbot.bren.app`
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
