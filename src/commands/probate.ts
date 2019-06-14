import { Message } from "discord.js";
import probate from "../behaviors/probation";
import Command, { Permissions } from "../lib/command";
import { client } from "../client";

export class ProbateCommand extends Command("probate", "dq") {
  check = Permissions.compose(
    Permissions.admin,
    message => !message.mentions.members.has("274004148276690944")
  );

  fail(message: Message) {
    // First, chastise for trying to put me on probation
    if (message.mentions.members.has("274004148276690944")) {
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

  exec(message: Message, args: string[]) {
    const victims = message.mentions.members;
    const [duration, ...reason] = args.slice(victims.size);

    message.mentions.members.forEach(member => {
      probate(member, message.member, duration, reason.join(" "));
    });
  }
}

export default new ProbateCommand();
