import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Says everything you want [ENGLISH].')
        .addStringOption((option) =>
            option.setName('input').setDescription('The text to be spoken.').setRequired(true)
        ),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                const input = interaction instanceof CommandInteraction ? interaction.options.getString('input') : '';
                await client.musicManager
                    .say(interaction, input!)
                    .then(async () => {
                        await replyInteraction(
                            interaction,
                            createEmbed('Listen To Me', '`✅ I say what you said you wanted me to say.`', true)
                        );
                    })
                    .then(done)
                    .catch(async (err) => {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error saying something: `' + err + '`')
                        );
                        error(err);
                    });
                if (message) {
                    //NOT PLANNED
                }
            }
        });
    }
};
