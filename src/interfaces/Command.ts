import { CommandInteraction, Message } from 'discord.js';
import BetterClient from '../client';

interface Run {
    (client: BetterClient, interaction?: CommandInteraction, message?: Message, args?: string[]): void;
}

export interface Command {
    data: any;
    run: Run;
}
