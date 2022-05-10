import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next track, or further.')
        .addNumberOption((option) =>
            option.setName('input').setDescription('Skip how many tracks?').setRequired(false)
        ),
    run: async (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                let input = interaction instanceof CommandInteraction ? interaction.options.getNumber('input') : 0;
                if (!input) input = 0;

                await client.musicManager
                    .skip(interaction, input)
                    .then(async () => {
                        let msg = '`' + String(input) + (input == 1 ? ' track' : ' tracks') + ' skipped';
                        if (input == 0) msg = '`Skipped to the next track';
                        msg =
                            msg +
                            ' [' +
                            (client.musicManager.queues.get(interaction.guildId!)!.length - 1) +
                            ' more in queue]`';

                        await replyInteraction(interaction, createEmbed('Skipped', msg, false));
                    })
                    .then(done)
                    .catch(async (err) => {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error skipping track(s): `' + err + '`')
                        );
                        error(err);
                    });
                if (message) {
                    //NOT PLANNED
                }
            }
        })
};
