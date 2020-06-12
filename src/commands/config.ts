import Command, { Permissions, Subcommand, Group } from "../lib/command";
import { Message, Guild } from "discord.js";
import {
  behavior,
  setBehavior,
  ServerConfiguration,
  config,
} from "../lib/access";
import { makeEmbed } from "../lib/util";
import { client } from "../client";

const check = Permissions.any(Permissions.admin, Permissions.owner);

export const ConfigListCommand = Subcommand({
  names: ["list"],
  check,

  documentation: {
    description: "Shows this servers configuration",
    usage: "list",
    group: "META",
  },

  async exec(message: Message, [passedGuild]: string[]) {
    let guild: Guild;

    if (passedGuild) {
      if (!Permissions.owner(message))
        return message.channel.send(
          "Cannot access other guild configuration files"
        );

      const g = client.guilds.cache.get(passedGuild);

      if (!g) return message.channel.send("Cannot access that guild");
      guild = g;
    } else if (message.guild) {
      guild = message.guild;
    } else {
      return;
    }

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

    body +=
      "\nFor more information about these properties, go to https://vexbot.bren.app/docs/";

    embed.setDescription(body);

    return message.channel.send({ embed });
  },
});

const validPrefixes = config("prefix.prod") as string[];

const booleanValue = (setting: string) =>
  setting === "true" || setting === "false";

const validators: {
  [P in keyof ServerConfiguration]: (setting: string) => boolean;
} = {
  "event-log": booleanValue,
  "server-log": booleanValue,
  verify: booleanValue,
  "team-roles": booleanValue,
  probation: booleanValue,

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

  async exec(
    message: Message,
    [setting, value]: [keyof ServerConfiguration, string]
  ) {
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
        `Invalid setting value. Refer to documentation at https://vexbot.bren.app/docs/`
      );
    }

    // Final processing
    let set: string | boolean = value;

    // Turn boolean strings into just booleans
    if (validators[setting] === booleanValue) {
      set = value === "true";
    }

    await setBehavior(guild.id, { [setting]: set });
    return ConfigListCommand.exec(message, []);
  },
});

export const ConfigAllCommand = Subcommand({
  names: ["all"],
  check,

  documentation: {
    description: "Shows all server configurations",
    usage: "list",
    group: "META",
    hidden: true,
  },

  async exec(message: Message) {
    const guilds = client.guilds.cache.values();

    for (const guild of guilds) {
      ConfigListCommand.exec(message, [guild.id]);
    }
  },
});

const subcommands = [ConfigListCommand, ConfigSetCommand, ConfigAllCommand];

export const ConfigCommand = Command({
  names: ["config"],

  documentation: {
    description: "Utilites for managing the server configuration",
    usage: "config",
    group: "META",
  },

  check,

  // Group command, listing the current config when nothing else matches
  exec: Group(subcommands, ConfigListCommand.exec),
  subcommands,

  fail(message: Message) {
    return message.channel.send(
      "Only administrators are allowed to update server configuration"
    );
  },
});
