/**
 * Poll command
 *
 * Syntax:
 *  /poll 30m "What Should I Name My Dog" Spot, Murphy, Alice, Jared
 *
 */

import { Message, MessageReaction, User } from "discord.js";
import Command, { Permissions } from "../lib/command";
import { makeEmbed } from "../lib/util";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import parse from "parse-duration";
import { client } from "../client";

// Reactions
const emoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export const PollCommand = Command({
  names: ["poll", "question"],

  documentation: {
    usage: `poll 5m "What Should I Name My Dog" Spot Murphy Alice "I don't care"`,
    description: "Reaction based poll.",
    group: "HELPER",
  },

  check: Permissions.guild,
  async exec(message, [duration, question, ...options]) {
    if (!message.member) return;
    if (options.length > 10) {
      return message.channel.send("You cannot have more than 10 options!");
    }

    // Only accept unique results
    if (options.some((value, index, array) => array.indexOf(value) !== index)) {
      return message.channel.send(
        `All options must be unique! Current options are \`${options.join(
          "`, `"
        )}\``
      );
    }

    // Poll duration
    const time = parse(duration);
    const ends = new Date(Date.now() + time);

    const embed = makeEmbed(message)
      .setAuthor(
        message.member.nickname,
        message.author.avatarURL() ?? undefined
      )
      .setTitle(`Poll: ${question}`);

    let description = `This poll ends at ${
      ends.toTimeString().split(" ")[0]
    }. Vote by clicking one of the reactions below.\n`;
    description += `*${message.member} (and moderators) can end this poll by reacting with ✅*\n\n`;

    for (const [i, option] of Object.entries(options)) {
      description += `${emoji[+i]} — ${option}\n\n`;
    }

    embed.setDescription(description);

    // Post the embed
    const poll = (await message.channel.send({ embed })) as Message;

    // React with all of the appropriate emoji
    for (let i = 0; i < options.length; i++) {
      await poll.react(emoji[i]);
    }

    await poll.react("✅");

    // Collect Reactions
    const filter = (reaction: MessageReaction, user: User) =>
      [...emoji.slice(0, options.length), "✅"].includes(
        reaction.emoji.toString()
      ) && !user.bot;

    // Record the votes User => index
    const votes = new Map<User, number>();

    const collector = poll.createReactionCollector(filter, { time });

    collector.on("collect", async (reaction, user) => {
      // Whether the person reacting has privledged access to this poll
      const priveledged =
        user.id === message.author.id ||
        (message.guild?.members
          .resolve(user)
          ?.hasPermission("MANAGE_MESSAGES") ??
          false);

      // Immediately end the poll if a priveledged user reacts to end it
      if (reaction.emoji.toString() === "✅" && priveledged) {
        collector.emit("end");
        return;
      }

      // Set the vote
      const index = emoji.indexOf(reaction.emoji.toString());
      votes.set(user, index);

      // Delete votes
      const collection = await reaction.users.fetch();

      for (const user of collection.values()) {
        if (user.id === client.user?.id) continue;
        reaction.users.remove(user);
      }
    });

    collector.on("end", async () => {
      await poll.reactions.removeAll();

      // Count all the votes
      const tally: { [option: string]: number } = {};

      for (const index of votes.values()) {
        const option = options[index];

        if (tally[option]) {
          tally[option]++;
        } else {
          tally[option] = 1;
        }
      }

      const results = options.sort((b, a) => (tally[a] || 0) - (tally[b] || 0));

      // Edit the message to show times up
      let description = "**Time's Up!**\n";
      description += `The results are in!\n\n`;

      for (const result of results) {
        description += `**${result}** — ${tally[result] || 0} votes\n\n`;
      }

      embed.setDescription(description);

      await poll.edit({ embed });
    });

    return poll;
  },

  fail(message: Message) {
    return message.reply("This needs to be in a public server!");
  },
});
