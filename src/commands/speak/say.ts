import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createErrorEmbed } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('say').setDescription('Says what you want.'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                interaction!
                    .reply(`${interaction.client.ws.ping}ms ping. 🏓`)
                    .then(done)
                    .catch(async (err) => {
                        await interaction.editReply(createErrorEmbed('🚩 Error clearing queue: `' + err + '`'));
                        error(err);
                    });
            }

            if (message) {
                message!.channel.send(`${message!.client.ws.ping}ms ping. 🏓`);
            }
        });
    }
};
