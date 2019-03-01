import { addMessageHandler, addCommand } from "../message";

import {
  Guild,
  GuildMember,
  TextChannel,
  DMChannel,
  GroupDMChannel,
  GuildChannel,
  Message,
  MessageReaction,
  RichEmbed,
  Channel
} from "discord.js";
import { client } from "../../client";

import { verifySC } from "./sc";
import { verifyWPI } from "./wpi";

export function findOrMakeRole(name: string, guild: Guild) {
  let role = guild.roles.find(role => role.name === name);
  return role
    ? Promise.resolve(role)
    : guild.createRole({ name, mentionable: true });
}

export default async function verify(
  member: GuildMember,
  welcomeChannel?: TextChannel | DMChannel | GroupDMChannel,
  approveChannel?: TextChannel | DMChannel | GroupDMChannel
) {
  if (member.guild.id == "550859364894900225") {
    verifyWPI(member, welcomeChannel, approveChannel);
  } else if (member.guild.id == "310820885240217600") {
    verifySC(member, welcomeChannel, approveChannel);
  }
}

client.on("guildMemberAdd", verify);

export async function approve(
  channel: TextChannel | DMChannel | GroupDMChannel,
  welcomeChannel: TextChannel | DMChannel | GroupDMChannel,
  roles: string[],
  member: GuildMember
) {
  // Make approval embed
  let embed = new RichEmbed()
    .setAuthor(member.user.username, member.user.avatarURL)
    .setTitle("Member Verification")
    .setDescription(
      `${member} \n Requested Roles: ${roles
        .map(role => member.guild.roles.get(role).toString())
        .join(", ")}`
    )
    .addField("Verification Process", [
      "This member is seeking verification",
      `You can interact with them in ${member.guild.channels.find(
        "name",
        "verification"
      )}`
    ])
    .addField(
      "Approving Members",
      "React with :thumbsup: to approve the member"
    )
    .addField(
      "Deny and Kick",
      "If the member's verification violates rules or guidelines set by Admins, react with :thumbsdown:"
    )
    .setTimestamp();

  const approval = (await channel.send(embed)) as Message;

  await Promise.all([approval.react("👍"), approval.react("👎")]);

  let collector = approval.createReactionCollector(
    (vote, usr) =>
      (vote.emoji.name === "👎" || vote.emoji.name === "👍") &&
      usr !== client.user
  );
  let handleReaction;
  collector.on(
    "collect",
    (handleReaction = vote => {
      const approver = vote.users.last();

      if (vote.emoji.name === "👍") {
        member.addRoles(roles, "Verification: Roles");
        channel.send(
          "Your verification has been approved! Note that you can change your nickname at any time, but please keep it in the correct format"
        );

        approval.edit(
          embed.addField("Outcome", `Approved by ${approver.toString()}`)
        );

        if (welcomeChannel) {
          welcomeChannel.send(`Welcome ${member}!`);
        } else {
          let channel: TextChannel = member.guild.channels.find(
            "name",
            "general"
          ) as TextChannel;
          channel.send(`Welcome ${member}!`)!;
        }

        if (collector.off) {
          collector.off("collect", handleReaction);
        }
      } else {
        approval.edit(
          embed.addField(
            "Outcome",
            `Denied and kicked by ${approver.toString()}`
          )
        );
        member.kick("Verification Denied.");
        channel.send(
          "Your verification has been denied. Rejoin the server to try again!"
        );
      }
      collector.emit("end");
      approval.clearReactions();
    })
  );
  collector.on("end", () => {});
}
