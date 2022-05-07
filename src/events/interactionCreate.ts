import { Command, Event } from '../interfaces';
import Client from '../client';
import { CommandInteraction, Interaction } from 'discord.js';

export const event: Event = {
    name: 'interactionCreate',
    run: async (client: Client, interaction: any) => {
        console.log(
            `${interaction.user.tag} triggered an interaction.${
                interaction.isCommand() ? ` [${interaction.commandName}]` : ''
            }`
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
                    content: 'There was an error while executing this command!',
                    ephemeral: true
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
                    content: 'There was an error while executing this command!',
                    ephemeral: true
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
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            }
        } else {
            return;
        }
    }
};
