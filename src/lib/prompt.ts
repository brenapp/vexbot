/**
 * Utility kit to prompt users
 * Used in verification flow
 */

import { addOneTimeMessageHandler } from "./message";
import { DMChannel, Message } from "discord.js";

/**
 * Asks a user in their respective DMChannel
 * @param question Question to ask
 * @param channel Channel to ask in ()
 * @returns The response message
 */
function ask(question: string, channel: DMChannel) {
  channel.send(question);
  return new Promise<Message>(resolve => {
    addOneTimeMessageHandler(message => {
      if (channel.id !== message.channel.id) return false;
      resolve(message);
      return true;
    });
  });
}

/**
 * Same as ask, but returns the response string
 * @param question Question to ask
 * @param channel Channel to ask in ()
 */
function askString(question: string, channel: DMChannel) {
  return ask(question, channel).then(message => message.content);
}

type ValidatorFunction = (
  message: string
) => Promise<boolean | string> | string | boolean;
function questionValidate(
  question: string,
  channel: DMChannel,
  validate: ValidatorFunction,
  failureMessage: string
): Promise<string> {
  return askString(question, channel).then(async response => {
    let corrected = await validate(response);
    console.log("questionValidate", corrected);
    // If the validator explicity returns true, then return the original resposne
    if (corrected === true) {
      return response;
    }
    // Else if the validator returns a string which coerces to true, the return the corrected string
    if (corrected) {
      return corrected;
    }
    // Else, the validator failed. Print the failureMessage, and start again
    channel.send(failureMessage);
    return questionValidate(question, channel, validate, failureMessage);
  });
}

function choose(question: string, channel: DMChannel, options: string[][]) {
  return questionValidate(
    question,
    channel,
    response => {
      let index = options.findIndex(opt =>
        opt.includes(response.toUpperCase())
      );
      if (index < 0) return false;
      return options[index][0];
    },
    "I'm not sure I understand what you mean"
  );
}

export { ask, askString as question, questionValidate, choose };
