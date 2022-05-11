import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createErrorEmbed, replyInteraction } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop audio playback.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Tic Tac Toe');
                    const row1 = new MessageActionRow().addComponents([
                        new MessageButton().setCustomId('ttt_0').setLabel('⬜').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('ttt_1').setLabel('⬜').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('ttt_2').setLabel('⬜').setStyle('SECONDARY')
                    ]);
                    const row2 = new MessageActionRow().addComponents([
                        new MessageButton().setCustomId('ttt_3').setLabel('⬜').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('ttt_4').setLabel('⬜').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('ttt_5').setLabel('⬜').setStyle('SECONDARY')
                    ]);
                    const row3 = new MessageActionRow().addComponents([
                        new MessageButton().setCustomId('ttt_6').setLabel('⬜').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('ttt_7').setLabel('⬜').setStyle('SECONDARY'),
                        new MessageButton().setCustomId('ttt_8').setLabel('⬜').setStyle('SECONDARY')
                    ]);
                    await replyInteraction(interaction, {
                        embeds: [embedmsg],
                        components: [row1, row2, row3]
                    });

                    const collector = interaction.channel!.createMessageComponentCollector({
                        componentType: 'BUTTON',
                        time: 60000
                    });

                    collector.on('collect', async (button) => {
                        try {
                            if (button.user.id === interaction.user.id) {
                                makeMove(button);
                            } else {
                                try {
                                    await replyInteraction(
                                        button,
                                        createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                    );
                                } catch (err) {
                                    console.log(err);
                                }
                            }
                        } catch (err) {
                            console.log(err);
                        }
                    });

                    collector.on('end', async (collection) => {
                        try {
                            await interaction.editReply({
                                embeds: [embedmsg],
                                components: []
                            });
                        } catch (err) {
                            console.log(err);
                        }
                    });

                    done();
                } catch (err) {
                    try {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error stopping the track: `' + err + '`')
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

function makeMove(button:ButtonInteraction) {

}