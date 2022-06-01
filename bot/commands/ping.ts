import Command, { Permissions } from "../lib/command";

const PingCommand = Command({
  names: ["ping"],
  documentation: {
    description: "Pong!",
  },
  check: Permissions.all,

  async exec(interaction) {
    interaction.reply("Pong!");
  },
});

export default PingCommand;
