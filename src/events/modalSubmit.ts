import { Event } from '../interfaces';
import { ModalSubmitInteraction } from 'discord-modals';
import { Formatters } from 'discord.js';
import BetterClient from '../client';

export const event: Event = {
    name: 'modalSubmit',
    run: async (client: BetterClient, modal: ModalSubmitInteraction) => {
        if (modal.customId === 'modal-play') {
            const input = modal.getTextInputValue('input');
            //play input
            modal.reply(Formatters.codeBlock('markdown', input));
        }
    }
};
