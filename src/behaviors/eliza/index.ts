/**
 * Eliza conversation engine implementation
 */
import { addMessageHandler } from "../../lib/message";
import { client } from "../../client";
import { User } from "discord.js";
import { askString } from "../../lib/prompt";
import ElizaBot from "./eliza";

const TALKING = new Set<string>();

async function goEliza(user: User) {
  const dm = await user.createDM();
  const eliza = new ElizaBot(false);

  let response = eliza.getInitial();
  let input = "";

  while (!eliza.quit) {
    input = await askString(response, dm);
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
    TALKING.has(message.author.id)
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
