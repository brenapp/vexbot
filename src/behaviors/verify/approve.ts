import {
  GuildMember,
  RichEmbed,
  TextChannel,
  Message,
  User,
  MessageReaction,
} from "discord.js";
import { client } from "../../client";

export default async function approve(
  member: GuildMember,
  name: string,
  team: string,
  additionalTeams: string,
  roles: string[]
): Promise<boolean> {
  const embed = new RichEmbed()
    .setAuthor(member.user.username, member.user.avatarURL)
    .setTitle(`Verification for ${name}`)
    .setDescription(
      `${member} \n Requested Roles: ${roles
        .map((role) => member.guild.roles.get(role)?.toString())
        .join(", ")}`
    )
    .addField("Primary Team", team)
    .addField("Additional Teams", additionalTeams)
    .setTimestamp();

  // Post verification request
  const channel = member.guild.channels.find(
    (channel) => channel.name === "member-approval" && channel.type == "text"
  ) as TextChannel;

  const approval = (await channel.send(embed)) as Message;
  await Promise.all([approval.react("👍"), approval.react("👎")]);

  return new Promise((resolve, reject) => {
    let collector = approval.createReactionCollector(
      (vote, usr: User) =>
        (vote.emoji.name === "👎" || vote.emoji.name === "👍") && !usr.bot
    );
    let handleReaction: (vote: MessageReaction) => void;
    collector.on(
      "collect",
      (handleReaction = (vote) => {
        const approver = vote.users.last();

        if (vote.emoji.name === "👍") {
          member.addRoles(roles, "Verification: Roles");

          approval.edit(
            embed.addField("Outcome", `Approved by ${approver.toString()}`)
          );

          if (collector.off) {
            collector.off("collect", handleReaction);
          }

          resolve(true);
        } else {
          approval.edit(
            embed.addField(
              "Outcome",
              `Denied and kicked by ${approver.toString()}`
            )
          );
          member.kick("Verification Denied.");
        }
        collector.emit("end");
        approval.clearReactions();

        resolve(false);
      })
    );
    collector.on("end", () => {});
  }) as Promise<boolean>;
}
