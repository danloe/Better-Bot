import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, GuildMember, Message, MessageActionRow, MessageButton } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BotterinoClient from '../../client';
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { Category, CategoryNamesPretty, CategoryResolvable, QuestionDifficulty, QuestionType } from 'open-trivia-db';
import { answerDisplayTime, TriviaGame, GameType, GameState } from '../../classes';
import { APIApplicationCommandOptionChoice } from 'discord-api-types/v10';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Start a game of Trivia.')
        .addIntegerOption((option) =>
            option
                .setName('rounds')
                .setDescription('How many questions?')
                .setMinValue(1)
                .setMaxValue(50)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('difficulty')
                .setDescription('Which question difficulty?')
                .addChoices(
                    { name: 'easy', value: 'easy' },
                    { name: 'medium', value: 'medium' },
                    { name: 'hard', value: 'hard' }
                )
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('What question answers type?')
                .addChoices({ name: 'yes / no', value: 'boolean' }, { name: 'multiple choice', value: 'multiple' })
                .setRequired(false)
        )
        .addStringOption((option) =>
            option
                .setName('category')
                .setDescription('Which question category?')
                .addChoices(...getCategoryOptions())
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('players')
                .setDescription('How many players can join?')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false)
        )
        .addBooleanOption((option) =>
            option
                .setName('voice')
                .setDescription('Activate TTS over voice to read the questions? Host must be in voice channel!')
                .setRequired(false)
        )
        .addIntegerOption((option) =>
            option
                .setName('time')
                .setDescription('How many seconds for each question?')
                .setMinValue(5)
                .setMaxValue(60)
                .setRequired(false)
        ),
    run: (
        client: BotterinoClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction instanceof CommandInteraction) {
                try {
                    await safeDeferReply(client, interaction);

                    let amount = interaction.options.getInteger('amount');
                    let difficultyOption = interaction.options.getString('difficulty');
                    if (!difficultyOption) difficultyOption = null;
                    let typeOption = interaction.options.getString('type');
                    if (!typeOption) typeOption = null;
                    let categoryOption = interaction.options.getString('category');
                    if (!categoryOption) categoryOption = null;
                    let maxPlayersOption = interaction.options.getInteger('players');
                    if (!maxPlayersOption) maxPlayersOption = 10;
                    let voiceOption = interaction.options.getBoolean('voice');
                    if (!voiceOption) voiceOption = false;
                    let timeOption = interaction.options.getInteger('time');
                    if (!timeOption) timeOption = 20;

                    const lobby = (await client.gameManager.createLobby(
                        GameType.Trivia,
                        interaction,
                        interaction.user,
                        1,
                        maxPlayersOption
                    )) as TriviaGame;
                    lobby.amount = amount!;
                    lobby.difficulty = <QuestionDifficulty>difficultyOption!;
                    lobby.type = <QuestionType>typeOption!;
                    lobby.readQuestions = voiceOption;
                    lobby.questionAnswerTime = timeOption! * 1000;
                    if (categoryOption) {
                        lobby.category = new Category(<CategoryResolvable>categoryOption);
                        await lobby.getCategoryInfo();
                    }

                    // A PLAYER JOINED
                    lobby.on('join', async (game: TriviaGame) => {
                        let embedmsg = game.getLobbyMessageEmbed('`Waiting for more players...`');
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
                                        let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                        client.gameManager.destroyLobby(interaction.user);
                                        await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                    } else {
                                        game.join(button.user);
                                    }
                                    collector.stop();
                                } else {
                                    if (button.customId === 'join_join') {
                                        await button.deferUpdate();
                                        game.join(button.user);
                                        collector.stop();
                                    } else if (button.customId === 'join_cancel') {
                                        await safeReply(client, 
                                            button,
                                            createErrorEmbed('`⛔ Only the host can cancel the game.`', true)
                                        );
                                    }
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    client.gameManager.destroyLobby(interaction.user);
                                    await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });

                        await safeReply(client, interaction, { embeds: [embedmsg], components: [row] });
                    });

                    // GAME READY TO START
                    lobby.on('ready', async (game: TriviaGame) => {
                        let embedmsg = game.getLobbyMessageEmbed('`Minimum player count reached. The game is ready.`');
                        const row = new MessageActionRow().addComponents([
                            new MessageButton().setCustomId('ready_join').setLabel('Join').setStyle('PRIMARY'),
                            new MessageButton().setCustomId('ready_cancel').setLabel('Cancel Game').setStyle('DANGER'),
                            new MessageButton().setCustomId('ready_start').setLabel('Start Game').setStyle('SUCCESS')
                        ]);
                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.interactionTimeout
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    if (button.customId === 'ready_start') {
                                        game.start();
                                    } else if (button.customId === 'ready_cancel') {
                                        let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                        client.gameManager.destroyLobby(interaction.user);
                                        await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                    } else {
                                        game.join(button.user);
                                    }
                                    collector.stop();
                                } else {
                                    try {
                                        if (button.customId === 'ready_join') {
                                            await button.deferUpdate();
                                            game.join(button.user);
                                            collector.stop();
                                        } else {
                                            await safeReply(client, 
                                                button,
                                                createErrorEmbed(
                                                    '`⛔ Only the host can cancel or start the game.`',
                                                    true
                                                )
                                            );
                                        }
                                    } catch (err: any) {
                                        client.logger.error(err);
                                    }
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (
                                    reason === 'time' &&
                                    (game.state === GameState.Waiting || game.state === GameState.Ready)
                                ) {
                                    let embedmsg = game.getLobbyMessageEmbed('`The game lobby timed out.`');
                                    client.gameManager.destroyLobby(interaction.user);
                                    await safeReply(client, interaction, { embeds: [embedmsg], components: [] });
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });
                        await safeReply(client, interaction, { embeds: [embedmsg], components: [row] });
                    });

                    // GAME START
                    lobby.on('start', async (game: TriviaGame) => {
                        await lobby.getQuestions();
                        lobby.nextRound();
                    });

                    // GAME QUESTION
                    lobby.on('question', async (game: TriviaGame) => {
                        const gameMessage = game.getQuestionMessage();
                        await safeReply(client, interaction, gameMessage);

                        if (game.readQuestions && !game.questionRead) {
                            client.musicManager.say(interaction.guildId!, <GuildMember>interaction.member, game.question!.value, 'en');
                            game.questionRead = true;
                        }

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: game.questionAnswerTime
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (game.answerRequired.includes(button.user)) {
                                    await button.deferUpdate();
                                    game.answerQuestion(button.user, parseInt(button.customId.replace('trivia_', '')));
                                    collector.stop();
                                } else {
                                    try {
                                        if (game.answerGiven.includes(button.user)) {
                                            await safeReply(client, 
                                                button,
                                                createErrorEmbed(
                                                    "`💤 You've already answered. Wait for your opponents.`",
                                                    true
                                                )
                                            );
                                        } else {
                                            await safeReply(client, 
                                                button,
                                                createErrorEmbed("`⛔ These buttons aren't for you.`", true)
                                            );
                                        }
                                    } catch (err: any) {
                                        client.logger.error(err);
                                    }
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time') {
                                    game.displayAnswer();
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });
                    });

                    // GAME ANSWER
                    lobby.on('answer', async (game: TriviaGame) => {
                        const gameMessage = game.getAnswerMessage();
                        await safeReply(client, interaction, gameMessage);

                        const collector = interaction.channel!.createMessageComponentCollector({
                            componentType: 'BUTTON',
                            time: answerDisplayTime
                        });

                        collector.on('collect', async (button) => {
                            try {
                                if (button.user.id === interaction.user.id) {
                                    await button.deferUpdate();
                                    let embedmsg = game.getLobbyMessageEmbed('`The game was canceled.`');
                                    client.gameManager.destroyLobby(interaction.user);
                                    await safeReply(client, interaction, { embeds: [embedmsg], components: [] });

                                    collector.stop();
                                } else {
                                    try {
                                        await safeReply(client, 
                                            button,
                                            createErrorEmbed('`⛔ Only the host can cancel the game.`', true)
                                        );
                                    } catch (err: any) {
                                        client.logger.error(err);
                                    }
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });

                        collector.on('end', async (_: any, reason: string) => {
                            try {
                                if (reason === 'time') {
                                    game.nextRound();
                                }
                            } catch (err: any) {
                                client.logger.error(err);
                            }
                        });
                    });

                    // GAME OVER
                    lobby.on('end', async (game: TriviaGame) => {
                        const gameMessage = game.getGameOverMessage();
                        client.gameManager.destroyLobby(interaction.user);
                        await safeReply(client, interaction, gameMessage);
                    });

                    // open game lobby
                    lobby.open();
                    done();
                } catch (err: any) {
                    await safeReply(client, 
                        interaction,
                        createErrorEmbed('🚩 Error creating a Trivia game: `' + err + '`', true)
                    );
                    error(err);
                }
            }
        })
};

function getCategoryOptions(): APIApplicationCommandOptionChoice<string>[] {
    let options: any[] = [];
    let item: any;
    for (item in CategoryNamesPretty) {
        if (isNaN(item)) {
            options.push({ name: item, value: item });
        }
    }
    return options;
}
