/**
 * VERIFICATION FOR SC
 */

import { question, choose, questionValidate } from "../prompt";
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
import { findOrMakeRole, approve } from "./index";

export async function verifySC(
  member: GuildMember,
  welcomeChannel?: TextChannel | DMChannel | GroupDMChannel,
  approveChannel?: TextChannel | DMChannel | GroupDMChannel
) {
  approveChannel = member.guild.channels.get(
    "478064021136998401"
  ) as TextChannel;

  const channel = await member.createDM();
  let name = "",
    team = "",
    role = "";

  channel.send("Welcome to VEX Teams of South Carolina!");
  channel.send(
    "In order to participate, you'll need to verify some basic information with us."
  );

  name = await question(
    "What should we call you? *(First Name, Nickname, etc.)*",
    channel
  );

  team = await questionValidate(
    "What team are you *primarily* a part of?",
    channel,
    async team => !!(await vexdb.size("teams", { team })),
    "There doesn't appear to be a team with that number. Make sure you are listing a registered team that has gone to an event. If you need a manual override, please message one of the admins"
  );

  role = await choose(
    "On your team, what role do you serve? *(Member, Alumni, Mentor)*",
    channel,
    [
      ["MEMBER", "COMPETITOR", "TEAM MEMBER"],
      ["ALUMNI", "GRADUATED", "ALUMNUS", "ALUM"],
      ["MENTOR", "COACH", "ADVISOR"]
    ]
  );

  member.setNickname(
    `${name} | ${team} ${role === "ALUMNI" ? "Alum" : ""}`,
    "Verification: Nickname"
  );

  let data = (await vexdb.get("teams", { team }))[0];

  let roles = ["310902227160137730"]; // Verified

  if (role !== "ALUMNI") {
    // Program
    if (data.program == "VEXU") {
      roles.push("377219725442154526"); // VEXU
    } else if (data.grade == "Middle School") {
      roles.push("376489822598201347"); // Middle School
    } else {
      roles.push("376489878700949515"); // High School
    }
  }

  // Team
  if (data.region === "South Carolina") {
    let teamRole = await findOrMakeRole(team, member.guild);
    roles.push(teamRole.id); // Team Role
  } else {
    roles.push("387074517408808970"); // Not SC Team
  }

  switch (role) {
    case "MEMBER":
      break; // No roles for just members! ;-)
    case "ALUMNI":
      roles.push("329760448020873229");
      break; // Alumnus
    case "MENTOR":
      roles.push("329760518334054402");
      break; // Mentor
  }

  channel.send(
    "Your verification has been submitted to admins for review. Hang tight!"
  );

  const approved = await approve(approveChannel, welcomeChannel, roles, member);

  if (approved) {
    channel.send(
      "Your verification has been approved! Note that you can change your nickname at any time, but please keep it in the correct format"
    );
  } else {
    channel.send(
      "Your verification has been denied. If you believe this to be in error, rejoin again with https://discord.gg/SknD77G"
    );
  }
}
