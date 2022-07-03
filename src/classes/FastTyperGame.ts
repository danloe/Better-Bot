import { MessageEmbed, MessagePayload, TextBasedChannel, User, WebhookEditMessageOptions } from 'discord.js';
import { GameType } from './GameManager';
import { GameLobby, GameState } from './GameLobby';
import BotterinoClient from '../client';
import fs from 'fs';
import path from 'path';

/*
    ______           __     ______                     
   / ____/___ ______/ /_   /_  __/_  ______  ___  _____
  / /_  / __ `/ ___/ __/    / / / / / / __ \/ _ \/ ___/
 / __/ / /_/ (__  ) /_     / / / /_/ / /_/ /  __/ /    
/_/    \__,_/____/\__/    /_/  \__, / .___/\___/_/     
                              /____/_/                 
*/

export class FastTyperGame extends GameLobby {
    rounds: number = 10;
    tries: number = 1;
    typingTime = 10;
    answerDisplayTime = 7_000;

    round: number = 0;
    words: string[] = this.getRandomWords();
    currentWord!: string;
    score: Map<User, number> = new Map<User, number>();
    answerTries: Map<User, number> = new Map<User, number>();
    answerGiven: User[] = [];
    answeredCorrectly: User | null = null;

    public constructor(client: BotterinoClient, host: User, channel: TextBasedChannel, maxPlayers: number) {
        super(client, GameType.FastTyper, host, channel, 1, maxPlayers);
        this.currentWord = this.words[0];
        this.name = 'Fast Typer';
        this.thumbnail = client.config.games.fastTyper_thumbnail;
    }

    answer(player: User, answer: string) {
        if (this.answeredCorrectly) {
            return;
        }
        let tries = this.answerTries.get(player);
        if (tries && tries > 0) {
            if (answer == this.currentWord) {
                this.answeredCorrectly = player;
                let playerScore = this.score.get(player);
                if (playerScore) {
                    playerScore += this.currentWord.length;
                } else {
                    playerScore = this.currentWord.length;
                }
                this.score.set(player, playerScore);
                this.displayAnswer();
                return;
            } else {
                tries!--;
                if (tries <= 0) {
                    this.answerTries.delete(player);
                    this.answerGiven.push(player);
                } else {
                    this.answerTries.set(player, tries!);
                }

                if (this.answerTries.size == 0) {
                    this.displayAnswer();
                } else {
                    this.displayType();
                }
            }
        }
    }

    displayAnswer() {
        this.emit('answer', this);
    }

    displayType() {
        this.emit('type', this);
    }

    displayGameOver() {
        this.emit('end', this);
    }

    nextRound() {
        if (this.round < this.rounds) {
            this.round++;
            this.currentWord = this.words[this.round - 1];
            this.players.forEach((player) => {
                this.answerTries.set(player, this.tries);
            });
            this.answerGiven = [];
            this.answeredCorrectly = null;
            this.displayType();
        } else {
            this.state = GameState.Finished;
            this.displayGameOver();
        }
    }

    getRandomWords(): string[] {
        // open text file, read it, save it to an array
        let words = fs
            .readFileSync(path.resolve(__dirname, '../commands/games/resources/words.txt'), 'utf8')
            .replace(/\r?\n|\r/g, ' ')
            .split(' ');

        // get random words from the array, limited by the number of rounds
        let randomWords = [];
        for (let i = 0; i < this.rounds; i++) {
            randomWords.push(words[Math.floor(Math.random() * words.length)]);
        }
        return randomWords;
    }

    getLobbyMessageEmbed(message: string) {
        let players = '';
        this.players.forEach((player) => {
            players = players + '<@' + player.id + '> ';
        });
        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle(this.name)
            .setDescription(message)
            .setThumbnail(this.thumbnail);

        embedmsg.addField('Rounds:', String(this.rounds), true);
        if (this.tries) embedmsg.addField('Tries:', String(this.tries), true);
        if (this.typingTime) embedmsg.addField('Time:', String(this.typingTime / 1000) + ' seconds', true);
        embedmsg.addField(
            `Players: ${this.players.length} of ${this.maxPlayers} [min ${this.minPlayers}]`,
            players,
            false
        );
        return embedmsg;
    }

    getTypeMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let requiredPlayers = '⌨️ ';
        let answeredPlayers = '🐘 ';
        this.answerTries.forEach((_tries, player, _map) => {
            requiredPlayers = requiredPlayers + '<@' + player.id + '> ';
        });
        this.answerGiven.forEach((player) => {
            answeredPlayers = answeredPlayers + '<@' + player.id + '> ';
        });

        let embedmsg = new MessageEmbed()
            .setColor('#DDD620')
            .setTitle(this.name)
            .setDescription('Current Word: ' + this.currentWord)
            .addField('Round:', String(this.round) + ' of ' + String(this.rounds), true)
            .addField('Time:', String(this.typingTime / 1000) + ' seconds', true)
            .addField('Answer awaited:', requiredPlayers, false)
            .addField('No more tries:', answeredPlayers, false);

        return {
            content: ' ',
            embeds: [embedmsg],
            components: []
        };
    }

    getAnswerMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let correctUserString = '';
        if (this.answeredCorrectly) {
            correctUserString = '<@' + this.answeredCorrectly.id + '> 1️⃣🆙';
        } else {
            correctUserString = '`No one has answered correctly!`';
        }

        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle(this.name)
            .setDescription('Word: ' + this.currentWord)
            .addField('Round:', String(this.round) + ' of ' + String(this.rounds), true)
            .addField('Fastest User', correctUserString, false);

        return {
            content: ' ',
            embeds: [embedmsg],
            components: []
        };
    }

    getGameOverMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let winners = '';
        let sortedScores: Map<User, number>;

        if (this.score.size > 0) {
            sortedScores = new Map([...this.score.entries()].sort((a, b) => b[1] - a[1]));

            winners = '🎉 <@' + String([...sortedScores][0][0].id) + '> ';
            let one = true;
            for (let [key, value] of sortedScores) {
                if (key.id !== [...sortedScores][0][0].id) {
                    if (value == [...sortedScores][0][1]) {
                        one = false;
                        winners = winners + '& <@' + String(key.id) + '> ';
                    }
                }
            }
            if (one) {
                winners = winners + 'has won the game!';
            } else {
                winners = winners + 'have won the game!';
            }
        } else {
            winners = 'Nobody scored. Everyone is a loser!';
        }

        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle(this.name)
            .setDescription(winners)
            .setThumbnail(this.thumbnail);

        if (this.score.size > 0) {
            let i = 1;
            for (let [key, value] of sortedScores!) {
                embedmsg.addField(
                    String(i) + '.',
                    '<@' + key.id + '>: ' + String(value) + (value == 1 ? ' Point' : ' Points')
                );
                i++;
            }
        }

        return {
            content: ' ',
            embeds: [embedmsg],
            components: []
        };
    }
}
