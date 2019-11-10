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
  check = Permissions.all;

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

    await message.delete();

    return message.channel.send(toSarcasmCase(content));
  }
}

new SarcasmCommand();

// Uwuify
const faces = ["(・`ω´・)", ";;w;;", "owo", "UwU", ">w<", "^w^"];

function uwuify(str) {
  str = str.replace(/(?:r|l)/g, "w");
  str = str.replace(/(?:R|L)/g, "W");
  str = str.replace(/n([aeiou])/g, "ny$1");
  str = str.replace(/N([aeiou])/g, "Ny$1");
  str = str.replace(/N([AEIOU])/g, "Ny$1");
  str = str.replace(/ove/g, "uv");
  str = str.replace(
    /!+/g,
    " " + faces[Math.floor(Math.random() * faces.length)] + " "
  );

  return str;
}

export class UwuCommand extends Command("uwu") {
  check = Permissions.all;

  documentation() {
    return {
      group: "Meta",
      description: "Tag me to uwuize messages",
      usage: "uwu",
      hidden: true
    };
  }

  async exec(message: Message, args: string[]) {
    const channel = message.channel;
    const content = await channel
      .fetchMessages({ limit: 2 })
      .then(messages => messages.last().content);

    await message.delete();

    return message.channel.send(uwuify(content));
  }
}

new UwuCommand();


function cowsay(message) {
  return ` ${"-".repeat(message.length + 2)}
< ${message} >
 ${"-".repeat(message.length + 2)}\n` +
    [
      "        \\   ^__^",
      "         \\  (oo)\\_______",
      "            (__)\\       )\\\/\\",
      "               ||----w |",
      "               ||     ||"
    ].join("\n")
}

export class CowsayCommand extends Command("cowsay") {
  check = Permissions.all;

  documentation() {
    return {
      group: "Meta",
      description: "Perhaps",
      usage: "cowsay <message>",
      hidden: true
    };
  }

  async exec(message: Message, args: string[]) {

    const cow = args.join(" ") || "Perhaps"

    return message.channel.send("```" + cowsay(cow) + "```");
  }
}

new CowsayCommand();


export class BeepBeepCommand extends Command("beepbeep") {
  check = Permissions.all;

  documentation() {
    return {
      group: "Meta",
      description: "Delivery",
      usage: "beepbeep <message>",
      hidden: true
    };
  }

  async exec(message: Message, args: string[]) {

    const m = args.join(" ") || "I am #BCUZBUILT"

    return message.channel.send([
      "──────▄▌▐▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀​▀▀▀▀▀▀▌",
      "───▄▄██▌█ beep beep",
      `▄▄▄▌▐██▌█ ${m}`,
      "███████▌█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄​▄▄▄▄▄▄▌",
      "▀(@)▀▀▀▀▀▀▀(@)(@)▀▀▀▀▀▀▀▀▀▀▀▀▀​▀▀▀▀(@)▀"
    ].join("\n"));
  }
}

new BeepBeepCommand();

