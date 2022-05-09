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

/* MODAL EXAMPLE
} else {
                //open modal
                const modal = new Modal()
                    .setCustomId('modal-play')
                    .setTitle('Play or queue media.')
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId('input')
                            .setLabel('YouTube 🔗/🔎  |  SoundCloud/Newgrounds 🔗')
                            .setStyle('SHORT')
                            .setPlaceholder('URL or Search Text...')
                            .setRequired(true)
                    );

                showModal(modal, {
                    client: interaction.client,
                    interaction: interaction
                });
            }
        }
        */