/**
 * Verification Pipeline
 */

const { question, choose, questionValidate } = require("./prompt");
const { addMessageHandler } = require("./message");
const vexdb = require("vexdb");

function findOrMakeRole(name, guild) {
    let role = guild.roles.find("name", name);
    return role ? Promise.resolve(role) : guild.createRole({ name, mentionable: true })
}

function onServerJoin(member) {
    // Verification Prompt
    member.createDM().then(channel => {
        let verification = {
            name: "",
            program: "",
        }
        channel.send("Welcome to VEX Teams of South Carolina!");
        channel.send("In order to participate, you'll need to verify some basic information with us.");
        question("What should we call you? *(First Name, Nickname, etc.)*", channel)
            .then(name => verification.name = name)
            .then(() => choose(
                "What program are you primarily a part of? *(Middle School, High School, VEXU)*",
                [["MS", "MIDDLE SCHOOL"], ["HS", "HIGH SCHOOL"], ["VEXU", "COLLEGE", "UNI", "UNIVERSITY"]],
                channel))
            .then(program => verification.program = program)
            .then(() => questionValidate(
                "What team are you apart of? *(Team Number)*",
                team => verification.program == "VEXU" ?
                    /^[A-Z]+[0-9]*$/g.test(team) && team :
                    /[0-9]{1,5}[A-Z]/g.test(team) && team,
                "That doesn't look like a correct team number.",
                channel)) 
            .then(async number => {
                member.setNickname(`${verification.name} | ${number}`, "Verification: Nickname")

                // Add roles
                let roles = ["310902227160137730"]; // Competitors (aka Verified)
                switch (verification.program) { // Add program roles
                    case "MS": roles.push("376489822598201347"); break;
                    case "HS": roles.push("376489878700949515"); break;
                    case "VEXU": roles.push("377219725442154526"); break;
                }
                if ((await vexdb.get("teams", { team: number })).region === "South Carolina") {
                    roles.push(await findOrMakeRole(number, member.guild))
                } else {
                    roles.push("387074517408808970"); // Not SC Team
                }
                member.addRoles(roles, "Verification: Roles")

                channel.send("You're all set up! Note that you can change your nickname at any time, but please keep it in the correct format")
                
                const welcome = member.guild.channels.find("name", "general");
                if (!welcome) return;
                welcome.send(`Welcome ${member}!`);
            })
            .catch(console.error)
    });
} 

// Simulate server joining, so I don't have to repeat the process 10 billion times
addMessageHandler(
    message => message.content.startsWith("!join") &&
        onServerJoin(message.member)
)



module.exports = onServerJoin;