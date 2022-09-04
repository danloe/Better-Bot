import { Logger } from '../classes';
import BotterinoClient from '../client';
import { Event } from '../interfaces';

export const event: Event = {
    name: 'unhandledRejection',
    run: async (client: BotterinoClient) => (err: any) => {
        Logger.warn('Unhandled Rejection: ' + err);
        Logger.trace('Unhandled Rejection Trace: ');
    }
};
