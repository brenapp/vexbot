import Command, { Permissions } from "../lib/command";
import { GuildMember, Message, Guild } from "discord.js";
import { client } from "../client";



export class VoiceTrackCommand extends Command("voicetrack") {
    check = Permissions.compose(
        Permissions.guild,
        Permissions.any(
            Permissions.admin,
            () => !this.tracking,
            message => message.member.id === (this.invoker ? this.invoker.id : "")
        )
    );

    fail(message: Message) {
        message.channel.send("lol u thought")
    }

    documentation() {
        return {
            usage: "voicetrack",
            description: "Tracks speakers in a voice channel",
            group: "Meta",
            hidden: true
        }
    }


    tracking = false;
    trackStart: number;
    invoker: GuildMember;
    handler: (old: GuildMember, current: GuildMember) => void;

    exec(message: Message) {


        if (this.tracking) {
            message.channel.send(`Done! Tracked for ${(Date.now() - this.trackStart) / 1000}s`)
        } else {
            client.on("voiceStateUpdate", this.handler = (old, current) => {

            });
            message.channel.send("Tracking...");
            this.trackStart = Date.now();
        };

        // Invert
        this.tracking = !this.tracking;

    };


}


export default new VoiceTrackCommand();