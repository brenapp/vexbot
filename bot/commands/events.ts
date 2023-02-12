/**
 * Creates discord events for every event in the region
 **/

import Command, { Permissions } from "~lib/command";
import * as robotevents from "robotevents";

const EventsCommand = Command({
  names: ["create_events"],
  documentation: {
    description: "Creates discord events for every event in the region",
    options: (builder) =>
      builder.addStringOption((option) =>
        option
          .setName("region")
          .setDescription("The region to create events for")
          .setRequired(true)
      ),
  },
  check: Permissions.admin,

  async exec(interaction) {
    const region = interaction.options.get("region", true).value as string;
  },
});
