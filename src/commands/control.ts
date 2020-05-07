import Command, { DISABLED, Permissions, REGISTRY } from "../lib/command";
import { Message, TextChannel } from "discord.js";

/**
 * Locks a specific channel
 */

Command({
  names: ["lock"],
  check: Permissions.admin,

  documentation: {
    description: "Locks a channel",
    usage: "locks",
    group: "admin",
  },

  exec(message: Message, args: string[]) {
    const channel = message.channel as TextChannel;

    channel.overwritePermissions(channel.guild.defaultRole, {
      SEND_MESSAGES: false,
    });

    return message.channel.send("Channel locked");
  },
});

/**
 * Unlocks a channel
 */

Command({
  names: ["unlock"],
  check: Permissions.admin,

  documentation: {
    description: "Unlocks a channel",
    usage: "unlock",
    group: "admin",
  },

  exec(message: Message) {
    const channel = message.channel as TextChannel;

    channel.overwritePermissions(channel.guild.defaultRole, {
      SEND_MESSAGES: null,
    });

    return message.channel.send("Channel unlocked");
  },
});

/**
 * Command Enable
 */

Command({
  names: ["disable"],
  check: Permissions.admin,

  documentation: {
    description: "Disables vexbot commands",
    usage: "disable <command1> <command2> ...",
    group: "admin",
  },

  exec(message: Message, commands: string[]) {
    for (const command of commands) {
      const config = REGISTRY.get(command);
      DISABLED.add(config);
    }
  },
});

Command({
  names: ["enable"],
  check: Permissions.admin,

  documentation: {
    description: "Enables vexbot commands",
    usage: "disable <command1> <command2> ...",
    group: "admin",
  },

  exec(message: Message, commands: string[]) {
    for (const command of commands) {
      const config = REGISTRY.get(command);
      DISABLED.delete(config);
    }
  },
});
