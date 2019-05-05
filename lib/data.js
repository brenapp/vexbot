/**
 * Utilities to help with the collection of data. Uses vexdb and robotevents
 */

const vexdb = require("vexdb");
const EventEmitter = require("events");


vexdb.configure({
    "headers": {
        "User-Agent": "vexbot#0599 (artificalchamber@gmail.com)"
    },
    "defaultParams": {
        "season": "current"
    }
});


// Disable the cache, because the only regular requests are size requests, which need quick updates
vexdb.cache.setTTL(0);


/**
 * Returns all events running currently
 * @return Promise<Events>
 */
function getCurrentEvents() {
    return vexdb.get("events", { date: new Date().toISOString() });
}


// Key: Function to test if the object is a type, return: a function to generate a unique ID
const idMap = new Map([
    [a => a.key === a.sku,
        event => event.sku],
    [a => a.hasOwnProperty("is_registered"),
        team => team.number],
    [a => a.red1 != a.red2, match =>
        `${match.sku}<${match.divison}>${[match.round, match.instance, match.matchnum].join(".")}:<${match.redscore}, ${match.bluescore}>`],
    [a => a.hasOwnProperty("wins"),
        rank => `${rank.sku}<${rank.divison}>${rank.team}:${rank.rank}`],
    [a => a.hasOwnProperty("type"),
        skills => `${skills.sku}<${skills.divison}>${skills.team}.${skills.type}:<${skills.score, skills.rank}>`
    ]
    // Does not include season rankings (cause no one uses them), or awards (cause VexDB doesn't update awards, I'll need to make a seperate mechanism)
]);

/**
 * @returns {Object} {
 *  batch: The current batch, used to check for duplicates
 *  step(list): Compares the current list against the old batch, returns new (and updates batch),
 *  same(compare, batchItem): Tests to see if two items are the same, using VexDB heuristics
 * }
 */
function duplicateManager(inital) {
    let batch = inital;
    return {
        batch,
        step(list) {
            let newItems = list.filter(i => batch.every( l => !this.same(i, l) ));
            batch = list;
            return newItems;
        },
        same(a, b) {
            for (let instance of idMap) {
                let [test, id] = instance;
                if (test(a)) return id(a) === id(b);
            }
        }
    }

}


/**
 * Watches an event, and emits for various updates. Emit the "stop" event to stop watching (can emit stop.<subcomponent> stop watching individual actions)
 * @param {String} sku The SKU of the event to watch
 * @param {Object} watch What to watch
 * @param {Boolean} watch.matches Emit on "match" when a new match is uploaded into the system
 * @param {Boolean} watch.roster Emit on "rosterUpdate" when the team list changes
 * @param {Boolean} watch.skills Emit on "skills" when a new skills score is updated
 */
function watchEvent(sku, { matches, roster, skills }) {

    const emitter = new EventEmitter();
    meta = {
        match: {},
        roster: {},
        skills: {}
    }; // Holds intermediate and meta data

    // Async setup, so we can return immediately 
    setTimeout(async () => {

        if (matches) {
            meta.match = {
                size: -1,
                loop: 0,
                list: duplicateManager(await vexdb.get("matches", { sku, "scored": 1 }))
            }
        }

        // Matches
        meta.match.loop = setInterval(async () => {
            size = await vexdb.size("matches", { sku, "scored": 1 });
            if (meta.match.size > 0) { // Skip the first size evaluation
                if (size != meta.match.size) {
                    meta.match.list.step(await vexdb.get("matches", { sku, "scored": 1 }))
                    .forEach(match => {
                        emitter.emit("match", match);
                    });
                }
            }
            meta.match.size = size;
        }, 1000 * 5);

    }, 1);


    // Stops
    emitter.on("stop.maches", () => clearInterval(meta.match.loop));
    emitter.on("stop.roster", () => clearInterval(meta.roster.loop));
    emitter.on("stop.skills", () => clearInterval(meta.skills.loop));

    emitter.on("stop", () => {
        emitter.emit("stop.matches");
        emitter.emit("stop.roster");
        emitter.emit("stop.skills");
    });


    return emitter;
}


module.exports = {
    getCurrentEvents,
    watchEvent
};

