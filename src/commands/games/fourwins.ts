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
import { FourWinsGame } from '../../classes/FourWinsGame';
import { GameType } from '../../classes/GameManager';
import { GameLobby, GameState } from '../../classes/GameLobby';

const fwThumbnail = 'https://www.dropbox.com/s/0jq0iqts4a9vque/fourwins.png?dl=1';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('fourwins')
        .setDescription('Start a game of four wins.')
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
                        GameType.FourWins,
                        interaction,
                        interaction.user
                    );

                    // A PLAYER JOINED
                    lobby.on('join', async (game: FourWinsGame) => {
                        console.log(`[FourWins] ${game.players[game.players.length - 1].username} joined`);
                        let embedmsg = getLobbyMessageEmbed(game, '`Waiting for more players...`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('join_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton().setCustomId('join_cancel').setLabel('Cancel Game').setStyle('DANGER')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'join_cancel') {
                                        client.gameManager.destroyLobby(interaction.user);
                                        let embedmsg = getLobbyMessageEmbed(game, '`The game was canceled.`');
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });
                                        collector.stop();
                                    }
                                } else {
                                    if (button.customId === 'join_join') {
                                        await button.deferUpdate();
                                        game.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'join_cancel') {
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
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = getLobbyMessageEmbed(game, '`The game lobby timed out.`');
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await interaction.editReply({ embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: FourWinsGame) => {
                        console.log('[FourWins] Ready');
                        let embedmsg = getLobbyMessageEmbed(game, '`Minimum player count reached. The game is ready.`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('fw_ready_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton()
                                .setCustomId('fw_ready_cancel')
                                .setLabel('Cancel Game')
                                .setStyle('DANGER'),
                            new MessageButton().setCustomId('fw_ready_start').setLabel('Start Game').setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'fw_ready_start') {
                                        game.start();
                                    } else if (button.customId === 'fw_ready_cancel') {
                                        client.gameManager.destroyLobby(interaction.user);
                                        let embedmsg = getLobbyMessageEmbed(game, '`The game was canceled.`');
                                        await interaction.editReply({ embeds: [embedmsg], components: [] });
                                    }
                                    collector.stop();
                                } else {
                                    try {
                                        if (button.customId === 'fw_ready_join') {
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
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = getLobbyMessageEmbed(game, '`The game lobby timed out.`');
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });

                        await interaction.editReply({
                            content: '<@' + lobby.host.id + '>',
                            embeds: [embedmsg],
                            components: [row]
                        });
                    });

                    // GAME STARTED
                    lobby.on('start', async (game: FourWinsGame) => {
                        console.log('[FourWins] Started');
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
                                    game.placeMark(parseInt(button.customId.replace('fw_', '')));
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
                                    client.gameManager.destroyLobby(interaction.user);
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME TICK
                    lobby.on('tick', async (game: FourWinsGame) => {
                        console.log('[FourWins] Game Tick');
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
                                    game.placeMark(parseInt(button.customId.replace('fw_', '')));
                                    collector.stop();
                                } else {
                                    1;
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
                                            '> `has not executed his move. The game is closed.`'
                                    );
                                    client.gameManager.destroyLobby(interaction.user);
                                    await interaction.editReply({ embeds: [embedmsg], components: [] });
                                }
                            } catch (err) {
                                console.log(err);
                            }
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (game: FourWinsGame) => {
                        console.log('[FourWins] Game Over');
                        const gameFieldMessage = getGameFieldMessage(game, true);
                        await interaction.editReply(gameFieldMessage);

                        if (game.winners.length > 0) {
                            let embedmsg = new MessageEmbed()
                                .setColor('#403075')
                                .setTitle('Four Wins - Game Over')
                                .setDescription('🎉 <@' + game.winners[0].id + '> `has won the game!`')
                                .setThumbnail(fwThumbnail);
                            await interaction.followUp({ embeds: [embedmsg] });
                        } else {
                            client.gameManager.destroyLobby(interaction.user);
                            let embedmsg = new MessageEmbed()
                                .setColor('#403075')
                                .setTitle('Four Wins - Game Over')
                                .setDescription('`🫱🏼‍🫲🏼 Draw`')
                                .setThumbnail(fwThumbnail);
                            await interaction.followUp({ embeds: [embedmsg] });
                        }
                    });

                    if (opponent) {
                        // Send a challenge message
                        await interaction.editReply(
                            getChallengeMessage(
                                opponent,
                                '⚔️ <@' + interaction.user.id + '> `challenged you to a game of Four Wins!`'
                            )
                        );

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: lobby.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === opponent!.id) {
                                    if (button.customId === 'fw_challenge_accept') {
                                        await button.deferUpdate();

                                        lobby.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'fw_challenge_decline') {
                                        await button.deferUpdate();

                                        client.gameManager.destroyLobby(interaction.user);
                                        let embedmsg = getLobbyMessageEmbed(
                                            lobby,
                                            '`The game challenge was declined.`'
                                        );
                                        await interaction.editReply({
                                            content: ' ',
                                            embeds: [embedmsg],
                                            components: []
                                        });

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
                                    client.gameManager.destroyLobby(interaction.user);
                                    let embedmsg = getLobbyMessageEmbed(
                                        lobby,
                                        '<@' + opponent!.id + '> `has not accepted the challenge. The game is closed.`'
                                    );
                                    await interaction.editReply({ content: ' ', embeds: [embedmsg], components: [] });
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
                            createErrorEmbed('🚩 Error creating a Four Wins game: `' + err + '`')
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
        .setTitle('Four Wins')
        .setDescription(message)
        .setThumbnail(fwThumbnail)
        .addField(`Players: ${game.players.length} of ${game.maxPlayers} [min ${game.minPlayers}]`, players);
}

function getChallengeMessage(opponent: User, message: string): string | MessagePayload | WebhookEditMessageOptions {
    let embedmsg = new MessageEmbed()
        .setColor('#403075')
        .setTitle('Four Wins')
        .setAuthor({ name: opponent.username, iconURL: opponent.avatarURL() || '' })
        .setDescription(message)
        .setThumbnail(fwThumbnail);
    const row1 = new MessageActionRow().addComponents([
        new MessageButton().setCustomId('fw_challenge_accept').setLabel('Accept').setStyle('SUCCESS'),
        new MessageButton().setCustomId('fw_challenge_decline').setLabel('Decline').setStyle('DANGER')
    ]);
    return {
        content: `<@${opponent.id}>`,
        embeds: [embedmsg],
        components: [row1]
    };
}

function getGameFieldMessage(
    game: FourWinsGame,
    noButtons: boolean = false
): string | MessagePayload | WebhookEditMessageOptions {
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
        content: ' ',
        embeds: [embedmsg],
        components: noButtons ? [] : [row1, row2]
    };
}
