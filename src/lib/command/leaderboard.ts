import { addCommand, addMessageHandler } from "../message";
import * as keya from "keya";
import { client } from "../../client";
import FileSystemStore from "keya/out/node/filesystem";
import { Guild, Collection, TextChannel } from "discord.js";
import { okay } from "./debug";

async function fetchAll(channel: TextChannel) {
  let messages = await channel.fetchMessages({ limit: 100 });
  let pointer = messages.lastKey();
  let batch;

  process.stdout.write(" fetching");

  do {
    batch = (await channel.fetchMessages({
      limit: 100,
      before: pointer
    })).filter(message => !message.author.bot);

    pointer = batch.lastKey();
    messages = messages.concat(batch);

    process.stdout.write(".");
  } while (batch.size > 0);

  console.log("");

  return messages;
}

async function getTotals(store: FileSystemStore, guild: Guild) {
  const text = guild.channels.filter(
    channel => channel.type === "text"
  ) as Collection<string, TextChannel>;

  let totals = {};

  for (let [id, channel] of text) {
    console.log(`Tallying #${channel.name}...`);
    const messages = await fetchAll(channel);
    messages.forEach(message => {
      if (totals[message.author.id]) {
        totals[message.author.id]++;
      } else {
        totals[message.author.id] = 1;
      }
    });
    console.log(`Done! Got ${messages.size} messages`);
  }

  console.log(totals);

  // Set totals for everyone
  await Promise.all(
    Object.keys(totals).map(async id => store.set(id, totals[id]))
  );
}

(async function() {
  const store = await keya.store(`vexbot-leaderboard`);

  addCommand("leaderboard-tally", async (args, message) => {
    if (okay(message)) {
      message.channel.send("Recouting leaderboard totals...");
      await getTotals(store, message.guild);
      message.reply("Done!");
    }

    return false;
  });

  addMessageHandler(async message => {
    const value = (await store.get(message.author.id)) || 0;
    await store.set(message.author.id, value + 1);
    return false;
  });

  addCommand("leaderboard", async (args, message) => {
    const all = await store.all();
    const top = all.sort((a, b) => b.value - a.value);

    const leaderboard = top
      .slice(0, +args[0] || 10)
      .map(v => client.users.get(v.key));

    const names = {
      "Secret Top Tier": "messages",
      "People With No Lives": "hours on VTOSC",
      "VEX Gods": "world quals",
      "Banhammer Incoming": "illegal messages",
      "IQ Scores": "points",
      "Programming Wizards": "pt autonomous",
      "Highest Build Quality": "halfcuts",
      "Best Head Refs": "dqs",
      "Poking the Beehive": "posts on VF",
      "Tournaments 'Won'": "bo1'd matches"
    };

    let title = Object.keys(names)[
      Math.round(Object.keys(names).length * Math.random())
    ];

    message.channel.send("", {
      embed: {
        title,
        description: leaderboard
          .map((k, i) => `${i + 1}. ${k} — ${top[i].value} ${names[title]}`)
          .join("\n")
      }
    });

    return true;
  });
})();
