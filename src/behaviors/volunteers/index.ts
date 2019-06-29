import getResponses from "./responses";
import volunteerEmbed from "./embed";
import { client } from "../../client";
import { information } from "../../lib/report";

import * as keya from "keya";
import { TextChannel, Message } from "discord.js";

let initalize = true;

export async function updateListings() {
  const channel = client.channels.get("592450072718082088") as TextChannel;
  const store = await keya.store("volunteerlistings");
  const responses = await getResponses();
  const emoji = client.emojis.find(emoji => emoji.name === "zach");

  for (let response of responses) {
    const record = await store.get(response.event.sku);

    if (record && record.deleted) {
      continue;
    }

    let message: Message;

    if (record) {
      message = await channel.fetchMessage(record.post);
      const embed = volunteerEmbed(response, emoji);

      message.edit({ embed });

      // Delete the message if the time has elapsed
      if (response.event.date.getTime() < Date.now() && message.deletable) {
        message.delete();
        store.set(response.event.sku, { deleted: true, ...record });
      }
    } else {
      const embed = volunteerEmbed(response, emoji);
      message = (await channel.send({ embed })) as Message;

      await store.set(response.event.sku, { post: message.id });
    }

    await message.react(emoji);

    // Reaction collector
    if (initalize) {
      const collector = message.createReactionCollector(
        reaction => reaction.emoji.name === emoji.name
      );

      collector.on("collect", reaction => {
        reaction.users.forEach(user => {
          console.log(user);
        });
      });
    }

    initalize = false;
  }
}

setInterval(updateListings, 2 * 60 * 1000);
