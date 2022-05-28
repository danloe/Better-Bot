import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('np')
        .setDescription('Enable/Disable now playing message when a song starts.')
        .addBooleanOption((option) => option.setName('set').setDescription('Enable?').setRequired(true)),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    let input =
                        interaction instanceof CommandInteraction ? interaction.options.getBoolean('set') : undefined;

                    const subscription = client.musicManager.getSubscription(interaction, false);

                    if (input) {
                        subscription.setMessageDisplay(input);
                        await safeReply(
                            interaction,
                            createEmbed(
                                'Now Playing Message Set',
                                '`🔺 The now playing message is now ' + input ? 'on.`' : 'off.`',
                                true
                            )
                        );
                    } else {
                        let state = subscription.getMessageDisplay();
                        await safeReply(
                            interaction,
                            createEmbed(
                                'Now Playing Message',
                                '`🔺 The now playing message is turned ' + state ? 'on.`' : 'off.`',
                                true
                            )
                        );
                    }

                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error setting the volume: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
