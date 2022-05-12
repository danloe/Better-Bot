import { Command } from '../../interfaces';
import {
    ButtonInteraction,
    CommandInteraction,
    InteractionCollector,
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
import { GameType } from '../../classes/GameManager';
import { GameState } from '../../classes/GameLobby';
import { FourWinsGame } from '../../classes/FourWinsGame';

const fwThumbnail = 'https://www.dropbox.com/s/0jq0iqts4a9vque/fourwins.png?dl=1';

export const command: Command = {
    data: new SlashCommandBuilder().setName('fourwins').setDescription('Start a game of four wins.'),
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
                        GameType.FourWins,
                        interaction,
                        interaction.user
                    );
                    await replyDefer(interaction);

                    // A PLAYER JOINED OR LEFT
                    lobby.on('join', async (game: FourWinsGame) => {
                        console.log(`[FourWins] ${game.players[game.players.length - 1].username} joined`);
                        let players = '';
                        game.players.forEach((player) => {
                            players = players + '<@' + player.id + '>';
                        });
                        let embedmsg = getLobbyMessageEmbed(game, '`Waiting for more players...`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('fw_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton().setCustomId('fw_cancel').setLabel('Cancel Game').setStyle('DANGER')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    if (button.customId === 'fw_cancel') {
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
                    lobby.on('ready', async (game: FourWinsGame) => {
                        console.log('[FourWins] Ready');
                        let players = '';
                        game.players.forEach((player) => {
                            players = players + '<@' + player.id + '>';
                        });
                        let embedmsg = getLobbyMessageEmbed(game, '`Minimum player count reached. The game is ready.`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('fw_cancel').setLabel('Cancel Game').setStyle('DANGER'),
                            new MessageButton().setCustomId('fw_start').setLabel('Start Game').setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: 60000
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    if (button.customId === 'fw_start') {
                                        await button.update(' ');
                                        game.start();
                                    } else if (button.customId === 'fw_cancel') {
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
                    lobby.on('start', async (game: FourWinsGame) => {
                        console.log('[FourWins] Started');
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
                                    game.placeMark(parseInt(button.customId.replace('fw_', '')));
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
                    lobby.on('tick', async (game: FourWinsGame) => {
                        console.log('[FourWins] Game Tick');
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
                                    game.placeMark(parseInt(button.customId.replace('fw_', '')));
                                    collector.off('end', endListener);
                                    collector.stop();
                                } else {
                                    1;
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
                                            '> `has not executed his move. The game is closed.`'
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
                    lobby.on('end', async (game: FourWinsGame) => {
                        console.log('[FourWins] Game Over');
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

function getLobbyMessageEmbed(game: FourWinsGame, message: string) {
    let players = '';
    game.players.forEach((player) => {
        players = players + '<@' + player.id + '>';
    });
    return new MessageEmbed()
        .setColor('#403075')
        .setTitle('Four Wins')
        .setDescription(message)
        .setThumbnail(fwThumbnail)
        .addField(`Players: ${game.players.length} of ${game.maxPlayers} [min:${game.minPlayers}]`, players);
}

function getGameFieldMessage(game: FourWinsGame): string | MessagePayload | WebhookEditMessageOptions {
    let fieldString = '';
    for (let y = 0; y < game.gameField.length; y++) {
        for (let x = 0; x < game.gameField[0].length; x++) {
            fieldString = fieldString + game.gameField[y][x];
        }
        fieldString = fieldString + '\n';
    }
    fieldString = fieldString + '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣';
    let embedmsg = new MessageEmbed()
        .setColor('#403075')
        .setTitle('Four Wins')
        .setDescription(
            '<@' +
                game.players[0].id +
                '>`' +
                game.charRed +
                ' vs ' +
                game.charYellow +
                '`<@' +
                game.players[1].id +
                '>'
        )
        .addField(
            `Player Turn`,
            `<@${game.playerYellowTurn ? game.players[1].id : game.players[0].id}> ${
                game.playerYellowTurn ? game.charYellow : game.charRed
            }`
        )
        .addField('\u200B', fieldString);
    const row1 = new MessageActionRow().addComponents([
        new MessageButton()
            .setCustomId('fw_0')
            .setLabel('1️⃣')
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0][0] !== game.charField),
        new MessageButton()
            .setCustomId('fw_1')
            .setLabel('2️⃣')
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0][1] !== game.charField),
        new MessageButton()
            .setCustomId('fw_2')
            .setLabel('3️⃣')
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0][2] !== game.charField),
        new MessageButton()
            .setCustomId('fw_3')
            .setLabel('4️⃣')
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0][3] !== game.charField)
    ]);
    const row2 = new MessageActionRow().addComponents([
        new MessageButton()
            .setCustomId('fw_4')
            .setLabel('5️⃣')
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0][4] !== game.charField),
        new MessageButton()
            .setCustomId('fw_5')
            .setLabel('6️⃣')
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0][5] !== game.charField),
        new MessageButton()
            .setCustomId('fw_6')
            .setLabel('7️⃣')
            .setStyle('SECONDARY')
            .setDisabled(game.gameField[0][6] !== game.charField)
    ]);
    return {
        embeds: [embedmsg],
        components: [row1, row2]
    };
}
