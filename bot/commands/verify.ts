import { TextChannel } from "discord.js";
import { client } from "main";
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
              { name: "Mentor", value: "Mentor" }
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
  check: Permissions.admin,

  async exec(interaction) {
    const user = interaction.user;
    const name = interaction.options.getString("name", true);
    const team = interaction.options.getString("team", true);
    const role = interaction.options.getString("role", true);
    const pronouns = interaction.options.getString("pronouns", true);

    console.log({
      user,
      name,
      team,
      role,
      pronouns,
    });
  },
});

export default VerifyCommand;
