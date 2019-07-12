import Command, { Permissions } from "../lib/command";
import { Message } from "discord.js";

// Finds the closest alphanumeric character (backwards)
function lookback(text: string, i: number): number {
  let index = i;
  do {
    index--;
  } while (!alphanumeric(text[index]));

  return index;
}

function alphanumeric(char: string): boolean {
  return /[A-z]/gi.test(char);
}

function upper(char: string): boolean {
  return char === char.toLocaleUpperCase();
}

function toSarcasmCase(text: string) {
  let lowercase = text.toLocaleLowerCase().split("");

  return lowercase
    .map((char, index) =>
      lookback(text, index) % 2
        ? char.toLocaleUpperCase()
        : char.toLocaleLowerCase()
    )
    .join("");
}

// Dumb Commands
export class SarcasmCommand extends Command("s") {
  check = Permissions.env("DEV", false);

  documentation() {
    return {
      group: "Meta",
      description: "SaRcAsM",
      usage: "s",
      hidden: true
    };
  }

  async exec(message: Message, args: string[]) {
    const channel = message.channel;
    const content = await channel
      .fetchMessages({ limit: 2 })
      .then(messages => messages.last().content);

    return message.channel.send(toSarcasmCase(content));
  }
}

new SarcasmCommand();
