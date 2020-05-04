import Command, { Permissions, makeEmbed } from "../lib/command";
import { Message } from "discord.js";
import { findOrMakeRole } from "../behaviors/verify";

export class GrantCommand extends Command("grant") {
  check = Permissions.compose(Permissions.guild, Permissions.admin);

  documentation = {
    usage: "grant Role",
    description: "Grants the user a role",
    group: "Admin",
  };

  exec(message: Message, args: string[]) {
    let name = args.slice(message.mentions.members.size).join(" ");
    const role = message.guild.roles.find((role) => role.name === name);

    if (!role) {
      return message.channel.send("Can't find that role!");
    }

    message.mentions.members.forEach((member) => member.addRole(role));
  }
}

new GrantCommand();

export class VanityCommand extends Command("vanity") {
  check = Permissions.compose(Permissions.guild, Permissions.admin);

  documentation = {
    usage: "vanity Your Vanity Role Name",
    description: "Creates a vanity role",
    group: "Admin",
  };

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
  }
}

new VanityCommand();
