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
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) => {
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const input =
                        interaction instanceof CommandInteraction ? interaction.options.getString('input') : '';
                    await client.musicManager.say(interaction, input!);
                    await replyInteraction(
                        interaction,
                        createEmbed('Listen To Me', '`✅ I say what you said you wanted me to say.`', true)
                    );
                    done();
                } catch (err) {
                    try {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error saying something: `' + err + '`')
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
