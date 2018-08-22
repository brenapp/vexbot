import { addCommand } from "../message";
import { RichEmbed, Message } from "discord.js";

// Syntax: !motion [type] ...[Motion Proposal]
// Where [type] is:
//  prop - Basic Resolution. Requires > 50%
//  recall - Remove an Officer. Requires > 66%. Officer doesn't get to vote (@ them in motion proposal)
addCommand("motion", async (args, message) => {
  const [type, ...proposal] = args;
  const embed = new RichEmbed()
    .setTitle("Mann Robotics Council Resolution")
    .setAuthor(message.member.displayName, message.member.user.avatarURL)
    .setDescription(proposal.join(" "));

  const votingRole = message.guild.roles.find("name", "Leadership Team");

  let requiredVotes: number;

  if (type === "prop") {
    requiredVotes = Math.ceil(votingRole.members.size / 2);
    embed
      .addField(
        "Procedure",
        "This is a standard resolution, and can be passed via a simple majority. React to this message with :thumbsup: to approve the measure, or with :thumbsdown: to deny the measure. *Note: vexbot reacts with both so you can select them easier, these do not count as votes*"
      )
      .setColor("BLUE");
  } else if (type === "recall") {
    // Recall MUST mention the member. This is so the officer cannot vote on the resolution, and forces a sort of face your accusor right
    if (!message.mentions.members.size) {
      message.channel.send("Recall proposals MUST mention the user (with @)");
      return;
    }
    requiredVotes = Math.ceil(((votingRole.members.size - 1) * 2) / 3);
    embed
      .addField(
        "Procedure",
        "Officer Recall requires two-thirds approval of the council. The named officer is not permitted to vote. React to this message with :thumbsup: to approve the measure, or with :thumbsdown: to deny the measure. *Note: vexbot reacts with both so you can select them easier, these do not count as votes*"
      )
      .setColor("RED")
      .setDescription(`Recall ${embed.description}`);
  } else {
    message.channel.send(
      "Unknown Proposal Type. Valid types are `prop` (used in most cases), and `recall` (to remove an officer)"
    );
    return;
  }

  embed.addField(
    "Threshold",
    `${requiredVotes} approval votes are required to pass this resolution.`
  );

  const vote: Message = (await message.channel.send({ embed })) as Message;

  await vote.react("👍");
  await vote.react("👎");

  return true;
});
