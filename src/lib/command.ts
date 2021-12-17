import { Message, TextChannel, PartialMessage, Guild, Interaction, CacheType, CommandInteraction } from "discord.js";
import { authorization, config, behavior } from "./access";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { debug } from "./debug";
import { SlashCommandBuilder } from "@discordjs/builders";
import { client } from "../client";

const owner = authorization("discord.owner");
export const PREFIX = (process.env["DEV"]
  ? config("prefix.dev")
  : config("prefix.prod")) as string[];

export type CommandResult = Promise<Message | Message[] | void> | void;

export interface CommandConfiguration {
  names: string[];

  documentation: {
    description: string;
    usage: string;
    group: string;
    hidden?: boolean;

    subcommand?: boolean;
  };

  // Lifecycle methods

  // See if it's valid to use the command (see the Permissions object below)
  check: (interaction: CommandInteraction<CacheType>) => boolean | Promise<boolean>;

  // If the check fails
  fail?: (interaction: CommandInteraction<CacheType>) => void;

  // Execute the command
  exec: (interaction: CommandInteraction<CacheType>) => void;
}

// Holds all the registered commands (with each name being mapped)
export const REGISTRY = new Map<string, CommandConfiguration>();

export function matchCommand(message: Message): null | CommandConfiguration {
  const name = message.content.slice(1).split(" ")[0];

  if (!REGISTRY.has(name)) {
    return null;
  }

  return REGISTRY.get(name) as CommandConfiguration;
}

/**
 * Adds new commands to the registry
 * @param config
 */
export default function registerCommand(
  config: CommandConfiguration
): CommandConfiguration {
  for (const name of config.names) {
    REGISTRY.set(name, config);
  }

  return config;
}

// Handles all of the commands we've already executed
// Command (from user) => Response (from vexbot)
export const RESPONSES = new Map<string, Message[]>();

// Commands that are disabled go here
export const DISABLED = new Map<Guild, Set<CommandConfiguration>>();

/**
 * Registers slash commands with discord
 */
export async function register() {
  const token = authorization("discord.token") as string;
  const clientID = authorization("discord.id") as string;
  const rest = new REST({ version: '9' }).setToken(token);

  debug("Registering slash commands...");
  const commands = Array.from(REGISTRY.values()).map(config => {
    const builder = new SlashCommandBuilder()
      .setName(config.names[0])
      .setDescription(config.documentation.description)
      .setDefaultPermission(true);
      
      return builder.toJSON();
  });
  const guilds = await client.guilds.fetch();
  guilds.forEach(async (guild) => {
    await rest.put(
      Routes.applicationGuildCommands(clientID, guild.id),
      { body: commands }
    );
  });
};

export async function handle(interaction: Interaction<CacheType>) {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const command = REGISTRY.get(commandName);
  if (!command) {
    return interaction.reply(`Unknown command \`${commandName}\``);
  };

  const valid = await command.check(interaction);
  if (!valid) {
    if (command.fail) {
      return command.fail(interaction);
    }
    return;
  };

  await command.exec(interaction);
};