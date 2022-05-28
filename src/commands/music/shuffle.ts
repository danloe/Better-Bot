import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle all tracks in the queue.'),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.shuffle(interaction);

                    if (interaction instanceof CommandInteraction) {
                        await safeReply(
                            interaction,
                            createEmbed('Shuffled', '`🔺 The Queue is no longer in OOOORDER.`', true)
                        );
                    }
                    
                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error shuffling the queue: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
