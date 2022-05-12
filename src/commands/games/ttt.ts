import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessagePayload,
    WebhookEditMessageOptions
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyDefer, replyInteraction } from '../../helpers';
import { TTTGame } from '../../classes/TTTGame';
import { GameType } from '../../classes/GameManager';
import { GameState } from '../../classes/GameLobby';

const tttThumbnail = 'https://www.dropbox.com/s/fkqrplz0duuqto9/ttt.png?dl=1';

export const command: Command = {
    data: new SlashCommandBuilder().setName('tictactoe').setDescription('Start a game of tic tac toe.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction instanceof CommandInteraction) {
                try {
                    const lobby = await client.gameManager.createLobby(
                        GameType.TicTacToe,
                        interaction,
                        interaction.user
                    );
                    await replyDefer(interaction);

                    // A PLAYER JOINED OR LEFT
                    lobby.on('join', async (game: TTTGame) => {
                        console.log(`[TTT] ${game.players[game.players.length - 1].username} joined`);
                        let players = '';
                        game.players.forEach((player) => {
                            players = players + '<@' + player.id + '>';
                        });
                        let embedmsg = getLobbyMessageEmbed(game, '`Waiting for more players...`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton().setCustomId('ttt_cancel').setLabel('Cancel Game').setStyle('DANGER')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    if (button.customId === 'ttt_cancel') {
                                        let embedmsg = getLobbyMessageEmbed(game, '`The game was canceled.`');
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });

                                        client.gameManager.destroyLobby(interaction.user);
                                        collector.off('end', endListener);
                                        collector.stop();
                                    }
                                } else {
                                    game.join(button.user);
                                }
                                await button.update(' ');
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        const endListener = async (_collected: any) => {
                            try {
                                if (game.state === GameState.Waiting || game.state === GameState.Ready) {
                                    let embedmsg = getLobbyMessageEmbed(game, '`The game lobby timed out.`');
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                    client.gameManager.destroyLobby(interaction.user);
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        };
                        collector.on('end', endListener);

                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: TTTGame) => {
                        console.log('[TTT] Ready');
                        let players = '';
                        game.players.forEach((player) => {
                            players = players + '<@' + player.id + '>';
                        });
                        let embedmsg = getLobbyMessageEmbed(game, '`Minimum player count reached. The game is ready.`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_cancel').setLabel('Cancel Game').setStyle('DANGER'),
                            new MessageButton().setCustomId('ttt_start').setLabel('Start Game').setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    if (button.customId === 'ttt_start') {
                                        await button.update(' ');
                                        game.start();
                                    } else if (button.customId === 'ttt_cancel') {
                                        await button.update(' ');
                                        let embedmsg = getLobbyMessageEmbed(game, '`The game was canceled.`');
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });

                                        client.gameManager.destroyLobby(interaction.user);
                                    }
                                    collector.off('end', endListener);
                                    collector.stop();
                                } else {
                                    try {
                                        await replyInteraction(
                                            button,
                                            createErrorEmbed("`⛔ This button isn't for you.`", true)
                                        );
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        const endListener = async (_collected: any) => {
                            try {
                                if (game.state === GameState.Waiting || game.state === GameState.Ready) {
                                    let embedmsg = getLobbyMessageEmbed(game, '`The game lobby timed out.`');
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                    client.gameManager.destroyLobby(interaction.user);
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        };
                        collector.on('end', endListener);

                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME STARTED
                    lobby.on('start', async (game: TTTGame) => {
                        console.log('[TTT] Started');
                        const gameFieldMessage = getGameFieldMessage(game);
                        await interaction.editReply(gameFieldMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    await button.update(' ');
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                    collector.off('end', endListener);
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await replyInteraction(
                                                button,
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
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

                        const endListener = async (_collected: any) => {
                            try {
                                if (game.state === GameState.Started) {
                                    let embedmsg = getLobbyMessageEmbed(
                                        game,
                                        '<@' +
                                            game.getTurnPlayer().id +
                                            '>` has not executed his move. The game is closed.`'
                                    );
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });

                                    client.gameManager.destroyLobby(interaction.user);
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        };
                        collector.on('end', endListener);
                    });

                    // GAME TICK
                    lobby.on('tick', async (game: TTTGame) => {
                        console.log('[TTT] Game Tick');
                        const gameFieldMessage = getGameFieldMessage(game);
                        await interaction.editReply(gameFieldMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    await button.update(' ');
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                    collector.off('end', endListener);
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await replyInteraction(
                                                button,
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
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

                        const endListener = async (_collected: any) => {
                            try {
                                if (game.state === GameState.Started) {
                                    let embedmsg = getLobbyMessageEmbed(
                                        game,
                                        '<@' +
                                            game.getTurnPlayer().id +
                                            '>` has not executed his move. The game is closed.`'
                                    );
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });

                                    client.gameManager.destroyLobby(interaction.user);
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        };
                        collector.on('end', endListener);
                    });

                    // GAME OVER
                    lobby.on('end', async (game: TTTGame) => {
                        console.log('[TTT] Game Over');
                        const gameFieldMessage = getGameFieldMessage(game);
                        await interaction.editReply(gameFieldMessage);

                        if (game.winner) {
                            await interaction.followUp(
                                createEmbed('Game Over', '🎉 <@' + game.winner.id + '> has won the game!')
                            );
                        } else {
                            await interaction.followUp(createEmbed('Game Over', '🫱🏼‍🫲🏼 Draw.'));
                        }

                        client.gameManager.destroyLobby(interaction.user);
                    });

                    // Join the games lobby as host
                    lobby.join(interaction.user);
                    done();
                } catch (err) {
                    try {
                        await replyInteraction(
                            interaction,
                            createErrorEmbed('🚩 Error creating a tic tac toe game: `' + err + '`')
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

function getLobbyMessageEmbed(game: TTTGame, message: string) {
    let players = '';
    game.players.forEach((player) => {
        players = players + '<@' + player.id + '>';
    });
    return new MessageEmbed()
        .setColor('#403075')
        .setTitle('Tic Tac Toe')
        .setDescription(message)
        .setThumbnail(tttThumbnail)
        .addField(`Players: ${game.players.length} of ${game.maxPlayers} [min:${game.minPlayers}]`, players);
}

function getGameFieldMessage(game: TTTGame): string | MessagePayload | WebhookEditMessageOptions {
    let embedmsg = new MessageEmbed()
        .setColor('#403075')
        .setTitle('Tic Tac Toe')
        .setDescription(
            '<@' + game.players[0].id + '>`' + game.charX + ' vs ' + game.charO + '`<@' + game.players[1].id + '>'
        )
        .addField(
            `Player Turn`,
            `<@${game.playerOturn ? game.players[1].id : game.players[0].id}> ${
                game.playerOturn ? game.charO : game.charX
            }`
        );
    const row1 = new MessageActionRow().addComponents([
        new MessageButton()
            .setCustomId('ttt_0')
            .setLabel(game.gameField[0])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0] !== game.charField),
        new MessageButton()
            .setCustomId('ttt_1')
            .setLabel(game.gameField[1])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[1] !== game.charField),
        new MessageButton()
            .setCustomId('ttt_2')
            .setLabel(game.gameField[2])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[2] !== game.charField)
    ]);
    const row2 = new MessageActionRow().addComponents([
        new MessageButton()
            .setCustomId('ttt_3')
            .setLabel(game.gameField[3])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[3] !== game.charField),
        new MessageButton()
            .setCustomId('ttt_4')
            .setLabel(game.gameField[4])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[4] !== game.charField),
        new MessageButton()
            .setCustomId('ttt_5')
            .setLabel(game.gameField[5])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[5] !== game.charField)
    ]);
    const row3 = new MessageActionRow().addComponents([
        new MessageButton()
            .setCustomId('ttt_6')
            .setLabel(game.gameField[6])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[6] !== game.charField),
        new MessageButton()
            .setCustomId('ttt_7')
            .setLabel(game.gameField[7])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[7] !== game.charField),
        new MessageButton()
            .setCustomId('ttt_8')
            .setLabel(game.gameField[8])
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[8] !== game.charField)
    ]);
    return {
        embeds: [embedmsg],
        components: [row1, row2, row3]
    };
}
