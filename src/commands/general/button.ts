import { Command } from "../../interfaces";
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
// const wait = require('node:timers/promises').setTimeout;

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("button")
    .setDescription("Responds with a button."),
  run: async (
    interaction?: CommandInteraction,
    message?: Message,
    args?: string[]
  ) => {
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("ping_button")
        .setLabel("Ping! 🏓")
        .setStyle("PRIMARY")
    );

    if (interaction) {
      await interaction.reply({ content: " ", components: [row] });
      
      const collector = interaction.channel!.createMessageComponentCollector();
      collector.on("collect", async (ButtonInteraction) => {
        ButtonInteraction.reply(`${interaction.client.ws.ping}ms ping. 🏓`);
      })
    }

    if (message) {
      await message.reply({ content: " ", components: [row] });
            
      const collector = message.channel!.createMessageComponentCollector();
      collector.on("collect", async (ButtonInteraction) => {
        ButtonInteraction.reply(`${message.client.ws.ping}ms ping. 🏓`);
      })
    }

  },
};
