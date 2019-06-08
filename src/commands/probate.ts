import { Message } from "discord.js";
import probate from "../behaviors/probation";
import Command, { Permissions } from "../lib/command";

export class ProbateCommand extends Command("probate") {
  check = Permissions.admin;

  exec(message: Message, args: string[]) {
    const victims = message.mentions.members;
    const [duration, ...reason] = args.slice(victims.size);

    message.mentions.members.forEach(member => {
      probate(member, message.member, duration, reason.join(" "));
    });
  }
}

export default new ProbateCommand();
