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
      body += `\n\n**${name}**\n`;

      for (const command of commands) {
        body += command.names.map((n) => `__${n}__`).join(" or ");
        body += " " + command.documentation.description + " ";
        body += `\`${PREFIX[0]}${command.documentation.usage}\`\n`;
      }
    }

    body += "\nRemember to keep most bot usage in the appropriate channel!";

    // If the body is too big, we need to handle it in chunks
    async function postMessage(chunk: string) {
      if (chunk.length > 1900) {
        for (let i = 0; i < chunk.length; i += 1900) {
          const subchunk = chunk.slice(i, i + 1900);
          await postMessage(subchunk);
        }
      } else {
        return message.channel.send(chunk);
      }
    }

    return postMessage(body);
  },
});
