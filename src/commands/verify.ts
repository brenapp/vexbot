import { Message } from "discord.js";
import verify from "../behaviors/verify";
import Command, { Permissions } from "../lib/command";
import { behavior } from "../lib/access";

Command({
  names: ["verify"],
  documentation: {
    description: "Manually starts verificatikon",
    usage: "verify @MayorMonty",
    group: "ADMIN",
  },

  check: Permissions.admin,
  async exec(message: Message) {
    const server = await behavior(message.guild?.id ?? "");

    if (!server.verify) {
      return message.channel.send(
        "Automatic verification is not enabled on this server"
      );
    }

    if (!message.mentions.members) {
      return message.channel.send("Specify a member to verify!");
    }

    message.mentions.members.forEach((member) => {
      verify(member);
    });
    return message.channel.send("Manually started verification");
  },
});
