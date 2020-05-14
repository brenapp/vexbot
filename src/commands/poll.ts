/**
 * Poll command
 *
 * Syntax:
 *  /poll 30m "What Should I Name My Dog" Spot, Murphy, Alice, Jared
 *
 */

import { Message, MessageReaction, User, RichEmbed } from "discord.js";
import Command, { Permissions } from "../lib/command";
import { makeEmbed } from "../lib/util";

// @ts-ignore
import parse from "parse-duration";
import listen from "../lib/reactions";
import { client } from "../client";

// Reactions
const emoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export const PollCommand = Command({
  names: ["poll", "question"],

  documentation: {
    usage: `poll "What Should I Name My Dog" Spot, Murphy, Alice, "I don't care"`,
    description: "Simple Option Polling",
    group: "META",
  },

  check: Permissions.guild,
  async exec(message, [duration, question, ...options]) {
    if (options.length > 10) {
      return message.channel.send("You cannot have more than 10 options!");
    }

    // Record the votes for all the options
    const votes = new Map<User, number>();

    // Poll duration
    const time = parse(duration);
    const ends = new Date(Date.now() + time);

    const invoker = message.member.nickname || message.author.username;

    const embed = makeEmbed(message)
      .setAuthor(invoker, message.author.avatarURL)
      .setTitle(`Poll: ${question}`);

    let description = `This poll ends at ${ends.toLocaleString()}. \n`;
    description += `*${invoker} can end the poll immediately by reacting with ✅* \n\n`;

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

    // Custom listener
    const collector = poll.createReactionCollector(
      (reaction: MessageReaction, user: User) =>
        emoji.includes(reaction.emoji.toString()) ||
        reaction.emoji.toString() === "✅",
      { time }
    );

    collector.on("collect", async (reaction, collector) => {
      // If the poll is being ended early, either by the originator, or an admin
      if (
        reaction.emoji.toString() === "✅" &&
        reaction.users.some(
          (user) =>
            message.author.id === user.id ||
            (message.guild.member(user).hasPermission("ADMINISTRATOR") &&
              !user.bot)
        )
      ) {
        collector.stop();
      }

      const voter = reaction.users.last();
      const votes = collector.collected;

      // Get all their other votes and delete them
      const otherVotes = votes.filter(
        (choice) =>
          choice.users.has(voter.id) && choice.emoji !== reaction.emoji
      );

      // Remove all their other votes
      for (const choice of otherVotes.values()) {
        choice.remove(voter);
      }
    });

    collector.on("end", (collected) => {
      const embed = poll.embeds[0];

      description += "**Time's Up!** \nThe winner of the poll is...\n";

      let winner: MessageReaction = collected.first();
      for (const reaction of collected.values()) {
        if (reaction.count > winner.count) {
          winner = reaction;
        }
      }

      const opt = options[emoji.indexOf(winner.emoji.toString())];
      description += opt;

      const replacement = new RichEmbed(embed);
      replacement.setDescription(description);

      poll.edit({ embed: replacement });
    });

    return poll;
  },

  fail(message: Message) {
    return message.reply("This needs to be in a public server!");
  },
});
