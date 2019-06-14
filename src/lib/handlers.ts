import { addMessageHandler } from "./message";

import "./command";
import { Command, isCommand, RESPONSES } from "./command";
import { client } from "../client";

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler(message => message.author.bot);

// Commands
addMessageHandler(Command.execute);

// Command editing
client.on("messageUpdate", (old, current) => {
  // Don't consider bot messages
  if (old.author.bot) {
    return false;
  }

  console.log(Object.keys(RESPONSES), old.id);

  // If the old message was a command, delete the old response
  if (isCommand(old) && RESPONSES[old.id]) {
    RESPONSES[old.id].delete();
  }

  return Command.execute(current);
});
