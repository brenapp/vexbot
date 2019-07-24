import {
  Message,
  ReactionEmoji,
  User,
  MessageReaction,
  Collector
} from "discord.js";

/**
 * Reaction utilites
 */

export default async function listen(
  message: Message,
  emojis: string[],
  callback: (
    vote: MessageReaction,
    collector: Collector<string, MessageReaction>
  ) => boolean | void | Promise<boolean> | Promise<void>
) {
  const collector = message.createReactionCollector(
    (reaction: MessageReaction, user: User) =>
      emojis.includes(reaction.emoji.name) && !user.bot
  );
  collector.on("collect", (element, collector) => {
    const response = callback(element, collector);

    if (response) {
      collector.emit("end");
    }
  });
}
