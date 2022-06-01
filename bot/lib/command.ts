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
    options?(builder: SlashCommandBuilder): SlashCommandBuilder;
  };

  // See if it's valid to use the command (see the Permissions object below)
  check: (
    interaction: CommandInteraction<CacheType>
  ) => boolean | Promise<boolean>;

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
    let command = new SlashCommandBuilder()
      .setName(name)
      .setDescription(config.documentation.description);

    if (config.documentation.options) {
      command = config.documentation.options(command);
    }

    commands.push(command.toJSON());
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
    let command = new SlashCommandBuilder()
      .setName(name)
      .setDescription(config.documentation.description);

    if (config.documentation.options) {
      command = config.documentation.options(command);
    }

    commands.push(command.toJSON());
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

export const Permissions = {
  all: () => true,
};
