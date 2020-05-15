import { addMessageHandler } from "../../lib/message";

import { Guild, GuildMember, PartialGuildMember } from "discord.js";
import { client } from "../../client";
import { askString, choose, questionValidate } from "../../lib/prompt";

import * as vexdb from "vexdb";
import approve from "./approve";

export function findOrMakeRole(name: string, guild: Guild) {
  let role = guild.roles.resolve(name);
  return role
    ? Promise.resolve(role)
    : guild.roles.create({ data: { name, mentionable: true } });
}

export default async function verify(member: GuildMember | PartialGuildMember) {
  if (member.partial) {
    member = await member.fetch();
  }

  // Slide into DMs
  const dm = await member.createDM();

  const name = await askString(
    "Welcome to VEX Teams of South Carolina! In order to participate, you'll need to verify some basic information with us. What should we call you? **(Your Name/Nickname)**",
    dm
  );

  let team = await questionValidate(
    "What team are you *primarily* a part of?",
    dm,
    async (team) =>
      team === "OVERRIDE" || !!(await vexdb.size("teams", { team })),
    "There doesn't appear to be a team with that number. Make sure you are listing a registered team that has gone to an event. If you need a manual override, please enter `OVERRIDE`"
  );

  let override = false;
  if (team === "OVERRIDE") {
    override = true;
    team = await askString(
      "Please specify why you are overriding. This will be visible to admins.",
      dm
    );
  }

  const role = await choose(
    "What is your relationship with your primary team? *(Member, Alumni, Mentor)*",
    dm,
    [
      ["MEMBER", "COMPETITOR", "TEAM MEMBER"],
      ["ALUMNI", "GRADUATED", "ALUMNUS", "ALUM"],
      ["MENTOR", "COACH", "ADVISOR"],
    ]
  );

  // Add additional teams
  const additional = await choose(
    "Do you have any other teams you are/were involved with? (yes/no)",
    dm,
    [
      ["YES", "Y"],
      ["NO", "N"],
    ]
  );

  let teams = additional;
  if (additional === "YES") {
    teams = await askString("Please list all of these below", dm);
  }

  await dm.send(
    "You're all set! Your verification is currently being reviewed by Admins. You can communicate with us in <#478086282111614977>"
  );

  // Actual verification process
  const roles = ["310902227160137730"]; // Verified

  if (!override) {
    const teaminfo = (await vexdb.get("teams", { team }))[0];
    if (role !== "ALUMNI") {
      // Program
      if (teaminfo.program == "VEXU") {
        roles.push("377219725442154526"); // VEXU
      } else if (teaminfo.grade == "Middle School") {
        roles.push("376489822598201347"); // Middle School
      } else {
        roles.push("376489878700949515"); // High School
      }
    }

    if (teaminfo.region === "South Carolina") {
      let teamRole = await findOrMakeRole(team.toUpperCase(), member.guild);
      roles.push(teamRole.id); // Team Role
    } else {
      roles.push("387074517408808970"); // Not SC Team
    }
  }

  switch (role) {
    case "MEMBER":
      break;
    case "ALUMNI":
      roles.push("329760448020873229");
      break; // Alumnus
    case "MENTOR":
      roles.push("329760518334054402");
      break; // Mentor
  }

  const approved = await approve(member, name, team, teams, roles);
  if (approved) {
    dm.send("Your verification has been approved!");
    member.setNickname(`${name} | ${team}`);
    member.roles.add(roles);
  } else {
    const invites = await member.guild.fetchInvites();
    const invite = invites.find(
      (invite) => invite.expiresAt === null && invite.maxUses == null
    );

    dm.send(
      `Your verification was denied. ${
        invite
          ? `If you believe this to be incorrect, join below ${invite.url}`
          : ""
      }`
    );
  }
}

// Start verification process on member join
client.on("guildMemberAdd", verify);
