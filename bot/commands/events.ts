/**
 * Creates discord events for every event in the region
 **/

import Command, { Permissions } from "~lib/command";
import * as robotevents from "robotevents";
import {
  ButtonStyle,
  EmbedBuilder,
  GuildScheduledEvent,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel,
  MessageComponentInteraction,
} from "discord.js";
import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import { client } from "main";

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

    await interaction.deferReply({ ephemeral: true });

    const season = robotevents.seasons.current("VRC")!;

    const events = await robotevents.events.search({
      season: [season],
      region,
    });

    const embed = new EmbedBuilder();
    embed.setTitle("Events");
    let description = "";
    for (const event of events) {
      description += `**${event.name}** - ${new Date(
        event.start
      ).toLocaleDateString()}\n`;
      description += `${event.location.city},${event.location.region},${event.location.country}\n`;
    }
    embed.setDescription(description);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm")
        .setLabel("Create Events")
        .setStyle(ButtonStyle.Success)
    );

    const reply = await interaction.editReply({
      embeds: [embed.data],
      components: [row],
    });

    const filter = (i: MessageComponentInteraction) =>
      i.customId === "confirm" &&
      (i.memberPermissions?.has("ManageRoles") ?? false);

    const collector = reply.channel.createMessageComponentCollector({
      filter,
      time: 1000 * 60 * 60 * 24,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      try {
        const discordEvents = interaction.guild?.scheduledEvents!;

        await discordEvents.fetch();
        let scheduledEvents: GuildScheduledEvent[] = [];

        for (const event of events) {
          const start = new Date(event.start).setHours(8);
          const end = new Date(event.end).setHours(18);

          if (discordEvents.cache.some((e) => e.name === event.name)) {
            await i.followUp({
              content: `Event ${event.name} already exists`,
              ephemeral: true,
            });
            continue;
          }

          const scheduledEvent = await discordEvents.create({
            name: event.name,
            scheduledStartTime: start,
            scheduledEndTime: end,
            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
            entityType: GuildScheduledEventEntityType.External,
            description: `${event.getURL()}`,
            reason: "Created by bot",
            entityMetadata: {
              location: `${event.location.venue}`,
            },
          });

          await i.followUp({
            content: `Created event ${scheduledEvent} for ${event.name}`,
            ephemeral: true,
          });
        }
      } catch (e) {
        console.log(e);
        await i.editReply({
          content: `Failed to create events:\n \`\`\`${e}\`\`\``,
          components: [],
        });
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await interaction.editReply({
          content: `Create events request has expired.`,
          components: [],
        });
      }
    });
  },
});

export default EventsCommand;
