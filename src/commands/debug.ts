import Command, { Permissions, makeEmbed } from "../lib/command";
import { Message } from "discord.js";

import * as vexdb from "vexdb";
import * as keya from "keya";

export let DEBUG = false;

export class GrantCommand extends Command("grant") {
  check = Permissions.compose(
    Permissions.guild,
    Permissions.owner
  );

  documentation() {
    return {
      usage: "grant Role",
      description: "Grants the user a role",
      group: "Owner Only"
    };
  }

  exec(message: Message, args: string[]) {
    const role = message.guild.roles.find(role => role.name === args.join(" "));

    if (!role) {
      return message.channel.send("Can't find that role!");
    }

    message.member.addRole(role);
  }
}

new GrantCommand();

export class DebugCommand extends Command("debug") {
  check = Permissions.compose(
    Permissions.guild,
    Permissions.owner
  );

  documentation() {
    return {
      description: "Toggles debug mode. Owner Only Command",
      usage: "debug",
      group: "Owner Only"
    };
  }

  exec(message: Message, args: string[]) {
    DEBUG = !DEBUG;
    message.channel.send(`Debug ${DEBUG ? "ENABLED" : "DISABLED"}`);
  }
}

new DebugCommand();

export class CacheCommand extends Command("cache") {
  check = Permissions.compose(
    Permissions.guild,
    Permissions.owner
  );

  documentation() {
    return {
      description: "Cache Management",
      usage: "cache [clear|list]",
      group: "Owner Only"
    };
  }

  async exec(message: Message, args: string[]) {
    switch (args[0]) {
      case "clear":
        vexdb.cache.clear();
        return message.channel.send("Cache Cleared");
        break;
      case "list":
      default:
        const store = await keya.store("vexdb");
        const cache = (await store.all()).map(v => v.key);

        const embed = makeEmbed(message)
          .setTitle("VexDB Cache")
          .setDescription(
            cache.slice(0, 10).join("\n") +
              `\n\n*(${cache.length - 10} more items)*`
          );

        return message.channel.send({ embed });

        break;
    }
  }
}

new CacheCommand();

export class PingCommand extends Command("ping") {
  check = Permissions.all;

  documentation() {
    return {
      description: "Heartbeat",
      usage: `ping`,
      group: "Meta"
    };
  }

  async exec(message: Message, args: string[]) {
    return message.reply("Pong!");
  }
}

new PingCommand();
