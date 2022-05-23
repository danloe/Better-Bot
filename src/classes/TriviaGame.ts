import {
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessagePayload,
    TextBasedChannel,
    User,
    WebhookEditMessageOptions
} from 'discord.js';
import { GameType } from './GameManager';
import { GameLobby, GameState } from './GameLobby';
import { Category, CategoryData, getQuestions, Question, QuestionDifficulty, QuestionType } from 'open-trivia-db';

/*
  _____ ____  _____     _____    _    
 |_   _|  _ \|_ _\ \   / /_ _|  / \   
   | | | |_) || | \ \ / / | |  / _ \  
   | | |  _ < | |  \ V /  | | / ___ \ 
   |_| |_| \_\___|  \_/  |___/_/   \_\

*/

export const answerDisplayTime: number = 7_000;

export class TriviaGame extends GameLobby {
    amount: number = 10;
    difficulty: QuestionDifficulty | null = null;
    type: QuestionType | null = null;
    category: Category | null = null;
    questions: Question[] = [];
    categoryInfo: CategoryData | undefined;

    round: number = 0;
    question: Question | null = null;
    answers: Map<User, boolean[]> = new Map<User, boolean[]>();
    answerRequired: User[] = [];
    answerGiven: User[] = [];
    questionAnswerTime = 20;
    readQuestions = false;
    questionRead = true;

    public constructor(host: User, channel: TextBasedChannel, minPlayers: number, maxPlayers: number) {
        super(GameType.Trivia, host, channel, minPlayers, maxPlayers);
        this.name = 'Trivia';
        this.thumbnail = 'https://opentdb.com/images/logo-banner.png';
    }

    async getQuestions(): Promise<Question[]> {
        this.questions = await getQuestions({
            amount: this.amount,
            difficulty: this.difficulty,
            type: this.type,
            category: this.category
        });
        return this.questions;
    }

    async getCategoryInfo(): Promise<CategoryData> {
        this.categoryInfo = await this.category!.getData();
        return this.categoryInfo;
    }

    answerQuestion(player: User, index: number) {
        this.answerGiven.push(player);
        this.answerRequired.splice(this.answerRequired.indexOf(player), 1);
        let answers = this.answers.get(player);
        if (!answers) answers = [];
        answers!.push(this.question!.checkAnswer(<string>this.question!.allAnswers[index]));
        this.answers.set(player, answers);

        if (this.answerRequired.length == 0) {
            this.displayAnswer();
        } else {
            this.emit('question', this);
        }
    }

    displayAnswer() {
        this.emit('answer', this);
    }

    nextRound() {
        if (this.round < this.amount) {
            this.round++;
            this.question = this.questions[this.round - 1];
            this.answerRequired = this.players.slice();
            this.answerGiven = [];
            this.questionRead = false;
            this.emit('question', this);
        } else {
            this.state = GameState.Finished;
            this.emit('end', this);
        }
    }

    getLobbyMessageEmbed(message: string) {
        let players = '';
        this.players.forEach((player) => {
            players = players + '<@' + player.id + '> ';
        });
        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle('Trivia')
            .setDescription(message)
            .setThumbnail(this.thumbnail);

        embedmsg.addField('Questions:', String(this.amount), true);
        if (this.category) {
            let questionCount: string;
            if (this.difficulty) {
                switch (this.difficulty) {
                    case 'easy':
                        questionCount = String(this.categoryInfo!.questionCounts.forEasy);
                        break;
                    case 'medium':
                        questionCount = String(this.categoryInfo!.questionCounts.forMedium);
                        break;
                    case 'hard':
                        questionCount = String(this.categoryInfo!.questionCounts.forHard);
                        break;
                }
            } else {
                questionCount = String(this.categoryInfo!.questionCounts.total);
            }
            embedmsg.addField('Question Pool:', questionCount, true);
        }
        if (this.difficulty) embedmsg.addField('Difficulty:', this.difficulty, true);
        if (this.type) embedmsg.addField('Type:', this.type, true);
        if (this.category) embedmsg.addField('Category:', this.category.prettyName, true);
        embedmsg.addField(
            `Players: ${this.players.length} of ${this.maxPlayers} [min ${this.minPlayers}]`,
            players,
            false
        );
        return embedmsg;
    }

    getQuestionMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let requiredPlayers = '❔ ';
        let answeredPlayers = '❕ ';
        this.answerRequired.forEach((player) => {
            requiredPlayers = requiredPlayers + '<@' + player.id + '> ';
        });
        this.answerGiven.forEach((player) => {
            answeredPlayers = answeredPlayers + '<@' + player.id + '> ';
        });

        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle('Trivia')
            .setDescription('Question: `' + this.question!.value + '`')
            .addField('Category:', this.question!.category, true)
            .addField('Difficulty:', this.question!.difficulty, true)
            .addField('Time:', String(this.questionAnswerTime / 1000) + ' seconds', true)
            .addField('Answer awaited:', requiredPlayers, false)
            .addField('Answer given:', answeredPlayers, false);

        let components: MessageButton[] = [];
        for (let i = 0; i < this.question!.allAnswers!.length!; i++) {
            components.push(
                new MessageButton()
                    .setCustomId('trivia_' + String(i))
                    .setLabel(<string>this.question!.allAnswers[i])
                    .setStyle('PRIMARY')
            );
        }
        let row = new MessageActionRow().addComponents([...components]);
        return {
            content: ' ',
            embeds: [embedmsg],
            components: [row]
        };
    }

    getAnswerMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle('Trivia')
            .setDescription(
                'Question: `' + this.question!.value + '`\n' + 'Answer: `' + this.question!.correctAnswer + '`'
            );
        const row = new MessageActionRow().addComponents([
            new MessageButton().setCustomId('answer_cancel').setLabel('Cancel Game').setStyle('DANGER')
        ]);
        return {
            content: ' ',
            embeds: [embedmsg],
            components: [row]
        };
    }

    getGameOverMessage(): string | MessagePayload | WebhookEditMessageOptions {
        let stats = new Map<User, number>();
        let winners = '';
        let sortedStats: Map<User, number>;

        if (this.answers.size > 0) {
            for (let [key, value] of this.answers) {
                let score = 0;
                value.forEach((answer) => {
                    score = score + Number(answer);
                });
                stats.set(key, score);
            }
            sortedStats = new Map([...stats.entries()].sort((a, b) => b[1] - a[1]));

            winners = '🎉 <@' + String([...sortedStats][0][0].id) + '> ';
            let one = true;
            for (let [key, value] of sortedStats) {
                if (key.id !== [...sortedStats][0][0].id) {
                    if (value == [...sortedStats][0][1]) {
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
            winners = 'No one has played. Everyone is a loser!';
        }

        let embedmsg = new MessageEmbed()
            .setColor('#403075')
            .setTitle('Trivia')
            .setDescription(winners)
            .setThumbnail(this.thumbnail);

        if (this.answers.size > 0) {
            let i = 1;
            for (let [key, value] of sortedStats!) {
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
