import { Guild, GuildMember, PartialGuildMember, Role } from "discord.js";
import { client } from "../../client";
import { askString, choose, questionValidate } from "../../lib/prompt";

import * as vexdb from "vexdb";
import approve from "./approve";
import { behavior } from "../../lib/access";

export async function findOrMakeRole(
  name: string,
  guild: Guild
): Promise<Role> {
  const role = guild.roles.cache.find((role) => role.name === name);

  return role
    ? Promise.resolve(role)
    : guild.roles.create({ data: { name, mentionable: true } });
}

export default async function verify(
  member: GuildMember | PartialGuildMember
): Promise<void> {
  if (member.partial) {
    member = await member.fetch();
  }

  // Get the specific server behavior
  const server = await behavior(member.guild.id);

  // Check if it's valid
  if (!server || !server.verify) {
    return;
  }

  // Slide into DMs
  const dm = await member.createDM();

  const name = await askString(
    `Welcome to ${member.guild.name}! In order to participate, you'll need to verify some basic information with us. What should we call you? **(Your Name/Nickname)**`,
    dm
  );

  let team = await questionValidate(
    "What team are you *primarily* a part of?",
    dm,
    async (team) => {
      if (team === "OVERRIDE") {
        return true;
      }

      const data = await vexdb.get("teams", { team });

      return data.length > 0;
    },
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
    "What is your primary role on your team?",
    ["Member", "Alum", "Mentor"],
    dm
  );

  const roleString = ["MEMBER", "ALUMNI", "MENTOR"][role];

  // Add additional teams
  const additional = await choose(
    "Do you have any other teams you are/were involved with?",
    ["Y", "N"],
    dm
  );

  let teams;
  if (additional === 0) {
    teams = await askString("Please list all of these below", dm);
  } else {
    teams = "No extra";
  }

  await dm.send(
    "You're all set! Your verification is currently being reviewed by Admins. You can communicate with us in <#478086282111614977>"
  );

  // Actual verification process
  const roles = [await findOrMakeRole("Verified", member.guild)]; // Verified

  if (!override) {
    const teaminfo = (await vexdb.get("teams", { team }))[0];
    if (roleString !== "ALUMNI") {
      // Program
      if (teaminfo.program == "VEXU") {
        roles.push(await findOrMakeRole("VEXU", member.guild)); // VEXU
      } else if (teaminfo.grade == "Middle School") {
        roles.push(await findOrMakeRole("Middle School", member.guild)); // Middle School
      } else {
        roles.push(await findOrMakeRole("High School", member.guild)); // High School
      }
    }

    // Team Roles (VTOSC specific)
    if (member.guild.id === "310820885240217600" && server["team-roles"]) {
      if (teaminfo.region === "South Carolina") {
        const teamRole = await findOrMakeRole(team.toUpperCase(), member.guild);
        roles.push(teamRole); // Team Role
      } else {
        roles.push(await findOrMakeRole("Not SC Team", member.guild)); // Not SC Team
      }

      // General Team Roles (other servers if enabled)
    } else if (server["team-roles"]) {
      const teamRole = await findOrMakeRole(team.toUpperCase(), member.guild);
      roles.push(teamRole);
    }
  }

  // Additional roles for Alum/Mentor
  switch (roleString) {
    case "MEMBER":
      break;
    case "ALUMNI":
      roles.push(await findOrMakeRole("Alumni", member.guild));
      break;
    case "MENTOR":
      roles.push(await findOrMakeRole("Mentor", member.guild));
      break;
  }

  const approved = await approve(member, name, team, teams, roles);
  if (approved) {
    dm.send("Your verification has been approved!");
    member.setNickname(`${name} | ${team}`);
    member.roles.add(roles);
  } else {
    // Make a new invite for them to join back
    const invite = await member.guild.channels.cache
      .sort((a, b) => b.calculatedPosition - a.calculatedPosition)
      .first()
      ?.createInvite({
        reason: `Invite for ${name} | ${team} (${member.user.username}#${member.user.discriminator})`,
        maxUses: 1,
        maxAge: 300,
        temporary: true,
      });

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
