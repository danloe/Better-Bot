import { promisify } from 'node:util';
import { TextBasedChannel, User } from 'discord.js';
import { GameType } from './GameManager';
import { GameLobby } from './GameLobby';

const wait = promisify(setTimeout);
const charField = '🔳';
const charX = '❌';
const charO = '⭕';
const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

export class TTTGame extends GameLobby {
    gameField: string[] = [];
    playerOturn: boolean = false;

    public constructor(host: User, channel: TextBasedChannel) {
        super(GameType.TTT, host, channel, 2, 2);
        this.createGameField();
        this.state = GameState.Waiting;
        this.playerOturn = Math.random() >= 0.5 ? true : false;
    }

    createGameField() {
        this.gameField = [
            charField,
            charField,
            charField,
            charField,
            charField,
            charField,
            charField,
            charField,
            charField
        ];
    }

    placeMark(index: number) {
        this.gameField[index] = this.playerOturn ? charO : charX;
        if (this.checkWin) {
            this.endGame(false);
        } else if (this.isDraw()) {
            this.endGame(true);
        } else {
            this.swapTurns();
        }
    }

    checkWin(): boolean {
        return winningCombinations.some((combination) => {
            return combination.every((index) => {
                return this.gameField[index] === (this.playerOturn ? charO : charX);
            });
        });
    }

    isDraw(): boolean {
        for (let i = 0; i < this.gameField.length; i++) {
            if (this.gameField[i] === charField) return false;
        }
        return true;
    }

    endGame(draw: boolean) {
        this.state = GameState.Finished;
        if (draw) {
        }
    }

    swapTurns() {
        this.playerOturn = !this.playerOturn;
    }
}

export enum GameState {
    Waiting,
    Ready,
    Started,
    Finished
}
