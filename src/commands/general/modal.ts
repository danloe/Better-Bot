import { Command } from "../../interfaces";
import { CommandInteraction, Message } from "discord.js";
import { Modal, TextInputComponent, showModal } from "discord-modals";
import { SlashCommandBuilder } from "@discordjs/builders";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("modal")
    .setDescription("Opens a modal form."),
  run: async (
    interaction?: CommandInteraction,
    message?: Message,
    args?: string[]
  ) => {
    if (!interaction) return;

    const modal = new Modal()
      .setCustomId("modal-customid")
      .setTitle("Play music.")
      .addComponents(
        new TextInputComponent()
          .setCustomId("textinput-customid1")
          .setLabel("YouTube 🔗/🔎  |  SoundCloud/Newgrounds 🔗")
          .setStyle("SHORT")
          .setPlaceholder("URL or Search Keywords...")
          .setRequired(true)
      );

    showModal(modal, {
      client: interaction.client,
      interaction: interaction,
    });
  },
};
