import Command, { Permissions } from "../lib/command";
import { Message, TextChannel } from "discord.js";

/**
 * Locks a specific channel
 */

export class LockCommand extends Command("lock") {

    check = Permissions.admin;

    exec(message: Message) {
        const channel = message.channel as TextChannel;


        channel.overwritePermissions(channel.guild.defaultRole, { SEND_MESSAGES: false });

        return message.channel.send("Channel locked");

    }

}

new LockCommand();

export class UnlockCommand extends Command("unlock") {

    check = Permissions.admin;

    exec(message: Message) {
        const channel = message.channel as TextChannel;


        channel.overwritePermissions(channel.guild.defaultRole, { SEND_MESSAGES: null });

        return message.channel.send("Channel locked");

    }

}

new UnlockCommand();