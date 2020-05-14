import { Message } from "discord.js";
import verify from "../behaviors/verify";
import Command, { Permissions } from "../lib/command";

Command({
  names: ["verify"],
  documentation: {
    description: "Manually starts verificatikon",
    usage: "verify @MayorMonty",
    group: "ADMIN",
  },

  check: Permissions.admin,
  exec(message: Message) {
    // If they didn't mention anyone return
    if (!message.mentions.members) {
      return;
    }

    message.mentions.members.forEach((member) => {
      verify(member);
    });
    return message.channel.send("Manually started verification");
  },
});
