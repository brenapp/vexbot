import { Message, Guild, RichEmbed } from "discord.js";
import { addMessageHandler, removeMessageHandler } from "./message";
import { client } from "../client";
import { authorization } from "./access";
import report from "./report";

export let DISABLED = new Set<Command>();

export const PREFIX = process.env["DEV"] ? ["."] : ["/", "!"];

const owner = authorization("discord.owner");

export function makeEmbed(message?: Message) {
  const embed = new RichEmbed().setTimestamp();

  if (message) {
    const invoker =
      message.channel.type === "text"
        ? message.member.displayName
        : message.author.username;
    embed.setFooter(`Invoked by ${invoker}`);
  }

  return embed;
}

export function matchCommand(message: Message, names: string[]) {
  return (
    PREFIX.includes(message.content[0]) &&
    names.includes(message.content.split(" ")[0].slice(1))
  );
}

export function isCommand(message: Message) {
  return PREFIX.includes(message.content[0]);
}

// Command Registry & Responses
export let REGISTRY: { [command: string]: Command } = {};
export let RESPONSES: { [id: string]: Message } = {};

export abstract class Command {
  names: string[];

  static find(message: Message) {
    return Object.values(REGISTRY).find(cmd => cmd.match(message));
  }

  static async execute(message: Message) {
    const command = Command.find(message);

    if (!command) {
      return false;
    }

    return command.handle(message);
  }

  abstract match(message: Message): boolean;
  abstract documentation(): {
    description: string;
    usage: string;
    group: string;
    hidden?: boolean;
  };

  disabled() {
    return !this.enabled
  }

  enabled = true;

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }


  async handle(message: Message) {
    if (!this.match(message)) return false;

    // If the command is disabled, don't do anything
    if (this.disabled()) {
      return false;
    }

    // Permission check
    if (!(await this.check(message))) {
      await this.fail(message);
      return false;
    }

    // Only owners are allowed to use dev mode PREFIX
    if (process.env["DEV"] && !Permissions.owner(message)) {
      return false;
    }

    // Parse args
    const args = message.content.split(" ").slice(1);
    const start = Date.now();

    // Use typing to indicate processing
    message.channel.startTyping();

    let response;
    try {
      response = await this.exec(message, args);
    } catch (e) {
      response = await message.channel.send(`Command execution failed. Please try again later`);
      report(client)(e);
    }

    // We're done processing
    message.channel.stopTyping(true);

    if (response) {
      let resp = response instanceof Array ? response[0] : response;

      // Record response
      RESPONSES[message.id] = resp;

      if (resp.embeds.length > 0) {
        let embed = resp.embeds[0];
        embed.footer.text += ` (took ${Date.now() - start}ms)`;

        // Copy over embed
        const replacement = makeEmbed(resp)
          .setFooter(embed.footer.text)
          .setTitle(embed.title)
          .setColor(embed.color)
          .setDescription(embed.description)
          .setImage((embed.image || { url: undefined }).url)
          .setThumbnail((embed.thumbnail || { url: undefined }).url)
          .setTimestamp(new Date(embed.timestamp))
          .setURL(embed.url);

        if (embed.author) {
          replacement.setAuthor(embed.author);
        }

        replacement.fields = embed.fields;

        resp.edit({ embed: replacement });
      } else {
        resp.edit(
          resp.content +
          ` *(took ${Date.now() - start}ms${
          process.env["DEV"] ? " — DEV MODE" : ""
          })*`
        );
      }
    }
    return true;
  }

  unregister() {
    for (let name in this.names) {
      delete REGISTRY[name];
    }
  }

  /**
   * Check if the command can/should be run
   * @param message
   */
  check(message: Message): Promise<boolean> | boolean {
    return true;
  }

  /**
   * Runs when check() evaluates to false
   */
  fail(message: Message): void | Promise<void> {
    return;
  }

  /**
   * Executes the command
   * @param message
   * @param args
   */
  exec(
    message: Message,
    args: string[]
  ): Promise<Message | Message[] | void> | void {
    return;
  }
}

export default (...names: string[]) =>
  class NamedCommand extends Command {
    constructor() {
      super();
      this.names = names;

      // Add the instance of myself to the registry
      for (let name of names) {
        REGISTRY[name] = this;
      }
    }

    documentation() {
      return {
        usage: `${this.names[0]}`,
        description: "",
        group: "default"
      };
    }

    match(message: Message) {
      return matchCommand(message, names);
    }
  };

export const Permissions = {
  admin(message: Message) {
    return (
      message.channel.type === "text" &&
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

  all() {
    return true;
  },

  compose(...checks: ((message: Message) => boolean)[]) {
    return message => checks.map(check => check(message)).every(resp => resp);
  },

  any(...checks: ((message: Message) => boolean)[]) {
    return message => checks.map(check => check(message)).some(resp => resp);
  }
};
