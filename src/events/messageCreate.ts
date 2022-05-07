import { Command, Event } from "../interfaces";
import Client from "../client";
import { Message } from "discord.js";

export const event: Event = {
  name: "messageCreate",
  run: async (client: Client, message: Message) => {
    if (message.author.bot || !message.content.startsWith(client.config.prefix))
      return;

    const args = message.content
      .slice(client.config.prefix.length)
      .trim()
      .split(/ +/g);

    const cmd = args.shift()?.toLowerCase();
    if (!cmd) return;

    const command = client.commands.get(cmd) || client.aliases.get(cmd);
    if (command) {
      console.log(
        `${message.author.username} triggered an interaction. [${command.data.name}]`
      );
      (command as Command).run(undefined, message, args);
    }
  },
};
