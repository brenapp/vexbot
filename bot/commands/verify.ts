import { ActionRowBuilder, EmbedBuilder } from "@discordjs/builders";
import {
  ButtonBuilder,
  ButtonStyle,
  CreateRoleOptions,
  MessageComponentInteraction,
  TextChannel,
} from "discord.js";
import * as robotevents from "robotevents";
import Command, { Permissions } from "~lib/command";

const VerifyCommand = Command({
  names: ["verify"],
  documentation: {
    description: "Verify a specific user",
    options: (builder) =>
      builder
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("The name we should call you (ex. Brendan)")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("team")
            .setDescription(
              "The number of the VRC or VEXU team you are primarily affiliated with (ex. 3796B)"
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("role")
            .setDescription(
              "The role you currently serve on this team (ex. Mentor)"
            )
            .setChoices(
              { name: "Member", value: "MEMBER" },
              { name: "Alumnus", value: "ALUM" },
              { name: "Mentor", value: "MENTOR" }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("pronouns")
            .setDescription(
              "If you would like to notate your pronouns, you can do so here"
            )
            .setChoices(
              { name: "he/him", value: "he/him" },
              { name: "she/her", value: "she/her" },
              { name: "they/them", value: "they/them" }
            )
            .setRequired(false)
        ),
  },
  check: Permissions.always,

  async exec(interaction) {
    const user = interaction.user;
    const name = interaction.options.get("name", true).value as string;
    const number = interaction.options.get("team", true).value as string;
    const role = interaction.options.get("role", true).value as
      | "MEMBER"
      | "ALUM"
      | "MENTOR";
    const pronouns = interaction.options.get("pronouns", false)?.value as
      | string
      | undefined;

    async function findOrCreateRole(name: string, options?: CreateRoleOptions) {
      const role = interaction.guild!.roles.cache.find(
        (role) => role.name === name
      );

      if (role) {
        return role;
      }

      return await interaction.guild!.roles.create({
        name,
        ...options,
      });
    }

    const team = await robotevents.teams.get(number);

    if (!team) {
      await interaction.reply({
        content: `Sorry, I couldn't find a team with the number \`${number}.\``,
        ephemeral: true,
      });
      return;
    }

    const localTeam = team.location.region === "South Carolina";
    const roleNotation = {
      MEMBER: "",
      ALUM: "Alum",
      MENTOR: "Mentor",
    };
    const nickname = `${name} | ${team.number} ${roleNotation[role]}`.trim();
    const member = await interaction.guild!.members.fetch(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`Verification for ${nickname}`)
      .setDescription(
        `Welcome to the server, ${name}! A moderator will verify your information shortly. This verification request will expire in 24 hours.`
      )
      .addFields(
        { name: "Team", value: number },
        { name: "Position", value: role },
        { name: "Pronouns", value: pronouns ?? "Not Specified" }
      );

    const teamRole = localTeam
      ? await findOrCreateRole(team.location.region)
      : await findOrCreateRole(team.location.region, { mentionable: true });
    const gradeRole = await findOrCreateRole(team.grade);
    const verified = await findOrCreateRole("Verified");
    const pronounRole = pronouns ? await findOrCreateRole(pronouns) : undefined;

    const approve = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("verify-approve")
        .setLabel("Moderator: Approve")
        .setStyle(ButtonStyle.Success)
    );

    const filter = (i: MessageComponentInteraction) =>
      i.customId === "verify-approve" &&
      (i.memberPermissions?.has("ManageRoles") ?? false);

    const collector = interaction.channel!.createMessageComponentCollector({
      filter,
      time: 1000 * 60 * 60 * 24,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      try {
        await member.setNickname(nickname);
        await member.roles.add([verified, teamRole, gradeRole]);
        if (pronounRole) await member.roles.add(pronounRole);
        await i.editReply({
          content: `Successfully verified ${member}!`,
          components: [],
        });
      } catch (e) {
        console.log(e);
        await i.editReply({
          content: `Failed to verify ${member}:\n \`\`\`${e}\`\`\``,
          components: [],
        });
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: `Verification for ${member} has expired.`,
          components: [],
        });
      }
    });

    await interaction.reply({
      embeds: [embed],
      components: [approve],
    });
  },
});

export default VerifyCommand;
