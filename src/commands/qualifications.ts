import Command, { Permissions } from "../lib/command";
import { Message } from "discord.js";
import * as vexdb from 'vexdb';
import cheerio from "cheerio";
import tableparse from "cheerio-tableparser"

import { html } from "./event"
import { AwardsResponseObject } from "vexdb/out/constants/ResponseObjects";

/**
 * State qualification leaderboard
 */

class QualificationsCommand extends Command("quals") {
    check = Permissions.all;

    documentation() {
        return {
            usage: "quals [region]",
            description: "Posts the state qualification leaderboard (region defaults to South Carolina)",
            group: "VEX"
        };
    }

    async exec(message: Message, [region]: string[]) {

        if (!region) {
            region = "South Carolina"
        }

        const events = await vexdb.get("events", { region, season: "current", status: "past" });


        // Execute the following code in parallel to improve response time
        const [awards, skills, quals] = await Promise.all([

            // Get awards from each event
            Promise.all(events.map(event => vexdb.get("awards", { sku: event.sku }))).then(a => a.reduce((a, b) => a.concat(b), [])),

            // Get skills
            Promise.all(events.map(event => vexdb.get("skills", { sku: event.sku, type: 2 }))).then(a => a.reduce((a, b) => a.concat(b), [])),


            // Get what qualifies at each event
            Promise.all(events.map(({ sku }) =>
                html(`https://www.robotevents.com/robot-competitions/vex-robotics-competition/${sku}.html`)
                    .then(page => cheerio.load(page))
                    .then($ => (tableparse($), $))
                    .then(($: any) => $("#tab-awards .panel:last-child .panel-body table").parsetable(true, true, true))
                    .then(quals => (quals[0].filter((v, i) => i > 0 && quals[1][i].includes("State/Regional"))))
            ))
        ]);

        console.log(awards, skills, quals);





    }


}



export default new QualificationsCommand();