import { Command } from "../../interfaces";
import { CommandInteraction, Message } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
// const wait = require('node:timers/promises').setTimeout;

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Returns the ping. pong."),
  aliases: ["pong"],
  run: async (
    interaction?: CommandInteraction,
    message?: Message,
    args?: string[]
  ) => {
    if (interaction) {
      interaction!.reply(`${interaction.client.ws.ping}ms ping. 🏓`);
    }

    if (message) {
      message!.reply(`${message!.client.ws.ping}ms ping. 🏓`);
    }
  },
};
