import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import {
  CacheType,
  CommandInteraction,
  Interaction,
  Message,
} from "discord.js";
import { token, clientID } from "~secret/discord.json";
import { Routes } from "discord-api-types/v9";

export type CommandResult = Promise<Message | Message[] | void> | void;

export interface CommandConfiguration {
  names: string[];

  documentation: {
    description: string;
    options?(builder: SlashCommandBuilder): Partial<SlashCommandBuilder>;
  };

  // See if it's valid to use the command (see the Permissions object below)
  check: PermissionFunction;

  // If the check fails
  fail?: (interaction: CommandInteraction<CacheType>) => void;

  // Execute the command
  exec: (interaction: CommandInteraction<CacheType>) => void;
}

// All of the commands currently registered with the bot
export const COMMANDS = new Map<string, CommandConfiguration>();

/**
 * Registers a command with the bot. Note: this does not deploy the command to discord. In
 * development, commands are propagated to the development guild on each iteration. To deploy a
 * command in a production, use the deploy slash command.
 *
 * @param config The configuration for the command
 * @returns void
 */
export default function registerCommand(
  config: CommandConfiguration
): CommandConfiguration {
  for (const name of config.names) {
    COMMANDS.set(name, config);
  }

  return config;
}

const rest = new REST({ version: "9" }).setToken(token);

/**
 * Used for development, deploy slash commands to a specific guild. This should be done at startup,
 * with the development guild ID.
 *
 * @param guildID The guild to deploy to
 * @returns resolves if successful, rejects if not
 */
export async function deployGuildCommands(guildID: string) {
  const commands = [];
  for (const [name, config] of COMMANDS.entries()) {
    let command: Partial<SlashCommandBuilder> = new SlashCommandBuilder()
      .setName(name)
      .setDescription(config.documentation.description);

    if (config.documentation.options) {
      command = config.documentation.options(command as SlashCommandBuilder);
    }

    commands.push(command.toJSON!());
  }

  return rest.put(Routes.applicationGuildCommands(clientID, guildID), {
    body: commands,
  });
}

/**
 * Deploy commands in production.
 */
export async function deployApplicationCommands() {
  const commands = [];
  for (const [name, config] of COMMANDS.entries()) {
    let command: Partial<SlashCommandBuilder> = new SlashCommandBuilder()
      .setName(name)
      .setDescription(config.documentation.description);

    if (config.documentation.options) {
      command = config.documentation.options(command as SlashCommandBuilder);
    }

    commands.push(command.toJSON!());
  }

  return rest.put(Routes.applicationCommands(clientID), {
    body: commands,
  });
}

export async function handleCommand(interaction: Interaction<CacheType>) {
  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;

  const config = COMMANDS.get(commandName);
  if (!config) {
    interaction.reply("Unknown command!");
    return;
  }

  // Check permissions
  const authorized = await config.check(interaction);

  if (authorized) {
    config.exec(interaction);
  } else {
    if (config.fail) {
      config.fail(interaction);
    } else {
      interaction.reply("You don't have permission to use that command!");
    }
  }
}

type PermissionFunction = (
  interaction: CommandInteraction<CacheType>
) => boolean | Promise<boolean>;

export const Permissions = {
  always: () => true,

  user: (id: string) => {
    return (interaction: CommandInteraction<CacheType>) =>
      interaction.user.id === id;
  },

  channel: (id: string) => {
    return (interaction: CommandInteraction<CacheType>) =>
      interaction.channelId === id;
  },

  dm: (interaction: CommandInteraction<CacheType>) => {
    return interaction.channel?.type === "DM";
  },

  guild: (id: string) => {
    return (interaction: CommandInteraction<CacheType>) =>
      interaction.guildId === id;
  },

  not: (fn: PermissionFunction) => {
    return async (interaction: CommandInteraction<CacheType>) =>
      !(await fn(interaction));
  },

  admin: async (interaction: CommandInteraction<CacheType>) => {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    return member?.permissions.has("ADMINISTRATOR") ?? false;
  },

  all:
    (...permissions: PermissionFunction[]) =>
    async (interaction: CommandInteraction<CacheType>) => {
      const all = await Promise.all(permissions.map((p) => p(interaction)));
      return all.every((p) => p);
    },

  any:
    (...permissions: PermissionFunction[]) =>
    async (interaction: CommandInteraction<CacheType>) => {
      const all = await Promise.all(permissions.map((p) => p(interaction)));
      return all.some((p) => p);
    },
};
