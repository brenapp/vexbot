/**
 * Eliza conversation engine implementation
 */
import { addMessageHandler } from "../../lib/message";
import { client } from "../../client";
import { User } from "discord.js";
import { askString } from "../../lib/prompt";
import ElizaBot from "./eliza";

import { information } from "../../lib/report";
import e = require("express");

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TALKING = new Set<string>();

async function goEliza(user: User) {
  const dm = await user.createDM();
  const eliza = new ElizaBot(false);

  let response = eliza.getInitial();
  let input = "";

  information(user.client)(
    `Eliza Initialized for ${user.username}#${user.discriminator}`
  );

  while (!eliza.quit) {
    input = await askString(response, dm);

    // Wait a few milliseconds, this will make the conversation feel a little more natural
    await wait(Math.random() * 2000);

    response = eliza.transform(input);
  }

  const final = eliza.getFinal();
  TALKING.delete(user.id);
  return dm.send(final);
}

addMessageHandler(async (message) => {
  if (
    message.channel.type !== "dm" ||
    !message.content.toLowerCase().includes("talk") ||
    TALKING.has(message.author.id) ||
    process.env["DEV"]
  ) {
    return false;
  }

  TALKING.add(message.author.id);

  await message.channel.send(
    "You've activated Eliza, a converastion algorithm meant to represent a Rogerian psychotherapist. All conversations with Eliza are not recorded."
  );
  await goEliza(message.author);

  return true;
});
