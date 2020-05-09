import {
  Message,
  ReactionEmoji,
  User,
  MessageReaction,
  Collector,
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
  let handler: (element: MessageReaction) => void;
  collector.on(
    "collect",
    (handler = (element: MessageReaction) => {
      const response = callback(element, collector);

      if (response) {
        collector.emit("end");
        collector.off("collect", handler);
        collector.cleanup();
      }
    })
  );
}
