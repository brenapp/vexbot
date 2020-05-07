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
  exec(message: Message, args: string[]) {
    let name = args.slice(message.mentions.members.size).join(" ");
    const role = message.guild.roles.find((role) => role.name === name);

    if (!role) {
      return message.channel.send("Can't find that role!");
    }

    message.mentions.members.forEach((member) => member.addRole(role));
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
    const name = args.join(" ").trim();
    let role = message.guild.roles.find((role) => role.name === name);

    if (role) {
      return message.channel.send(
        "Cannot create a vanity role with that name! That role already exists"
      );
    } else {
      role = await message.guild.createRole({
        name,
        hoist: false,
        mentionable: false,
        permissions: 0,
      });
    }
  },
});
