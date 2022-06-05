import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';
import { SlashCommandBuilder } from '@discordjs/builders';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Shows or sets the audio volume.')
        .addIntegerOption((option) =>
            option.setName('set').setDescription('What percentage?').setMinValue(1).setMaxValue(300).setRequired(false)
        ),
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
                        interaction instanceof CommandInteraction ? interaction.options.getInteger('set') : null;

                    const subscription = client.musicManager.getSubscription(interaction, false);

                    if (input) {
                        let vol = input / 100;
                        subscription.setVolume(vol);
                        await safeReply(
                            client,
                            interaction,
                            createEmbed('Volume', '`🔺 The audio volume has been set to ' + String(input) + '%`', true)
                        );
                    } else {
                        let vol = subscription.getVolume();
                        vol = Math.floor(vol * 100);
                        await safeReply(
                            client,
                            interaction,
                            createEmbed('Volume', '`🔉 The audio volume is at ' + String(vol) + '%`', true)
                        );
                    }

                    done();
                } catch (err) {
                    await safeReply(
                        client,
                        interaction,
                        createErrorEmbed('🚩 Error setting the volume: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};
