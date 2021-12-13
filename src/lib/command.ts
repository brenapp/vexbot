import { Message, TextChannel, PartialMessage, Guild, Interaction } from "discord.js";
import { authorization, config, behavior } from "./access";
import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v9"
import { debug } from "./debug";
import { SlashCommandBuilder } from "@discordjs/builders";

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
  check: (message: Message) => boolean | Promise<boolean>;

  // If the check fails
  fail?: (message: Message) => void;

  // Execute the command
  exec(message: Message, args: string[]): CommandResult;

  // Error handling
  error?(error: string, message: Message, args: string[]): void;

  // Holds subcommands (for help configuration)
  subcommands?: CommandConfiguration[];
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

/**
 * Subcommand registration
 * @param config
 */
export function Subcommand(config: CommandConfiguration): CommandConfiguration {
  config.documentation.subcommand = true;

  return config;
}

/**
 * Function to replace (or compose with) CommandConfiguration.exec() for when commands need to be grouped together
 * @param commands
 */
export function Group(
  commands: CommandConfiguration[],
  defaultMatch?: (message: Message, argv: string[]) => CommandResult
) {
  return async (
    message: Message,
    args: string[]
  ): Promise<Message | Message[] | void> => {
    const [subcommand, ...arg] = args;

    for (const command of commands) {
      if (command.names.includes(subcommand)) {
        // See if permissions valid
        const valid = await command.check(message);
        if (!valid) {
          if (command.fail) {
            command.fail(message);
          }
          return;
        }

        return command.exec(message, arg);
      }
    }

    // If we couldn't find a subcommand, use the default match
    if (defaultMatch) {
      return defaultMatch(message, args);
    } else {
      return message.channel.send(
        `Unknown subcommand \`${subcommand}\`. Use \`help\` for list of valid commands`
      );
    }
  };
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


};