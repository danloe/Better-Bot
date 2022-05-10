import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { createEmbed, createErrorEmbed } from '../../helpers';
import BetterClient from '../../client';

export const command: Command = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Returns the ping. pong.'),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                await interaction
                    .reply(createEmbed('🏓', `${client.ws.ping}ms`))
                    .then(done)
                    .catch(async (err) => {
                        await interaction.editReply(createErrorEmbed('🚩 Error sending ping request: `' + err + '`'));
                        error(err);
                    });
            }

            if (message) {
                await message.reply(createEmbed('🏓', `${client.ws.ping}ms`));
            }
        });
    }
};
