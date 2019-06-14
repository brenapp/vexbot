import Command, { Permissions, REGISTRY, PREFIX } from "../lib/command";
import { Message } from "discord.js";

let commands = Object.values(REGISTRY).filter(
  (cmd, i, array) => i === array.findIndex(c => c.names[0] === cmd.names[0])
);

export class HelpCommand extends Command("help") {
  check = Permissions.all;

  documentation() {
    return {
      description: "Lists all commands and usage",
      usage: PREFIX + "help"
    };
  }

  async exec(message: Message) {
    // Get the commands that this person is able to execute
    let allowedIndex = await Promise.all(
      commands.map(cmd => cmd.check(message))
    );
    let allowed = commands.filter((cmd, i) => allowedIndex[i]);

    let body = "Here's what I can do!\n\n";

    allowed.forEach(cmd => {
      body += cmd.names.map(n => `__${n}__`).join(" or ") + ": ";
      body += cmd.documentation().description + " ";
      body += `\`${cmd.documentation().usage}\`\n`;
    });

    body += "\nRemember to keep most bot usage in the appropriate channel!";

    return message.reply(body);
  }
}

export default new HelpCommand();
