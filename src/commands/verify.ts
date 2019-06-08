import { Message } from "discord.js";
import verify from "../behaviors/verify";
import Command, { Permissions } from "../lib/command";

export class VerifyCommand extends Command("verify") {
  check = Permissions.admin;

  exec(message: Message) {
    message.mentions.members.forEach(member => {
      verify(member);
    });
    return message.channel.send("Manually started verification");
  }
}

export default new VerifyCommand();
