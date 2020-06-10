import { Message, GuildMember } from "discord.js";
import probate from "../behaviors/probation";
import Command, { Permissions } from "../lib/command";
import { authorization, behavior } from "../lib/access";
import * as keya from "keya";

const owner = authorization("discord.owner") as string;

function enabled(guild: string) {
  const server = behavior(guild);

  return !!server && !!server.probation;
}

export const ProbateCommand = Command({
  names: ["probate", "dq"],
  documentation: {
    usage: "[probate|dq] @MayorMonty @bradley 10m I don't like you",
    description: "Puts listed members on probation",
    group: "ADMIN",
  },

  check: Permissions.compose(
    Permissions.admin,

    // Don't allow owner DQ
    (message) => !message.mentions.members?.has(owner),

    // Don't allow on disabled servers
    (message) => enabled(message.guild?.id ?? "")
  ),

  fail(message: Message) {
    if (!message.guild) return;

    if (!enabled(message.guild?.id ?? "")) {
      message.channel.send("Probation isn't enabled here");
    }

    // First, chastise for trying to put me on probation
    if (message.mentions.members?.has(owner)) {
      message.channel.send("nah fam");
    } else {
      message.channel.send("no u");
    }

    if (!message.member) {
      return;
    }

    probate(
      message.member,
      message.member.guild.me as GuildMember,
      "1m",
      "Unauthorized use of probate"
    );
  },

  async exec(message: Message, args: string[]) {
    const victims = message.mentions.members;

    if (!victims) return;
    if (message.member === null) return;

    const [duration, ...reason] = args.slice(victims.size);

    victims.forEach((member) => {
      probate(
        member,
        message.member as GuildMember,
        duration,
        reason.join(" ")
      );
    });

    // Update probation records
    const store = await keya.store("probations");

    // Get records for relevant parties
    const executor: {
      citations: number;
      executed: number;
    } = (await store.get(message.member.id)) || {
      citations: 0,
      executed: 0,
    };
    await Promise.all(
      victims.map((victim) =>
        store
          .get(victim.id)
          .then((record) => (record ? record : { citations: 0, executed: 0 }))
      )
    );

    // Increment executor
    executor.executed++;

    // Increment victims
  },
});
