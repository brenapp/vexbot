import { addMessageHandler } from "../lib/message";
import { client } from "../client";

/**
 * Random behaviors
 */

addMessageHandler(message => {
  if (!message.mentions.users.has(client.user.id)) return false;

  const ping = client.emojis.find(emoji => emoji.name === "ping");
  message.react(ping);
});
