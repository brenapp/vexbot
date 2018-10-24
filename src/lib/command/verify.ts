/**
 * Manually verify a person
 */
import verify from "../verify";
import { addCommand } from "../message";
import { probate, parseTime } from "./probate";

addCommand("verify", async (args, message) => {
  let admin = message.guild.roles.find("name", "Admins"),
    author = message.member;
  // First, test if the user has the permission for this command
  if (admin && author.roles.has(admin.id)) {
    let users = message.mentions.members;
    console.log("Verify", users);
    users.forEach(user => verify(user));
    return true;
  } else {
    message.reply("You're not permitted to do that!");
    probate(
      message.member,
      parseTime("30s"),
      message.guild.me,
      "Unauthorized use of !verify"
    );
  }
});
