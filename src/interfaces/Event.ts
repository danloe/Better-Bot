import BotterinoClient from '../client';

interface Run {
    (client: BotterinoClient, ...args: any[]): void;
}

export interface Event {
    name: String;
    run: Run;
}
