import { Message, User, MessageReaction, ReactionCollector } from "discord.js";

/**
 * Reaction utilites
 */

export default async function listen(
  message: Message,
  emojis: string[],
  callback: (
    vote: MessageReaction,
    collector: ReactionCollector
  ) => boolean | void | Promise<boolean> | Promise<void>
): Promise<void> {
  const collector = message.createReactionCollector(
    { filter: (reaction: MessageReaction, user: User) =>
      emojis.includes(reaction.emoji?.name ?? "") && !user.bot }
  );
  let handler: (element: MessageReaction) => void;
  collector.on(
    "collect",
    (handler = (element: MessageReaction) => {
      const response = callback(element, collector);

      if (response) {
        collector.stop();
        collector.stop();
      }
    })
  );
}
