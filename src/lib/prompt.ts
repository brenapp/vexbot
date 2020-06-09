/**
 * Utility kit to prompt users
 * Used in verification flow
 */

import { addOneTimeMessageHandler } from "./message";
import { Message, DMChannel } from "discord.js";

/**
 * Asks a user in their respective DMChannel
 * @param question Question to ask
 * @param channel Channel to ask in ()
 * @returns The response message
 */
function ask(question: string, channel: DMChannel): Promise<Message> {
  channel.send(question);
  return new Promise<Message>((resolve) => {
    addOneTimeMessageHandler((message) => {
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
export function askString(
  question: string,
  channel: DMChannel
): Promise<string> {
  return ask(question, channel).then((message) => message.content);
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
  return askString(question, channel).then(async (response) => {
    const corrected = await validate(response);
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

async function choose(
  question: string,
  options: string[],
  channel: DMChannel,
  failure = "I don't understand what you mean"
): Promise<number> {
  options = options.map((o) => o.toUpperCase());
  const prompt = `${question} *(${options.join(", ")})*`;

  const response = await askString(prompt, channel);

  if (options.includes(response)) {
    return options.indexOf(response);
  } else {
    await channel.send(failure);
    return choose(question, options, channel, failure);
  }
}

export { ask, askString as question, questionValidate, choose };
