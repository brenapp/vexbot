import {
    Guild,
    User,
    TextChannel,
    GuildMember,
    Message,
    PartialMessage,
    GuildAuditLogsEntry,
    MessageEmbed,
    GuildAuditLogs
} from "discord.js";
import { makeEmbed } from "../lib/util";
import { client } from "../client";
import { debug } from "../commands/debug";

async function handleBanAdd (
    guild:Guild,
    user:User
):Promise<Message | boolean>{

    const eventLog = guild.channels.cache.find(
        channel => channel.name === "event-log"
    ) as TextChannel;
    if(!eventLog) return false;

    /*
    const entry:GuildAuditLogsEntry = await guild
        .fetchAuditLogs({type: "MEMBER_BAN_ADD"})
        .then((logs) => logs.entries.first());

    let executor = entry.executor;
    if(!entry || executor.bot) return false;
    */

    const logs:GuildAuditLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_BAN_ADD'
    });

    const ban = logs.entries.first();

    let timestamp:Date = new Date();

    const embed:MessageEmbed = makeEmbed()
        .setColor("#D22630")
        .setTitle("NEW BAN ADDED")
        .setImage(user.avatarURL() as string)
        .addFields(
            {name: "User ID", value: user.id},
            {name: "User Name", value: user.username, inline: true},
            {name: "Discriminator", value: user.discriminator, inline: true},
            {name: "Timestamp", value: timestamp.toLocaleTimeString()},
            {
                name: "Executor",
                value: `${
                    ban!.executor!.username}#${
                    ban!.executor!.discriminator}`
            }
        )
    
    return eventLog.send({embeds: [embed]});
}

async function handleBanRemove(
    guild:Guild,
    user:User
):Promise<Message | boolean>{

    const eventLog = guild.channels.cache.find(
        channel => channel.name === "event-log"
    ) as TextChannel;
    if(!eventLog) return false;

    const logs:GuildAuditLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: 'MEMBER_BAN_REMOVE'
    });

    const ban = logs.entries.first();

    let timestamp:Date = new Date();

    const embed:MessageEmbed = makeEmbed()
        .setColor("#00B2A9")
        .setTitle("BAN REMOVED")
        .setImage(user.avatarURL() as string)
        .addFields(
            {name: "User ID", value: user.id},
            {name: "User Name", value: user.username, inline: true},
            {name: "Discriminator", value: user.discriminator, inline: true},
            {name: "Timestamp", value: timestamp.toLocaleTimeString()},
            {
                name: "Executor",
                value: `${
                    ban!.executor!.username}#${
                    ban!.executor!.discriminator}`}
        );

    return eventLog.send({ embeds: [embed]});
}