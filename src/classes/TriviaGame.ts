import { TextBasedChannel, User } from 'discord.js';
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

export const questionAnswerTimeout: number = 20_000;
export const answerDisplayTime: number = 5_000;

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

    public constructor(host: User, channel: TextBasedChannel, minPlayers: number, maxPlayers: number) {
        super(GameType.Trivia, host, channel, minPlayers, maxPlayers);
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
            this.emit('question', this);
        } else {
            this.state = GameState.Finished;
            this.emit('end', this);
        }
    }
}
