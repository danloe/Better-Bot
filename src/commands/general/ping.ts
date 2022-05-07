import { Command } from "../../interfaces";
import { CommandInteraction, Message } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { createEmbed } from "../../helpers";
// const wait = require('node:timers/promises').setTimeout;

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Returns the ping. pong."),
  run: async (
    interaction?: CommandInteraction,
    message?: Message,
    args?: string[]
  ) => {
    if (interaction) {
      interaction!.reply(createEmbed("🏓", `${interaction.client.ws.ping}ms`));
    }

    if (message) {
      message!.reply(createEmbed("🏓", `${message!.client.ws.ping}ms`));
    }
  },
};
