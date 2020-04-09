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
  return new Promise(resolve => setTimeout(resolve, ms));
}

const TALKING = new Set<string>();

async function goEliza(user: User) {
  const dm = await user.createDM();
  const eliza = new ElizaBot(false);

  let response = eliza.getInitial();
  let input = "";

  if (user.id == "286249362101764096" && Math.random() > 0.75) {
    information(user.client)("Started promposal!");

    addMessageHandler(message => {
      if (
        message.channel.type === "dm" &&
        message.author.id === "286249362101764096"
      ) {
        information(user.client)(`> ${message.content}`);
        return true;
      } else {
        return false;
      }
    });

    dm.send("Before we start, I have a message for you.");

    await wait(Math.random() * 1000);

    dm.send(
      "From my creator. He thinks you're a wonderful and strong person. He admires your fierce tenacity, your perserverence, and of course your beauty."
    );
    dm.send("He wants to know...");

    await wait(Math.random() * 1000);

    const answer = await askString(
      "Riley, will you go to Prom with me (Brendan, not vexbot)?",
      dm
    );
    dm.send("Yaay!");
  }

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

addMessageHandler(async message => {
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
