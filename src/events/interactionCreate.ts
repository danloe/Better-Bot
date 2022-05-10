import { Command, Event } from '../interfaces';
import BetterClient from '../client';

export const event: Event = {
    name: 'interactionCreate',
    run: async (client: BetterClient, interaction: any) => {
        console.log(
            `${interaction.user.tag} triggered an interaction.${
                interaction.isCommand() ? ` [${interaction.commandName}]` : ''
            }`
        );

        // COMMAND
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await (command as Command).run(client, interaction);
            } catch (error) {
                console.error(error);
            }
        }

        // BUTTON
        else if (interaction.isButton()) {
            try {
                // TODO
            } catch (error) {
                console.error(error);
            }
        }

        // SELECT MENU
        else if (interaction.isSelectMenu()) {
            try {
                // TODO
            } catch (error) {
                console.error(error);
            }
        } else {
            return;
        }
    }
};
