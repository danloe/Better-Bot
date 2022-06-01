import BotterinoClient from '../client';
import { Event } from '../interfaces';

export const event: Event = {
    name: 'unhandledRejection',
    run: async (client: BotterinoClient) => (err: any) => {
        client.logger.warn('Unhandled Rejection: ' + err);
        client.logger.trace('Unhandled Rejection Trace: ');
    }
};
