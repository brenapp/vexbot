/**
 * @author Brendan McGuire
 * @date 16 December 2021
 * 
 * Gets information about a specific team
 */

import { SlashCommandBuilder } from "@discordjs/builders";
import Command from "../lib/command";
import { programs, teams, seasons, events } from "robotevents";
import { ProgramAbbr } from "robotevents/out/endpoints/programs";
import { CommandInteraction, Message, MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";
import { Team } from "robotevents/out/endpoints/teams";

async function profile(interaction: CommandInteraction, team: Team) {
    await interaction.deferReply();

    const embed = new MessageEmbed()
        .setTitle(`${team.number} ${team.team_name}`);

    const attendance = await events.search({
        team: [team.id],
        season: [seasons.current(team.program.code)] as number[],
    });
    const rankings = await team.rankings({
        season: [seasons.current(team.program.code)] as number[],
    }).then(r => r.array());
    
    const record = {
        wins: 0,
        losses: 0,
        ties: 0
    };

    for (const event of attendance) {
        const start = new Date(event.start);
        if (start > new Date()) {
            embed.addField(
                event.name,
                `${start.toLocaleDateString()}`
            );
            continue;
        };

        let body = "";

        const ranking = rankings.find(r => r.event.id === event.id);
        if (ranking) {
            body += `Rank: #${ranking.rank} (${ranking.wins}-${ranking.losses}-${ranking.ties})\n`;
        };

        console.log(body);
        embed.addField(
            event.name,
            body
        );
    };

    embed.setDescription(`${team.organization}\n${team.location.city}, ${team.location.region}, ${team.location.country}\nSeason Record: ${record.wins}-${record.losses}-${record.ties}`);

    return interaction.editReply({ embeds: [embed] });
};

export const TeamCommand = Command({
    names: ["team"],
    documentation: {
        description: "Gets information about a specific team",
        group: "VEX",
        usage: "team <team number>"
    },

    check: () => true,

    async json() {

        const list: [string, string][] = await programs.all().then(list => list.map(program => [program.name, program.abbr]));

        const command = new SlashCommandBuilder()
            .setName("team")
            .setDescription("Gets information about a specific team")
            .setDefaultPermission(true)
            .addStringOption(option => option
                .setName("number")
                .setRequired(true)
                .setDescription("The team number to get information about."))
            .addStringOption(option => option
                .setName("program")
                .setRequired(false)
                .setDescription(list.map(item => item[0]).join(", "))
                .addChoices(list))

        return command.toJSON();
    },

    async exec(interaction) {
        const number = [interaction.options.getString("number", true)];
        const platform = interaction.options.getString("program", false) as ProgramAbbr | null;
        const program = platform ? [programs.get(platform)] : [];

        const results = await teams.search({ number, program })

        if (results.length < 1) {
            return interaction.reply({ content: `There is no such team!`, ephemeral: false });
        } else if (results.length > 1) {
            const row = new MessageActionRow()
                .addComponents(
                    new MessageSelectMenu()
                        .setCustomId("teamID")
                        .addOptions(results.map(team => ({
                            label: team.team_name,
                            description: `${team.number} - ${team.program.name}`,
                            value: team.id.toString()
                        })))
                )

            await interaction.reply({ content: "Multiple teams found. Please select one.", ephemeral: false, components: [row] });
            const message = await interaction.fetchReply() as Message;

            try {
                const result = await message.awaitMessageComponent({
                    filter: i => {
                        i.deferUpdate();
                        return i.user.id === interaction.user.id;
                    },
                    componentType: "SELECT_MENU",
                    time: 60000
                });

                const id = parseInt(result.values[0]);
                const team = await teams.get(id) as Team;
                return profile(interaction, team).catch(console.error);

            } catch (e) {
                console.log(e);
                return interaction.followUp({ content: "Timed out." });
            }
        }

        const team = results[0];
        return profile(interaction, team).catch(console.error);
    },
});