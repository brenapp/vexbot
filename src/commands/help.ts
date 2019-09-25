import Command, {
  Permissions,
  REGISTRY,
  PREFIX,
  Command as cmd,
  DISABLED
} from "../lib/command";
import { Message } from "discord.js";

export class HelpCommand extends Command("help") {
  check = Permissions.all;

  documentation() {
    return {
      description: "Lists all commands and usage",
      usage: "help",
      group: "META"
    };
  }

  async exec(message: Message) {
    const groups: { [key: string]: cmd[] } = {
      META: [],
      VEX: [],
      OWNER: [],
      ADMIN: []
    };

    let commands = Object.values(REGISTRY).filter(
      (cmd, i, array) => i === array.findIndex(c => c.names[0] === cmd.names[0])
    );

    // Get the commands that this person is able to execute
    let allowedIndex = await Promise.all(
      commands.map(cmd => cmd.check(message) && !cmd.documentation().hidden)
    );
    commands.forEach((cmd, i) => {
      const groupname = cmd.documentation().group.toUpperCase();

      if (!groups[groupname]) {
        groups[groupname] = [];
      }

      if (allowedIndex[i])
        groups[groupname].push(cmd);
    });

    let body = "Here's what I can do!";

    Object.keys(groups).forEach(name => {
      const group = groups[name];

      if (!group.length) {
        return;
      }

      body += `\n\n**${name}**\n`;

      group.forEach(cmd => {
        body += cmd.names.map(n => `__${n}__`).join(" or ") + `${cmd.disabled() ? " (disabled)" : ""}: `;
        body += cmd.documentation().description + " ";
        body += `\`${PREFIX[0]}${cmd.documentation().usage}\`\n`;
      });
    });

    body += "\nRemember to keep most bot usage in the appropriate channel!";

    return message.reply(body);
  }
}

export default new HelpCommand();
