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
        let verification = {}
        channel.send("Welcome to VEX Teams of South Carolina!");
        channel.send("In order to participate, you'll need to verify some basic information with us.");
        question("What should we call you? *(First Name, Nickname, etc.)*", channel)
        .then(name => verification.name).then(() => 
    question("What team are you *primarily a part of?"))
        .then(team => verification.team = team).then(() =>
    choose("On your team, what role do you serve? *(Member, Alumni, Mentor)*"), [
        ["MEMBER", "COMPETITOR", "TEAM MEMBER"],
        ["ALUMNI", "GRADUATED", "ALUMNUS", "ALUM"],
        ["MENTOR", "COACH", "ADVISOR"]
    ]).then(role => verification.role)
      .then(async () => {
        member.setNickname(`${verification.name} | ${verification.team}`, "Verification: Nickname")
        
        let team = await vexdb.get("teams", { team: verification.team });
    
        // Add roles
        let roles = ["310902227160137730"]; // Competitors (aka Verified)
    
        // Program
        if (team.program == "VEXU") {
            roles.push("377219725442154526"); // VEXU
        } else if (team.grade == "Middle School") {
            roles.push("376489822598201347"); // Middle School
        } else {
            roles.push("376489878700949515"); // High School
        }
    
        // Team
        if (team.region === "South Carolina") {
            roles.push(await findOrMakeRole(verification.team, member.guild)); // Team Role
        } else {
            roles.push("387074517408808970"); // Not SC Team
        }
    
        // Role on Team
        switch(verification.role) {
            case "MEMBER": break;
            case "ALUMNI": roles.push("329760448020873229"); break;
            case "MENTOR": roles.push("329760518334054402"); breal
        }
    
        member.addRoles(roles, "Verification: Roles")
    
        channel.send("You're all set up! Note that you can change your nickname at any time, but please keep it in the correct format")
        
        const welcome = member.guild.channels.find("name", "general");
        if (!welcome) return;
        welcome.send(`Welcome ${member}!`);
      }).catch(error => console.error(error));
    });
} 

// Simulate server joining, so I don't have to repeat the process 10 billion times
addMessageHandler(
    message => message.content.startsWith("!join") &&
        onServerJoin(message.member)
)



module.exports = onServerJoin;