/**
 * Helps to control channels during specific events
 * (enable slowmode, disable write permissions, etc.)
 */


import Command, { Permissions, makeEmbed } from "../lib/command";
import { Message, TextChannel } from "discord.js";

export class PauseCommand extends Command("pause") {
    check = Permissions.compose(Permissions.admin, Permissions.guild);


    async exec(message: Message) {
        const channel = message.channel as TextChannel;

    }


}

new PauseCommand();

export class HideCommand extends Command("hide") {
    check = Permissions.compose(Permissions.admin, Permissions.guild);


    async exec(message: Message) {
        const channel = message.channel as TextChannel;

        return channel.overwritePermissions(channel.guild.defaultRole, { VIEW_CHANNEL: false }, "Hide channel")
    }


}


new HideCommand();