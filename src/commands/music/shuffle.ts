import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle all tracks in the queue.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        return new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    await client.musicManager.shuffle(interaction);
                    await replyInteraction(
                        interaction,
                        createEmbed('Shuffled', '`✅ The Queue is no longer in OOOORDER.`', false)
                    );
                    done();
                } catch (err) {
                    try {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error shuffling the queue: `' + err + '`')
                        );
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }

                if (message) {
                    //NOT PLANNED
                }
            }
        });
    }
};
