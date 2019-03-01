/**
 * Verification Flow
 */

import { question, choose, questionValidate } from "./prompt";
import { addMessageHandler, addCommand } from "./message";
import * as vexdb from "vexdb";
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
import { client } from "../client";

function findOrMakeRole(name: string, guild: Guild) {
  let role = guild.roles.find("name", name);
  return role
    ? Promise.resolve(role)
    : guild.createRole({ name, mentionable: true });
}

async function approve(
  channel: TextChannel,
  welcomeChannel: TextChannel,
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
          channel.send(`Welcome ${member}`)!;
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

async function verifyWPI(
  member: GuildMember,
  welcomeChannel?: TextChannel | DMChannel | GroupDMChannel,
  approveChannel?: TextChannel | DMChannel | GroupDMChannel
) {
  const dm = await member.createDM();

  const roles = ["Verified"];

  dm.send("Welcome to Welcome to the WPI Signature Event VEX Discord");
  dm.send(
    "In order to participate, you'll need to verify some information with us"
  );

  const name = await question(
    "What should we call you? *Don't include your team number*",
    dm
  );

  const team = await questionValidate(
    "What team are you *primarily* a part of?",
    dm,
    async team => !!(await vexdb.size("teams", { team })),
    "There doesn't appear to be a team with that number. Make sure you are listing a registered team that has gone to an event. If you need a manual override, please message one of the admins"
  );

  member.setNickname(`${name} | ${team}`);

  const teamdata = (await vexdb.get("teams", { team }))[0];
  const goingToWPI = (await vexdb.get("teams", { sku: "RE-VRC-19-5411" })).some(
    t => t.number == teamdata.number
  );

  if (goingToWPI) {
    roles.push("WPI");
  }

  dm.send("You're all set! Your information is awaiting approval. Hang tight!");

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

  const approve = (await approveChannel.send(embed)) as Message;
}

function verifySC(
  member: GuildMember,
  welcomeChannel?: TextChannel | DMChannel | GroupDMChannel,
  approveChannel?: TextChannel | DMChannel | GroupDMChannel
) {
  if (!approveChannel) {
    approveChannel = member.guild.channels.get(
      "478064021136998401"
    ) as TextChannel;
  }

  member.createDM().then(async channel => {
    let verification: {
      name: string;
      team: string;
      role: string;
    } = {
      name: "",
      team: "",
      role: ""
    };
    channel.send("Welcome to VEX Teams of South Carolina!");
    channel.send(
      "In order to participate, you'll need to verify some basic information with us."
    );

    console.log("Get Name");
    verification.name = await question(
      "What should we call you? *(First Name, Nickname, etc.)*",
      channel
    );

    verification.team = await questionValidate(
      "What team are you *primarily* a part of?",
      channel,
      async team => !!(await vexdb.size("teams", { team })),
      "There doesn't appear to be a team with that number. Make sure you are listing a registered team that has gone to an event. If you need a manual override, please message one of the admins"
    );
    verification.role = await choose(
      "On your team, what role do you serve? *(Member, Alumni, Mentor)*",
      channel,
      [
        ["MEMBER", "COMPETITOR", "TEAM MEMBER"],
        ["ALUMNI", "GRADUATED", "ALUMNUS", "ALUM"],
        ["MENTOR", "COACH", "ADVISOR"]
      ]
    );

    console.log(
      `Verify ${member.user.username}#${member.user.discriminator}`,
      verification
    );
    member.setNickname(
      `${verification.name} | ${verification.team} ${
        verification.role === "ALUMNI" ? "Alum" : ""
      }`,
      "Verification: Nickname"
    );

    let team = (await vexdb.get("teams", { team: verification.team }))[0];

    // Add roles
    let roles = ["310902227160137730"]; // Verified

    if (verification.role !== "ALUMNI") {
      // Program
      if (team.program == "VEXU") {
        roles.push("377219725442154526"); // VEXU
      } else if (team.grade == "Middle School") {
        roles.push("376489822598201347"); // Middle School
      } else {
        roles.push("376489878700949515"); // High School
      }
    }

    // Team
    if (team.region === "South Carolina") {
      let teamRole = await findOrMakeRole(verification.team, member.guild);
      roles.push(teamRole.id); // Team Role
    } else {
      roles.push("387074517408808970"); // Not SC Team
    }

    switch (verification.role) {
      case "MEMBER":
        break; // No roles for just members! ;-)
      case "ALUMNI":
        roles.push("329760448020873229");
        break; // Alumnus
      case "MENTOR":
        roles.push("329760518334054402");
        break; // Mentor
    }

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

    approveChannel.send(embed).then(async (approval: Message) => {
      channel.send(
        "You're all set! Your information is awaiting approval. Hang tight!"
      );

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
              channel.send(`Welcome ${member}`)!;
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
    });
  });
}

addMessageHandler(message => {
  let activate =
    message.content.startsWith("!join") &&
    !(message.channel instanceof DMChannel) &&
    !(message.channel instanceof GroupDMChannel);
  if (activate) {
    verifySC(message.member, message.channel);
    return true;
  }
});

export default verifySC;

addCommand("approve", (args, message) => {
  let awaiting = message.channel.send({
    embed: {
      author: {
        name: message.author.username,
        icon_url: message.author.avatarURL
      },
      title: message.member.displayName,
      description: message.member.roles
        .filter(role => role.name !== "@everyone")
        .map(role => role.toString())
        .join("\n"),
      fields: [
        {
          name: "Team",
          value: "3796B"
        },
        {
          name: "Region",
          value: "South Carolina"
        }
      ]
    }
  });

  return true;
});
