import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessagePayload,
    User,
    WebhookEditMessageOptions
} from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, replyDefer, replyInteraction } from '../../helpers';
import { TTTGame } from '../../classes/TTTGame';
import { GameType } from '../../classes/GameManager';
import { GameLobby, GameState } from '../../classes/GameLobby';

const tttThumbnail = 'https://www.dropbox.com/s/fkqrplz0duuqto9/ttt.png?dl=1';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Start a game of tic tac toe.')
        .addUserOption((option) =>
            option.setName('opponent').setDescription('Do you want to challenge a specific user?').setRequired(false)
        ),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction instanceof CommandInteraction) {
                try {
                    await replyDefer(interaction);
                    
                    let opponent = interaction.options.getUser('opponent');

                    const lobby = await client.gameManager.createLobby(
                        GameType.TicTacToe,
                        interaction,
                        interaction.user
                    );

                    // A PLAYER JOINED
                    lobby.on('join', async (game: TTTGame) => {
                        console.log(`[TTT] ${game.players[game.players.length - 1].username} joined`);
                        let embedmsg = getLobbyMessageEmbed(game, '`Waiting for more players...`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_join_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton()
                                .setCustomId('ttt_join_cancel')
                                .setLabel('Cancel Game')
                                .setStyle('DANGER')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                await button.deferUpdate();
                                if (button.user.id === interaction.user.id) {
                                    if (button.customId === 'ttt_join_cancel') {
                                        let embedmsg = getLobbyMessageEmbed(game, '`The game was canceled.`');
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });

                                        client.gameManager.destroyLobby(interaction.user);
                                        collector.stop();
                                    }
                                } else {
                                    if (button.customId === 'ttt_join_join') {
                                        game.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'ttt_join_cancel') {
                                        await button.reply(createErrorEmbed("`⛔ This button isn't for you.`", true));
                                    }
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    let embedmsg = getLobbyMessageEmbed(game, '`The game lobby timed out.`');
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                    client.gameManager.destroyLobby(interaction.user);
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: TTTGame) => {
                        console.log('[TTT] Ready');
                        let embedmsg = getLobbyMessageEmbed(game, '`Minimum player count reached. The game is ready.`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ttt_ready_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton()
                                .setCustomId('ttt_ready_cancel')
                                .setLabel('Cancel Game')
                                .setStyle('DANGER'),
                            new MessageButton()
                                .setCustomId('ttt_ready_start')
                                .setLabel('Start Game')
                                .setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'ttt_ready_start') {
                                        game.start();
                                    } else if (button.customId === 'ttt_ready_cancel') {
                                        let embedmsg = getLobbyMessageEmbed(game, '`The game was canceled.`');
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });

                                        client.gameManager.destroyLobby(interaction.user);
                                    }
                                    collector.stop();
                                } else {
                                    try {
                                        if (button.customId === 'ttt_ready_join') {
                                            await button.deferUpdate();
                                            game.join(button.user);
                                            collector.stop();
                                        } else {
                                            await button.reply(
                                                createErrorEmbed("`⛔ This button isn't for you.`", true)
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

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    let embedmsg = getLobbyMessageEmbed(game, '`The game lobby timed out.`');
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                    client.gameManager.destroyLobby(interaction.user);
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME STARTED
                    lobby.on('start', async (game: TTTGame) => {
                        console.log('[TTT] Started');
                        const gameFieldMessage = getGameFieldMessage(game);
                        await interaction.editReply(gameFieldMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    await button.deferUpdate();
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await button.reply(
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
                                        } else {
                                            await button.reply(
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

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time' && game.state === GameState.Started) {
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
                        });
                    });

                    // GAME TICK
                    lobby.on('tick', async (game: TTTGame) => {
                        console.log('[TTT] Game Tick');
                        const gameFieldMessage = getGameFieldMessage(game);
                        await interaction.editReply(gameFieldMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === game.getTurnPlayer().id) {
                                    await button.deferUpdate();
                                    game.placeMark(parseInt(button.customId.replace('ttt_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.players.includes(button.user)) {
                                            await button.reply(
                                                createErrorEmbed("`💤 It is the other player's turn.`", true)
                                            );
                                        } else {
                                            await button.reply(
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

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time' && game.state === GameState.Started) {
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
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (game: TTTGame) => {
                        console.log('[TTT] Game Over');
                        const gameFieldMessage = getGameFieldMessage(game);
                        await interaction.editReply(gameFieldMessage);

                        if (game.winners.length > 0) {
                            await interaction.followUp(
                                createEmbed('Game Over', '🎉 <@' + game.winners[0].id + '> has won the game!')
                            );
                        } else {
                            await interaction.followUp(createEmbed('Game Over', '🫱🏼‍🫲🏼 Draw.'));
                        }

                        client.gameManager.destroyLobby(interaction.user);
                    });

                    if (opponent) {
                        // Send a challenge message
                        await interaction.editReply(
                            getChallengeMessage(
                                opponent,
                                '⚔️ <@' + interaction.user.id + '> `challenged you to a game of TicTacToe!`'
                            )
                        );

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: lobby.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === opponent!.id) {
                                    if (button.customId === 'ttt_challenge_accept') {
                                        await button.deferUpdate();

                                        lobby.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'ttt_challenge_decline') {
                                        await button.deferUpdate();

                                        let embedmsg = getLobbyMessageEmbed(
                                            lobby,
                                            '`The game challenge was declined.`'
                                        );
                                        await interaction.editReply({
                                            content: ' ',
                                            embeds: [embedmsg],
                                            components: []
                                        });

                                        client.gameManager.destroyLobby(interaction.user);
                                        collector.stop();
                                    }
                                } else {
                                    try {
                                        await button.reply(
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

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time' && lobby.state === GameState.Waiting) {
                                    let embedmsg = getLobbyMessageEmbed(
                                        lobby,
                                        '<@' + opponent!.id + '> `has not accepted the challenge. The game is closed.`'
                                    );
                                    await interaction.editReply({ content: ' ', embeds: [embedmsg], components: [] });

                                    client.gameManager.destroyLobby(interaction.user);
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    } else {
                        // open game lobby
                        lobby.open();
                    }
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

function getLobbyMessageEmbed(game: GameLobby, message: string) {
    let players = '';
    game.players.forEach((player) => {
        players = players + '<@' + player.id + '> ';
    });
    return new MessageEmbed()
        .setColor('#403075')
        .setTitle('Tic Tac Toe')
        .setDescription(message)
        .setThumbnail(tttThumbnail)
        .addField(`Players: ${game.players.length} of ${game.maxPlayers} [min ${game.minPlayers}]`, players);
}

function getChallengeMessage(opponent: User, message: string): string | MessagePayload | WebhookEditMessageOptions {
    let embedmsg = new MessageEmbed()
        .setColor('#403075')
        .setTitle('Tic Tac Toe')
        .setAuthor({ name: opponent.username, iconURL: opponent.avatarURL() || '' })
        .setDescription(message)
        .setThumbnail(tttThumbnail);
    const row1 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('ttt_challenge_accept').setLabel('Accept').setStyle('SUCCESS'),
        new MessageButton().setCustomId('ttt_challenge_decline').setLabel('Decline').setStyle('DANGER')
    ]);
    return {
        content: `<@${opponent.id}>`,
        embeds: [embedmsg],
        components: [row1]
    };
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
        new MessageButton().setCustomId('ttt_0').setLabel(game.gameField[0]).setStyle('SECONDARY'),
        new MessageButton().setCustomId('ttt_1').setLabel(game.gameField[1]).setStyle('SECONDARY'),
        new MessageButton().setCustomId('ttt_2').setLabel(game.gameField[2]).setStyle('SECONDARY')
    ]);
    const row2 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('ttt_3').setLabel(game.gameField[3]).setStyle('SECONDARY'),
        new MessageButton().setCustomId('ttt_4').setLabel(game.gameField[4]).setStyle('SECONDARY'),
        new MessageButton().setCustomId('ttt_5').setLabel(game.gameField[5]).setStyle('SECONDARY')
    ]);
    const row3 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('ttt_6').setLabel(game.gameField[6]).setStyle('SECONDARY'),
        new MessageButton().setCustomId('ttt_7').setLabel(game.gameField[7]).setStyle('SECONDARY'),
        new MessageButton().setCustomId('ttt_8').setLabel(game.gameField[8]).setStyle('SECONDARY')
    ]);
    return {
        embeds: [embedmsg],
        components: [row1, row2, row3]
    };
}
