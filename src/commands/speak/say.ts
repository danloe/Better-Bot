import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Says everything you want.')
        .addStringOption((option) => option.setName('input').setDescription('The text to be spoken.').setRequired(true))
        .addStringOption((option) =>
            option
                .setName('lang')
                .setDescription('The language to be spoken.')
                .setRequired(false)
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'German', value: 'de' },
                    { name: 'Dutch', value: 'nl' },
                    { name: 'French', value: 'fr' },
                    { name: 'Spanish', value: 'es' }
                )
        ),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const input =
                        interaction instanceof CommandInteraction ? interaction.options.getString('input') : '';
                    let lang = interaction instanceof CommandInteraction ? interaction.options.getString('lang') : 'en';
                    if (!lang) lang = 'en';
                    await client.musicManager.say(interaction, input!, lang!);
                    await safeReply(interaction, '`🗨️' + getLanguageEmoji(lang) + ' ' + input + '`');
                    done();
                } catch (err) {
                    try {
                        await safeReply(
                            interaction,
                            createErrorEmbed('🚩 Error saying something: `' + err + '`')
                        );
                    } catch (err2) {
                        console.log(err2);
                    }
                    console.log(err);
                    error(err);
                }
            }
        })
};

function getLanguageEmoji(lang: string): string {
    switch (lang) {
        case 'en':
            return '💂';
        case 'de':
            return '🍺';
        case 'nl':
            return '🧀';
        case 'fr':
            return '🥖';
        case 'es':
            return '🐂';
    }
    return '🏳️‍🌈';
}
