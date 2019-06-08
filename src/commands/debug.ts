import Command, { Permissions } from "../lib/command";
import { Message } from "discord.js";

import * as vexdb from "vexdb";
import * as keya from "keya";

export let DEBUG = false;

export class GrantCommand extends Command("grant") {
  check(message) {
    return Permissions.owner(message) && Permissions.guild(message);
  }

  exec(message: Message, args: string[]) {
    const role = message.guild.roles.find(role => role.name === args.join(" "));
    message.member.addRole(role);
  }
}

new GrantCommand();

export class DebugCommand extends Command("debug") {
  check(message) {
    return Permissions.owner(message) && Permissions.guild(message);
  }

  exec(message: Message, args: string[]) {
    DEBUG = !DEBUG;
    message.channel.send(`Debug ${DEBUG ? "ENABLED" : "DISABLED"}`);
  }
}

new DebugCommand();

export class CacheCommand extends Command("cache") {
  check(message) {
    return Permissions.owner(message) && Permissions.guild(message);
  }

  async exec(message: Message, args: string[]) {
    switch (args[0]) {
      case "clear":
        vexdb.cache.clear();
        return message.channel.send("Cache Cleared");
        break;
      case "list":
        const store = await keya.store("vexdb");
        const cache = (await store.all()).map(v => v.value);
        return message.channel.send(
          ["VexDB Current Cache", ...cache].join("\n")
        );
        break;
    }
  }
}

new CacheCommand();
