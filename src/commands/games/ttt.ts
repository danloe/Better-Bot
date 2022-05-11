import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    User
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyInteraction } from '../../helpers';
import { GameLobby } from '../../classes/GameLobby';
import { TTTGame } from '../../classes/TTTGame';

export const command: Command = {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop audio playback.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction instanceof CommandInteraction) {
                try {
                    const lobby = await client.gameManager.createTTTLobby(interaction, interaction.user);

                    // A PLAYER JOINED OR LEFT
                    lobby.on('join', async (game: TTTGame) => {
                        let players = '';
                        game.players.forEach((player) => {
                            players = players + player + ' ';
                        });
                        let embedmsg = new MessageEmbed()
                            .setColor('#403075')
                            .setTitle('Tic Tac Toe')
                            .setDescription('`Waiting for more players...`')
                            .addField(
                                `Players [${game.players.length}/min:${game.minPlayers}-max:${game.maxPlayers}]`,
                                players
                            );
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_start').setLabel('Start Game').setStyle('SUCCESS')
                        ]);
                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: TTTGame) => {
                        let players = '';
                        game.players.forEach((player) => {
                            players = players + player + ' ';
                        });
                        let embedmsg = new MessageEmbed()
                            .setColor('#403075')
                            .setTitle('Tic Tac Toe')
                            .setDescription('`The game is ready.`')
                            .addField(`Players [${game.players.length}/${game.maxPlayers}]`, players);
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_start').setLabel('Start Game').setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    game.start();
                                } else {
                                    try {
                                        await replyInteraction(
                                            button,
                                            createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                        );
                                        collector.stop();
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME STARTED
                    lobby.on('start', async (game: TTTGame) => {
                        let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Tic Tac Toe');
                        const row1 = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_0').setLabel(game.charField).setStyle('SECONDARY'),
                            new MessageButton().setCustomId('ttt_1').setLabel(game.charField).setStyle('SECONDARY'),
                            new MessageButton().setCustomId('ttt_2').setLabel(game.charField).setStyle('SECONDARY')
                        ]);
                        const row2 = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_3').setLabel(game.charField).setStyle('SECONDARY'),
                            new MessageButton().setCustomId('ttt_4').setLabel(game.charField).setStyle('SECONDARY'),
                            new MessageButton().setCustomId('ttt_5').setLabel(game.charField).setStyle('SECONDARY')
                        ]);
                        const row3 = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_6').setLabel(game.charField).setStyle('SECONDARY'),
                            new MessageButton().setCustomId('ttt_7').setLabel(game.charField).setStyle('SECONDARY'),
                            new MessageButton().setCustomId('ttt_8').setLabel(game.charField).setStyle('SECONDARY')
                        ]);
                        await interaction.editReply({
                            embeds: [embedmsg],
                            components: [row1, row2, row3]
                        });

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await replyInteraction(
                                                button,
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
                                            collector.stop();
                                        } else {
                                            await replyInteraction(
                                                button,
                                                createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                            );
                                        }
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME TICK
                    lobby.on('tick', async (game: TTTGame) => {
                        let embedmsg = new MessageEmbed().setColor('#403075').setTitle('Tic Tac Toe');
                        const row1 = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_0').setLabel(game.gameField[0]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField)),
                            new MessageButton().setCustomId('ttt_1').setLabel(game.gameField[1]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField)),
                            new MessageButton().setCustomId('ttt_2').setLabel(game.gameField[2]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField))
                        ]);
                        const row2 = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_3').setLabel(game.gameField[3]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField)),
                            new MessageButton().setCustomId('ttt_4').setLabel(game.gameField[4]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField)),
                            new MessageButton().setCustomId('ttt_5').setLabel(game.gameField[5]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField))
                        ]);
                        const row3 = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_6').setLabel(game.gameField[6]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField)),
                            new MessageButton().setCustomId('ttt_7').setLabel(game.gameField[7]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField)),
                            new MessageButton().setCustomId('ttt_8').setLabel(game.gameField[8]).setStyle('SECONDARY').setDisabled((game.gameField[0] !== game.charField))
                        ]);
                        await interaction.editReply({
                            embeds: [embedmsg],
                            components: [row1, row2, row3]
                        });

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await replyInteraction(
                                                button,
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
                                            collector.stop();
                                        } else {
                                            await replyInteraction(
                                                button,
                                                createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                            );
                                        }
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (winner: User | null) => {
                        if (winner) {
                            await interaction.followUp(createEmbed('Game Over', '🎉 ' + winner + 'has won the game!'));
                        } else {
                            await interaction.followUp(createEmbed('Game Over', '🫱🏼‍🫲🏼 Draw.'));
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
