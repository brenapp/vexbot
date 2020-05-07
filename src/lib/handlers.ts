import { addMessageHandler } from "./message";

import "./command";
import { handle, isCommand, RESPONSES } from "./command";
import { client } from "../client";

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler((message) => message.author.bot);

// Commands
addMessageHandler(handle);

// Command editing
client.on("messageUpdate", (old, current) => {
  // Don't consider bot messages
  if (old.author.bot) {
    return false;
  }

  // If the old message was a command, delete the old response
  if (isCommand(old) && RESPONSES.has(old)) {
    RESPONSES.get(old).delete();
  }

  return handle(current);
});
