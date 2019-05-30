import { addCommand } from "../lib/message";
import verify from "../behaviors/verify";

addCommand("verify", (args, message) => {
  message.mentions.members.forEach(member => verify(member));
  return true;
});
