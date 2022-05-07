import BetterClient from '../client';

interface Run {
    (client: BetterClient, ...args: any[]): void;
}

export interface Event {
    name: String;
    run: Run;
}
