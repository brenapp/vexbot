import { addMessageHandler } from "./message";

import "./command";
import { handle, isCommand, RESPONSES } from "./command";
import { client } from "../client";
import { Message } from "discord.js";
import { config } from "./access";

const prod: string[] = config("prefix.prod");

// Dismiss production commands when in DEV mode
addMessageHandler(
  (message) =>
    process.env["DEV"] !== undefined && prod.includes(message.content[0])
);

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler((message) => message.author.bot);

// Commands
addMessageHandler(handle);

// Command editing
client.on("messageUpdate", async (old, current) => {
  if (old.partial) {
    old = await old.fetch();
  }

  // Don't consider bot messages
  if (old.author.bot) {
    return false;
  }

  // If the old message was a command, delete the old response
  if (isCommand(old) && RESPONSES.has(old)) {
    const response = RESPONSES.get(old) as Message;
    response.delete();
  }

  return handle(current);
});
