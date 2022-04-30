import { Command, Event } from "../interfaces";
import Client from "../client";
import { Interaction } from "discord.js";

export const event: Event = {
  name: "interactionCreate",
  run: async (client: Client, interaction: Interaction) => {
    console.log(
      `${interaction.user.tag} in #${
        (interaction.channel! as any).name
      } triggered an interaction.`
    );

    // COMMAND
    if (interaction.isCommand()) {
      const command =
        client.commands.get(interaction.commandName) ||
        client.aliases.get(interaction.commandName);
      if (!command) return;

      try {
        (command as Command).run(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }

    // BUTTON
    else if (interaction.isButton()) {
      try {
        // TODO
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }

    // SELECT MENU
    else if (interaction.isSelectMenu()) {
      try {
        // TODO
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    } else {
      return;
    }
  },
};
