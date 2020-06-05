import { Message } from "discord.js";

/**
 * Super simple event loop for message handling
 */

type MessageHandler = (message: Message) => Promise<boolean> | boolean;

const handlers: MessageHandler[] = [];

/**
 * Add a message handler to the stack. Message handling is first-come, first-serve. In order to prevent accidents, handler functions must return true if they act upon a message.
 * This can easily be done by having conditional returns at the top of the function, and returning true at the end
 */
export function addMessageHandler(handler: MessageHandler): number {
  return handlers.push(handler) - 1;
}

/**
 * Remove a message handler
 */
export function removeMessageHandler(index: number): void {
  // Overwrite with empty function, so as to preserve handler numbers
  handlers[index] = () => false;
}
/**
 * Add a one time message handler to the stack. Message handling is first-come, first-serve. In order to prevent accidents, handler functions must return true if they act upon a message.
 * This can easily be done by having conditional returns at the top of the function, and returning true at the end
 */
export function addOneTimeMessageHandler(handler: MessageHandler): number {
  const index = addMessageHandler(async function(message: Message) {
    const res = await handler(message);
    if (res) removeMessageHandler(index);
    return res;
  });
  return index;
}

/**
 * Handles a message
 * @param {Message} message The message to process
 * @return {Function} The function that handled this message
 */
export async function handleMessage(message: Message): Promise<boolean> {
  for (const handler of handlers) {
    const result = await handler(message);

    if (result) return true;
  }

  return false;
}
