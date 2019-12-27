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

export class SouthCarolinaFactCommand extends Command("scfact") {
  check = Permissions.all;

  documentation() {
    return {
      group: "Meta",
      description: "Lists a random fact about SC",
      usage: "scfacts",
      hidden: false
    };
  }

  async exec(message: Message, args: string[]) {

    const facts = [
      `The oldest living organism this side of the Mississippi is the Angel Oak located on John's Island. It's estimated to be over 500 years old, and has a shady area of over 17,000 square feet.`,
      `Clemson University used to grow blue cheese in a civil-war era tunnel north of the campus called the Stumphouse Tunnel.`,
      `In 2005, two trains collided in Graniteville, SC. One of the trains released over 60 tons of Chlorine gas and exposed over 5,000 residents to deadly levels of Chlorine.`,
      `It is legal to beat your wife on the State Courthouse steps on Sundays.`,
      `Darlington Raceway in Darlington, SC is famous for it's infamously difficult egg-shaped layout. This was due to the original landowner requesting that his millpond not be disturbed during the construction of the track; construction crews had to readjust the turns appropriately.`,
      `There's a snack distributer in Columbia called Cromer's that has the slogan "Guaranteed Worst in Town."`,
      `SC has some weird town names: Effing, Due West, Frog Level, Aynor, and Welcome, to name a few.`,
      `There's legends of a Lizard Man roaming Scape Ore Swamp in Lee County.`,
      `It's illegal to fish with a Yo-Yo on Lake Marion.`,
      `Mount Pleasant is the only place where Sweetgrass Baskets are still produced in the US.`,
      `Before being dubbed "The Palmetto State", South Carolina was known as "The Iodine State" due to it's large production of Iodized Salt.`,
      `Vanna White, the co-host of Wheel of Fortune, was born in North Myrtle Beach, SC.`,
      `The largest suspension bridge in North America is the Arthur J. Ravenel, Jr. bridge, which connects Charleston and Mount Pleasant.`,
      `There's a full-size Aircraft Carrier in Charleston harbor - the USS Yorktown.`,
      `There are ancient sand dunes everywhere in central SC, which denotes the location of the coastline over 20 million years ago.`,
      `It is illegal to swear in public in Myrtle Beach.`,
      `It is illegal to keep a horse in a bathtub in SC.`,
      `Despite Georgia being called "The Peach State", South Carolina actually produces more peaches per capita every year.`,
      `Stephen Colbert, the host of "The Late Show with Stephen Colbert", grew up on James Island, SC.`,
      `The legendary pirate captain Blackbeard was infamous for terrorizing South Carolinian colonial port cities. He was also executed in Charleston.`,
      `Charleston, SC, is considered one of the most haunted cities in the world.`,
      `There are about 3,500 Rhesus Monkeys that live on Morgan Island, SC.`,
      `The Dootlittle Raiders, the famous WWII bombing squadron, practiced their bombing techniques by dropping bags of flour and empty shells on wooden targets on an island in the middle of Lake Murray. Remnants of the targets, bomb casings, and flour sacks are still present on Bomb Island.`,
      `The world's hottest pepper, the Carolina Reaper, was engineered by Ed Currie of Fort Mill, SC. It registers at over 1.641 million Scoville Units, and people who eat one often vomit, have spasms, and pass out.`,
      `The first game of golf played in North America was on Seabrook Island in 1786. To this day, Seabrook Island is a destination for professional golfers around the world.`,
      `Behind Christianity, the Baha'i faith is SC's largest religious group.`,
      `South Carolina is one of many states that are a part of the Academic Common Market, which allows students declaring certain majors to pay in-state tuition at institutions even if they hail from out of state.`,
      `In 1865, SC Senator Preston Brooks almost fatally beat Massachusetts Senator Charles Sumner on the floor of the US Senate Chamber.`,
      `There is a town in SC called Frog Level. However, the residents of the town call it "Prosperity", since "Frog Level doesn't sound appealing." This has worked so well that even Google and Apple Maps have it labeled as Prosperity.`,
      `In 1958, the US Government accidentally dropped a Nuclear Bomb on Mars Bluff, SC. The blast created a hole 75 feet wide and 30 feet deep, and miraculously killed nobody.`
    ]

    // Get random fact
    const fact = facts[Math.round(Math.random() * facts.length)];

    return message.channel.send(fact);

  }
}

new SouthCarolinaFactCommand();