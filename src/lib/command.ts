import { Message, Guild, RichEmbed } from "discord.js";
import { addMessageHandler, removeMessageHandler } from "./message";

export const PREFIX = process.env["DEV"] ? ["."] : ["/", "!"];

export function makeEmbed(message: Message) {
  return new RichEmbed()
    .setFooter(`Invoked by ${message.member.displayName}`)
    .setTimestamp();
}

export function matchCommand(message: Message, names: string[]) {
  return (
    PREFIX.includes(message.content[0]) &&
    names.includes(message.content.split(" ")[0].slice(1))
  );
}

export default (...names: string[]) =>
  class Command {
    handler: number;
    name: string;

    constructor() {
      this.name = names[0];

      this.handler = addMessageHandler(async message => {
        if (!matchCommand(message, names)) {
          return false;
        }

        if (!(await this.check(message))) {
          await this.fail(message);
          return false;
        }

        // Parse args
        const args = message.content.split(" ").slice(1);
        const start = Date.now();

        const response = await this.exec(message, args);

        if (response) {
          let message = response instanceof Array ? response[0] : response;
          if (message.embeds.length > 0) {
            let embed = message.embeds[0];
            embed.footer.text += ` (took ${Date.now() - start}ms)`;

            // Copy over embed
            const replacement = makeEmbed(message)
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

            message.edit({ embed: replacement });
          } else {
            message.edit(message.content + ` *(took ${Date.now() - start}ms)*`);
          }
        }
        return true;
      });
    }

    unregister() {
      return removeMessageHandler(this.handler);
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
    ): Promise<Message | Message[]> | void {
      return;
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
    return message.author.id === "274004148276690944";
  },

  guild(message: Message) {
    return message.channel.type == "text";
  }
};
