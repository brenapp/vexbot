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
function addMessageHandler(handler: MessageHandler) {
  return handlers.push(handler) - 1;
}

/**
 * Remove a message handler
 */
function removeMessageHandler(index: number) {
  // Overwrite with empty function, so as to preserve handler numbers
  handlers[index] = () => false;
}
/**
 * Add a one time message handler to the stack. Message handling is first-come, first-serve. In order to prevent accidents, handler functions must return true if they act upon a message.
 * This can easily be done by having conditional returns at the top of the function, and returning true at the end
 */
function addOneTimeMessageHandler(handler: MessageHandler) {
  let index = addMessageHandler(async function(message: Message) {
    let res = await handler(message);
    if (res) removeMessageHandler(index);
    return res;
  });
}

/**
 * Handles a message
 * @param {Message} message The message to process
 * @return {Function} The function that handled this message
 */
async function handleMessage(message: Message) {
  let i = 0;
  while (!(await handlers[i++](message)) && i < handlers.length) {
    // console.log(`Handler passed`, handlers[i]);
  }
  return handlers[i];
}

type CommandHandler = (
  args: string[],
  message: Message
) => boolean | Promise<boolean>;

/**
 * Syntactic Sugar around addMessageHandler() for commands
 * @param name Name of the command (event, or team, or whatever)
 * @param handler A function to handle the command innvocation
 */
function addCommand(name: string, handler: CommandHandler) {
  addMessageHandler(async message => {
    if (message.content.toLowerCase().startsWith(`!${name}`)) {
      let [, ...args] = message.content.split(" ");
      console.log("passing command to handler");
      return handler(args, message);
    } else {
      return false;
    }
  });
}

export {
  addMessageHandler,
  addOneTimeMessageHandler,
  handleMessage,
  addCommand
};
