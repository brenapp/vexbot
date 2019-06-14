import { addMessageHandler } from "./message";

import "./command";
import { Command, isCommand } from "./command";
import { client } from "../client";

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler(message => message.author.bot);

// Commands
addMessageHandler(Command.execute);

// Command editing
client.on("messageUpdate", (old, current) => {
  const oldIsCommand = isCommand(old);
  const currentIsCommand = isCommand(current);

  // If this just became a command, then execute it as a new command
  if (!oldIsCommand && currentIsCommand) {
    return Command.execute(current);
  }
});
