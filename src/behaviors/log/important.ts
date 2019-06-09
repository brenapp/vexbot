import { client } from "../../client";
import { Guild, TextChannel, Collection, Role } from "discord.js";

// Notify #event-log about important events
function serverlog(guild: Guild): TextChannel {
  return guild.channels.find(
    channel => channel.name === "event-log" && channel.type === "text"
  ) as TextChannel;
}

function changedRoles(
  old: Collection<string, Role>,
  current: Collection<string, Role>
): { added: Collection<string, Role>; removed: Collection<string, Role> } {
  const added = current.filter(role => !old.has(role.id));
  const removed = old.filter(role => !current.has(role.id));

  return { added, removed };
}

// Administrative
client.on("guildBanAdd", (guild, user) => {
  const log = serverlog(guild);

  log.send(`:banhammer: ${user} was banned!`);
});

client.on("guildBanRemove", (guild, user) => {
  const log = serverlog(guild);

  log.send(`:banhammer: ${user} was unbanned!`);
});

client.on("guildMemberRemove", (guild, user) => {
  const log = serverlog(guild);

  log.send(`:banhammer: ${user} left or was kicked`);
});

// User changes/actions
client.on("guildMemberUpdate", (old, current) => {
  const log = serverlog(old.guild);

  if (old.nickname !== current.nickname) {
    log.send(
      `:exclamation:  ${old} changed nickname. ${old.nickname} => ${
        current.nickname
      }`
    );
  }

  const { added, removed } = changedRoles(old.roles, current.roles);
  if (added.size > 0 || removed.size > 0) {
    log.send(
      `:exclamation: ${current} changed roles. New roles: ${added
        .map(role => `${role}`)
        .join(", ")}; Removed roles: ${removed
        .map(role => `${role}`)
        .join(", ")}`
    );
  }
});
