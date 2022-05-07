import { Command } from "../../interfaces";
import { CommandInteraction, Message } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { readFile, readFileSync } from "fs";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("You need a hand?"),
  run: async (
    interaction?: CommandInteraction,
    message?: Message,
    args?: string[]
  ) => {
    const helptext = readFileSync("./helptext.txt");

    if (interaction) {
      interaction!.reply({
        content: `${interaction.user.username}\n ${helptext}`,
        ephemeral: true,
      });
    }

    if (message) {
      message!.reply(`${message.author}\n ${helptext}`);
    }
  },
};
