import { addCommand } from "../message";
import * as vexdb from "vexdb";
import { User } from "discord.js";

// Store subscriptions
const subscriptions: { [key: string]: Set<User> } = {};

addCommand("sub", async (args, message) => {
  const team = args[0];

  if (!team) {
    message.reply("No Team Specified!");
    return true;
  }

  if (!subscriptions[team]) {
    subscriptions[team] = new Set();
  }

  // Check if user is subscribed already
  if (subscriptions[team].has(message.author)) {
    message.reply(`You're already subscribed to ${team}!`);
    return true;
  }

  // Add user to subscription for teams
  message.reply(
    `You will now recieve updates (skills and matches) for ${team}`
  );
  subscriptions[team].add(message.author);

  return true;
});

addCommand("unsub", async (args, message) => {
  const team = args[0];

  if (!team) {
    message.reply("No Team Specified!");
    return true;
  }

  if (!subscriptions[team]) {
    subscriptions[team] = new Set();
  }

  // Check if user is subscribed
  if (!subscriptions[team].has(message.author)) {
    message.reply(`You're not subscribed to ${team}!`);
    return true;
  }

  // Remove user from subscriptions
  message.reply(`You will no longer recieve updates for ${team}`);
  subscriptions[team].delete(message.author);

  return true;
});
