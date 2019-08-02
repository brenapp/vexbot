import { Message } from "discord.js";
import probate from "../behaviors/probation";
import Command, { Permissions } from "../lib/command";
import { client } from "../client";
import { authorization } from "../lib/access";
import SQLiteStore from "keya/out/node/sqlite";
import keya from "keya";

const owner = authorization("discord.owner");

export class ProbateCommand extends Command("probate", "dq") {
  check = Permissions.compose(
    Permissions.admin,
    message =>
      message.channel.type === "text" && !message.mentions.members.has(owner)
  );

  store: SQLiteStore | null = null;
  constructor() {
    super();
    keya.store("probations").then(store => (this.store = store));
  }

  documentation() {
    return {
      usage: "[probate|dq] @MayorMonty @bradley 10m I don't like you",
      description: "Puts listed members on probation",
      group: "ADMIN"
    };
  }

  fail(message: Message) {
    // First, chastise for trying to put me on probation
    if (
      message.channel.type === "text" &&
      message.mentions.members.has(owner)
    ) {
      message.channel.send("nah fam");
    } else {
      message.channel.send("no u");
    }

    probate(
      message.member,
      message.member.guild.me,
      "1m",
      "Unauthorized use of probate"
    );
  }

  async exec(message: Message, args: string[]) {
    const victims = message.mentions.members;
    const [duration, ...reason] = args.slice(victims.size);

    message.mentions.members.forEach(member => {
      probate(member, message.member, duration, reason.join(" "));
    });

    // Update probation records

    // If we don't have a reference to the database by now, then we need to wait for it.
    if (!this.store) {
      this.store = await keya.store("probations");
    }

    // Get records for relevant parties
    const executor: {
      citations: number;
      executed: number;
    } = (await this.store.get(message.member.id)) || {
      citations: 0,
      executed: 0
    };
    const citations: {
      citations: number;
      executed: number;
    }[] = await Promise.all(
      victims.map(victim =>
        this.store
          .get(victim.id)
          .then(record => (record ? record : { citations: 0, executed: 0 }))
      )
    );

    // Increment executor
    executor.executed++;

    // Increment victims
  }
}

export default new ProbateCommand();
