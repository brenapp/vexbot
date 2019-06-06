import { Message } from "discord.js";
import verify from "../behaviors/verify";
import Command from "../lib/command";

export class VerifyCommand extends Command("verify") {
  check(message: Message) {
    return message.member.hasPermission("ADMINISTRATOR");
  }

  exec(message: Message) {
    message.mentions.members.forEach(member => {
      verify(member);
    });
    message.channel.send("Manually started verification");
  }
}

export default new VerifyCommand();
