import Command, { DISABLED, Permissions, REGISTRY } from "../lib/command";
import { Message, TextChannel } from "discord.js";

/**
 * Locks a specific channel
 */

export const LockCommand = Command({
  names: ["lock"],
  check: Permissions.admin,

  documentation: {
    description: "Locks a channel",
    usage: "locks",
    group: "admin",
  },

  exec(message: Message) {
    const channel = message.channel as TextChannel;

    channel.createOverwrite(channel.guild.roles.everyone, {
      SEND_MESSAGES: false,
      VIEW_CHANNEL: null,
    });

    return message.channel.send("Channel locked");
  },
});

/**
 * Unlocks a channel
 */

export const UnlockCommand = Command({
  names: ["unlock"],
  check: Permissions.admin,

  documentation: {
    description: "Unlocks a channel",
    usage: "unlock",
    group: "admin",
  },

  exec(message: Message) {
    const channel = message.channel as TextChannel;

    channel.lockPermissions();

    return message.channel.send("Channel unlocked");
  },
});

/**
 * Command Enable
 */

export const DisableCommand = Command({
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

      if (!config) {
        return message.channel.send(`Could not find command \`${command}\`!`);
      }

      DISABLED.add(config);
    }

    return message.channel.send(`Disabled ${commands.length} command(s)!`);
  },
});

export const EnableCommand = Command({
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

      if (!config) {
        return message.channel.send(`Could not find command \`${command}\`!`);
      }

      DISABLED.delete(config);
    }

    return message.channel.send(`Enabled ${commands.length} command(s)!`);
  },
});
