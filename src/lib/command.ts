import {
  Message,
  MessageEmbed,
  TextChannel,
  PartialMessage,
  Guild,
} from "discord.js";
import { authorization, config, behavior } from "./access";
import report from "./report";

const owner = authorization("discord.owner");
export const PREFIX = (process.env["DEV"]
  ? config("prefix.dev")
  : config("prefix.prod")) as string[];

/**
 * Identifies if a passed message is a commmand
 * @param message
 */
export function isCommand(message: Message): boolean {
  return PREFIX.includes(message.content[0]) && message.content.length > 1;
}

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
 * Actually handles the commands we send
 * @param message
 */
export async function handle(
  message: Message | PartialMessage
): Promise<boolean> {
  if (message.partial) {
    message = await message.fetch();
  }

  if (!isCommand(message)) return false;

  // Only respond to specific prefixes for this server (or any for DMs)
  const server = await behavior(message.guild?.id ?? "");
  if (
    !process.env["DEV"] &&
    server &&
    !server.prefixes.includes(message.content[0]) &&
    message.content[0] !== PREFIX[0]
  )
    return false;

  // Only let owners use commands in dev mode
  const owner = config("owner");
  if (process.env["DEV"] && message.author.id !== owner) {
    return false;
  }

  // Get the appropriate command, if it exists
  const command = matchCommand(message);
  if (!command) {
    message.channel.send(
      `No such command \`${message.content.slice(1).split(" ")[0]}\`. Use \`${
        PREFIX[0]
      }help\` for a list of commands`
    );
    return false;
  }

  if (message.guild) {
    const disabledCommands = DISABLED.get(message.guild);

    if (disabledCommands && disabledCommands.has(command)) {
      return false;
    }
  }

  // See if the command is allowed to be used by the permission system
  const allowed = await command.check.call(command, message);
  if (!allowed && command.fail) {
    command.fail.call(command, message);

    return true;
  }

  // Get the arguments
  const argstring = message.content
    .split(" ")
    .slice(1)
    .join(" ");
  let argv = argstring.match(/“([^“”]+)”|"([^"]+)"|'([^']+)'|([^\s]+)/g);

  // If we didn't get passed any, make argv just an empty array
  if (!argv) {
    argv = [];
  }

  // Start the timer (for when we edit the message later to indicate how long the command takes)
  const start = Date.now();

  let response: void | Message[] | Message;
  try {
    response = await command.exec.call(command, message, argv);
  } catch (e) {
    report(message.client)(e);

    if (command.error) {
      command.error(e, message, argv);
    } else {
      message.channel.send("Command execution failed. Try again later");
    }

    return true;
  }

  // If the command gave us a response to track
  if (response) {
    const resp = response instanceof Array ? response : [response];

    // Archive that resposne
    RESPONSES.set(message.id, resp);

    for (const message of resp) {
      // Add time to execute on the bottom of the message
      // If there isn't any attached embeds, then edit the message itself
      if (message.embeds.length < 1) {
        message.edit(
          message.content +
            ` *(took ${Date.now() - start}ms${
              process.env["DEV"] ? " — DEV MODE" : ""
            })*`
        );

        // Otherwise get the last embed and edit it;
      } else {
        const embed = message.embeds[0];
        const replacement = new MessageEmbed(embed);

        replacement.setFooter(
          embed.footer?.text +
            `\n(took ${Date.now() - start}ms${
              process.env["DEV"] ? " — DEV MODE" : ""
            })`
        );

        message.edit({ embed: replacement });
      }
    }
  }

  return true;
}

export const Permissions = {
  admin(message: Message): boolean {
    return (
      message.channel.type === "text" &&
      message.member !== null &&
      message.member.hasPermission("ADMINISTRATOR")
    );
  },

  owner(message: Message): boolean {
    return message.author.id === owner;
  },

  guild(message: Message): boolean {
    return message.channel.type == "text";
  },

  dm(message: Message): boolean {
    return message.channel.type === "dm";
  },

  env(parameter: string, value: string) {
    return (): boolean => process.env[parameter] === value;
  },

  channel(name: string) {
    return (message: Message): boolean =>
      (message.channel as TextChannel).name === name;
  },

  all(): boolean {
    return true;
  },

  compose(...checks: ((message: Message) => boolean | Promise<boolean>)[]) {
    return (message: Message): Promise<boolean> =>
      Promise.all(checks.map((check) => check(message))).then((resp) =>
        resp.every((r) => r)
      );
  },

  any(...checks: ((message: Message) => boolean | Promise<boolean>)[]) {
    return (message: Message): Promise<boolean> =>
      Promise.all(checks.map((check) => check(message))).then((resp) =>
        resp.some((r) => r)
      );
  },
};
