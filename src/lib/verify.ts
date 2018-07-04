/**
 * Verification Flow
 */

import { question, choose, questionValidate } from "./prompt";
import { addMessageHandler } from "./message";
import vexdb from "vexdb";
import {
  Guild,
  GuildMember,
  TextChannel,
  DMChannel,
  GroupDMChannel,
  GuildChannel
} from "discord.js";

function findOrMakeRole(name: string, guild: Guild) {
  let role = guild.roles.find("name", name);
  return role
    ? Promise.resolve(role)
    : guild.createRole({ name, mentionable: true });
}

function verify(
  member: GuildMember,
  welcomeChannel?: TextChannel | DMChannel | GroupDMChannel
) {
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
      "There doesn't appear to be a team with that number."
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
        verification.role === "ALUMNI" ? "ALUM" : ""
      }`,
      "Verification: Nickname"
    );

    let team = (await vexdb.get("teams", { team: verification.team }))[0];

    // Add roles
    let roles = ["310902227160137730"]; // Competitors (aka Verified)

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

    member.addRoles(roles, "Verification: Roles");
    channel.send(
      "You're all set up! Note that you can change your nickname at any time, but please keep it in the correct format"
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
  });
}

addMessageHandler(message => {
  let activate =
    message.content.startsWith("!join") &&
    !(message.channel instanceof DMChannel) &&
    !(message.channel instanceof GroupDMChannel);
  if (activate) {
    verify(message.member, message.channel);
    return true;
  }
});

export default verify;
