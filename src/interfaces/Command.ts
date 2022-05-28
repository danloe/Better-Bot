import { ButtonInteraction, CommandInteraction, Message } from 'discord.js';
import BotterinoClient from '../client';

interface Run {
    (client: BotterinoClient, interaction?: CommandInteraction | ButtonInteraction, message?: Message, args?: string[]): Promise<void>;
}

export interface Command {
    data: any;
    run: Run;
}
