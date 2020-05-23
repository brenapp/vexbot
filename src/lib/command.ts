import {
  Message,
  Guild,
  MessageEmbed,
  TextChannel,
  PartialMessage,
} from "discord.js";
import { authorization, config } from "./access";
import { makeEmbed } from "./util";
import report from "./report";

const owner = authorization("discord.owner");
export const PREFIX: string[] = process.env["DEV"]
  ? config("prefix.dev")
  : config("prefix.prod");

/**
 * Identifies if a passed message is a commmand
 * @param message
 */
export function isCommand(message: Message) {
  return PREFIX.includes(message.content[0]);
}

export interface CommandConfiguration {
  // Allow the user to add other properties for state or whatever
  [key: string]: any;

  names: string[];

  documentation: {
    description: string;
    usage: string;
    group: string;
    hidden?: boolean;
  };

  // Lifecycle methods

  // See if it's valid to use the command (see the Permissions object below)
  check: (message: Message) => boolean | Promise<boolean>;

  // If the check fails
  fail?: (message: Message) => void;

  // Execute the command
  exec(
    message: Message,
    args: string[]
  ): Promise<Message | Message[] | void> | void;

  // Error handling
  error?(error: any, message: Message, args: string[]): void;
}

// Holds all the registered commands (with each name being mapped)
export const REGISTRY = new Map<string, CommandConfiguration>();

export function matchCommand(message: Message) {
  const name = message.content.slice(1).split(" ")[0];

  if (!REGISTRY.has(name)) {
    return null;
  }

  return REGISTRY.get(name);
}

/**
 * Adds new commands to the registry
 * @param config
 */
export default function makeCommand(config: CommandConfiguration) {
  for (const name of config.names) {
    REGISTRY.set(name, config);
  }

  return config;
}

// Handles all of the commands we've already executed
export const RESPONSES = new Map<Message, Message>();

// Commands that are disabled go here
export const DISABLED = new Set<CommandConfiguration>();

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

  // Check if the command is disabled
  const disabled = DISABLED.has(command);
  if (disabled && !Permissions.owner(message)) {
    return false;
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
    const main = response instanceof Array ? response[0] : response;

    // Archive that resposne
    RESPONSES.set(message, main);

    // Add time to execute on the bottom of the message
    // If there isn't any attached embeds, then edit the message itself
    if (main.embeds.length < 1) {
      main.edit(
        main.content +
          ` *(took ${Date.now() - start}ms${
            process.env["DEV"] ? " — DEV MODE" : ""
          })*`
      );

      // Otherwise get the last embed and edit it;
    } else {
      const embed = main.embeds[0];
      const replacement = new MessageEmbed(embed);

      replacement.setFooter(
        embed.footer?.text +
          `\n(took ${Date.now() - start}ms${
            process.env["DEV"] ? " — DEV MODE" : ""
          })`
      );

      main.edit({ embed: replacement });
    }
  }

  return true;
}

export const Permissions = {
  admin(message: Message) {
    return (
      message.channel.type === "text" &&
      message.member !== null &&
      message.member.hasPermission("ADMINISTRATOR")
    );
  },

  owner(message: Message) {
    return message.author.id === owner;
  },

  guild(message: Message) {
    return message.channel.type == "text";
  },

  dm(message: Message) {
    return message.channel.type === "dm";
  },

  env(parameter: string, value: any) {
    return (message: Message) => process.env[parameter] === value;
  },

  channel(name: string) {
    return (message: Message) => (message.channel as TextChannel).name === name;
  },

  all() {
    return true;
  },

  compose(...checks: ((message: Message) => boolean)[]) {
    return (message: Message) =>
      checks.map((check) => check(message)).every((resp) => resp);
  },

  any(...checks: ((message: Message) => boolean)[]) {
    return (message: Message) =>
      checks.map((check) => check(message)).some((resp) => resp);
  },
};
