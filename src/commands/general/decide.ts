import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('decide')
        .setDescription('Helps you find a decision.')
        .addStringOption((option) =>
            option
                .setName('input')
                .setDescription('Question or options to decide from. Separate options by commas.')
                .setRequired(true)
        ),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            const answers = ['YES', 'NO', 'YUP', 'NOPE', 'YEAH', 'NAH', 'SURE', 'OF COURSE NOT'];

            if (interaction) {
                try {
                    if (interaction instanceof ButtonInteraction) return;
                    let input = interaction.options.getString('input');
                    let splitInput = input!.split(',');

                    if (splitInput.length == 1) {
                        let i = Math.floor(Math.random() * answers.length);
                        await safeReply(
                            interaction,
                            createEmbed(
                                'Decision',
                                `${interaction.user}:` + ' `' + splitInput[0] + '`  **' + answers[i] + '**',
                                false
                            )
                        );
                        done();
                        return;
                    }

                    if (splitInput.length > 1) {
                        let iDecision = Math.floor(Math.random() * splitInput.length);
                        let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Decision');
                        for (let i = 0; i < splitInput.length; i++) {
                            embedmsg.addField(splitInput[i], i == iDecision ? '🔺' : '❌', true);
                        }
                        await safeReply(interaction, { embeds: [embedmsg] });
                        done();
                        return;
                    }
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error deciding: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
