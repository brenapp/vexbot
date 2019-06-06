import { Message } from "discord.js";
import { addMessageHandler, removeMessageHandler } from "./message";

export const PREFIX = process.env["DEV"] ? ["."] : ["/", "!"];

export function matchCommand(message: Message, name: string) {
  return (
    PREFIX.includes(message.content[0]) &&
    message.content.slice(1, name.length + 1) === name
  );
}

export default (name: string) =>
  class Command {
    handler: number;
    name: string;

    constructor() {
      this.name = name;

      this.handler = addMessageHandler(async message => {
        if (!matchCommand(message, name)) {
          return false;
        }

        if (!(await this.check(message))) {
          await this.fail();
          return false;
        }

        // Parse args
        const args = message.content.split(" ").slice(1);

        await this.exec(message, args);
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
    fail(): void | Promise<void> {
      return;
    }

    /**
     * Executes the command
     * @param message
     * @param args
     */
    exec(message: Message, args: string[]) {}
  };
