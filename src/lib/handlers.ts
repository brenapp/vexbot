import { addMessageHandler } from "./message";

import "./command";
import { handle, isCommand, RESPONSES } from "./command";
import { client } from "../client";
import { Message } from "discord.js";
import { config } from "./access";

const prod = config("prefix.prod") as string[];

// Dismiss messages from a bot, we don't take their kind around here!
addMessageHandler((message) => message.author.bot);

// Dismiss production commands when in DEV mode
addMessageHandler(
  (message) =>
    process.env["DEV"] !== undefined && prod.includes(message.content[0])
);

// Handle all commands (using own function)
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

  // If the old message was a command, delete the old responses
  if (isCommand(old) && RESPONSES.has(old.id)) {
    const resp = RESPONSES.get(old.id) as Message[];
    resp.forEach((m) => m.delete());
  }

  return handle(current);
});
