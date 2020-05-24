import * as keya from "keya";
import { Guild, Collection, TextChannel, Message } from "discord.js";
import Command, { Permissions } from "../lib/command";
import { makeEmbed } from "../lib/util";
import SQLiteStore from "keya/out/node/sqlite";
import { client } from "../client";
import { addMessageHandler } from "../lib/message";
import { config } from "../lib/access";

async function fetchAll(channel: TextChannel) {
  let messages = await channel.messages.fetch({ limit: 100 });
  let pointer = messages.lastKey();
  let batch;

  process.stdout.write(" fetching");

  do {
    batch = (
      await channel.messages.fetch({
        limit: 100,
        before: pointer,
      })
    ).filter((message) => !message.author.bot);

    pointer = batch.lastKey();
    messages = messages.concat(batch);

    process.stdout.write(".");
  } while (batch.size > 0);

  console.log("");

  return messages;
}

interface MessageTotals {
  oof: number;
  total: number;
}

async function getTotals(store: SQLiteStore<MessageTotals>, message: Message) {
  const guild = message.guild as Guild;

  const text = guild.channels.cache.filter(
    (channel) => channel.type === "text"
  ) as Collection<string, TextChannel>;

  let totals: { [key: string]: number } = {};
  let oofs: { [key: string]: number } = {};

  for (let [id, channel] of text) {
    console.log(`Tallying #${channel.name}...`);
    const messages = await fetchAll(channel);
    messages.forEach((message) => {
      if (totals[message.author.id]) {
        totals[message.author.id]++;
      } else {
        totals[message.author.id] = 1;
      }

      if (message.content.toLowerCase().includes("oof")) {
        if (oofs[message.author.id]) {
          oofs[message.author.id]++;
        } else {
          oofs[message.author.id] = 1;
        }
      }
    });
    console.log(`Done! Got ${messages.size} messages`);

    message.edit(
      (message.content += `\n${channel}: ${messages.size} messages`)
    );
  }

  // Set totals for everyone
  await Promise.all(
    Object.keys(totals).map(async (id) =>
      store.set(`${(message.guild as Guild).id}-${id}`, {
        total: totals[id],
        oof: oofs[id],
      })
    )
  );
}

(async function() {
  const store = await keya.store(`vexbotleaderboard`);

  const leaderboard = Command({
    names: ["leaderboard"],
    documentation: {
      usage: "leaderboard",
      description: "Lists people by their number of messages posted",
      group: "META",
    },

    check: Permissions.all,

    async exec(message: Message & { guild: Guild }, args: string[]) {
      const titles = config("leaderboard.titles");

      const all = (await store.all()).filter(({ key }: { key: string }) =>
        key.startsWith(message.guild.id)
      ) as {
        key: string;
        value: { total: number; oof: number };
      }[];
      const top = all.sort((a, b) => b.value.total - a.value.total);

      const index = all.findIndex((record) => message.author.id === record.key);
      const min = Math.max(0, index - 5);
      const max = Math.min(all.length - 1, min + 10);

      const leaderboard = top
        .slice(min, max)
        .map((v) => client.users.cache.get(v.key.split("-")[1]));

      const total = all.reduce((a, b) => a + b.value.total, 0) as number;
      const oof = all.reduce((a, b) => a + (b.value.oof || 0), 0) as number;

      const title = Object.keys(titles)[
        Math.round(Object.keys(titles).length * Math.random())
      ];

      const embed = makeEmbed(message)
        .setTitle(title)
        .setDescription(
          `**Stats**\nTotal Messages Sent: ${total.toLocaleString()}\nOof Count: ${oof.toLocaleString()} (${(
            (oof * 100) /
            total
          ).toPrecision(3)}% oof)\n\n${leaderboard
            .map(
              (k, i) =>
                `${min + i + 1}. ${k} — ${top[i].value.total} ${titles[title]}`
            )
            .join("\n")}`
        );

      return message.channel.send(embed);
    },
  });

  Command({
    names: ["tally"],
    documentation: {
      description: "Tallies the leaderboard",
      usage: "tally",
      group: "META",
    },

    check: Permissions.admin,
    async exec(message: Message) {
      let mess = (await message.channel.send(
        "Recalculating totals..."
      )) as Message;
      await getTotals(store, mess);

      const reply = (await message.reply("Done!")) as Message;
      leaderboard.exec(reply, ["10"]);

      return reply;
    },
  });

  // Increment messages
  addMessageHandler(async (message) => {
    if (!message.guild) {
      return false;
    }

    const record = (await store.get(
      `${message.guild.id}-${message.author.id}`
    )) || { total: 0, oof: 0 };

    if (message.content.toLowerCase().includes("oof")) {
      record.oof++;
    }

    record.total++;

    await store.set(`${message.guild.id}-${message.author.id}`, record);

    return false;
  });
})();
