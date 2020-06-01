import Command, {
  Permissions,
  REGISTRY,
  PREFIX,
  CommandConfiguration,
} from "../lib/command";
import { Message } from "discord.js";

export const HelpCommand = Command({
  names: ["help"],
  documentation: {
    description: "Lists all commands and usage",
    usage: "help",
    group: "META",
  },

  check: Permissions.all,
  async exec(message: Message) {
    // Let's organize the commands into their group
    const groups: {
      [group: string]: CommandConfiguration[];
    } = {};

    // Go through each command
    for (const [name, command] of REGISTRY) {
      // Get rid of all aliases
      if (name !== command.names[0]) continue;

      // Get rid of invisible commands
      if (command.documentation.hidden) continue;

      // Make sure the user is able to access this command
      const allowed = await command.check(message);
      if (!allowed) continue;

      // Place it into its group
      const group = command.documentation.group.toUpperCase();

      if (groups[group]) {
        groups[group].push(command);
      } else {
        groups[group] = [command];
      }
    }

    // Build the output
    let body = "Here's what I can do!";

    // List all of the command channels
    for (const [name, commands] of Object.entries(groups)) {
      body += `\n**${name}**\n`;

      for (const command of commands) {
        body += command.names.map((n) => `__${n}__`).join(" or ");
        body += " " + command.documentation.description + " ";
        body += `\`${PREFIX[0]}${command.documentation.usage}\`\n`;

        if (command.subcommands) {
          for (const subcommand of command.subcommands) {
            body +=
              " - " + subcommand.names.map((n) => `__${n}__`).join(" or ");
            body += " " + subcommand.documentation.description + " ";
            body += `\`${PREFIX[0]}${command.names[0]} ${subcommand.documentation.usage}\`\n`;
          }
        }

        body += "\n";
      }

      await message.channel.send(body);
      body = "";
    }
  },
});
