import Command, { Permissions } from "../lib/command";
import { Message } from "discord.js";

export const GrantCommand = Command({
  names: ["grant"],
  documentation: {
    usage: "grant Role",
    description: "Grants the user a role",
    group: "Admin",
  },

  check: Permissions.compose(Permissions.guild, Permissions.admin),
  async exec(message: Message, args: string[]) {
    if (!message.mentions.members || !message.guild) {
      return;
    }

    const name = args.slice(message.mentions.members.size).join(" ");
    const roles = await message.guild.roles.fetch();
    const role = roles.cache.find((r) => r.name === name);

    if (!role) {
      return message.channel.send("Can't find that role!");
    }

    message.mentions.members.forEach((member) => member.roles.add(role));
  },
});

export const VanityCommand = Command({
  names: ["vanity"],
  documentation: {
    usage: "vanity Your Vanity Role Name",
    description: "Creates a vanity role",
    group: "Admin",
  },

  check: Permissions.compose(Permissions.guild, Permissions.admin),
  async exec(message: Message, args: string[]) {
    if (!message.mentions.members || !message.guild) {
      return;
    }

    const name = args.join(" ").trim();
    const roles = await message.guild.roles.fetch();
    let role = roles.cache.find((r) => r.name === name);

    if (role) {
      return message.channel.send(
        "Cannot create a vanity role with that name! That role already exists"
      );
    } else {
      role = await message.guild.roles.add({
        name,
        hoist: false,
        mentionable: false,
        permissions: 0,
      });
    }
  },
});
