import { Command, Event } from '../interfaces';
import BotterinoClient from '../client';
import { getSoundboardSuggestions, getYouTubeSuggestions } from '../helpers/autocomplete';
import { Logger } from '../classes';

export const event: Event = {
    name: 'interactionCreate',
    run: async (client: BotterinoClient, interaction: any) => {
        // COMMAND
        if (interaction.isCommand()) {
            Logger.info(`${interaction.user.tag} triggered an interaction [${interaction.commandName}]`);

            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await (command as Command).run(client, interaction);
            } catch (error: any) {
                Logger.error(error);
                console.log(error);
            }

            // AUTO COMPLETE
        } else if (interaction.isAutocomplete()) {
            try {
                if (interaction.commandName === 'play') {
                    const focusedOption = interaction.options.getFocused(true);

                    if (focusedOption.name === 'input') {
                        if (
                            !(String(focusedOption.value).trim() === '') &&
                            !String(focusedOption.value).startsWith('http')
                        ) {
                            Logger.info(
                                `${interaction.user.tag} triggered an autocomplete [${interaction.commandName}: ${focusedOption.value}]`
                            );
                            let choices: any;
                            let response: any = [];
                            choices = await getYouTubeSuggestions(focusedOption.value);
                            choices.forEach((choice: string) => {
                                response.push({ name: choice, value: choice });
                            });
                            await interaction.respond(response);
                        } else if (String(focusedOption.value).trim() === '') {
                            // Nothing entered, suggest YouTube generated lists
                            let response: any = [];
                            client.config.music.youTubeGeneratedLists?.forEach(({ name, id }) => {
                                response.push({ name: name, value: 'https://youtube.com/playlist?list=' + id });
                            });
                            await interaction.respond(response);
                        }
                    }
                } else if (interaction.commandName === 'soundboard') {
                    const focusedOption = interaction.options.getFocused(true);
                    if (focusedOption.name === 'input') {
                        let choices: any;
                        let response: any = [];
                        choices = getSoundboardSuggestions(focusedOption.value);
                        choices.forEach((choice: string) => {
                            response.push({ name: choice, value: choice });
                        });
                        await interaction.respond(response);
                    }
                }
            } catch (error: any) {
                Logger.error(error);
            }
        }

        // BUTTON
        else if (interaction.isButton()) {
            try {
            } catch (error: any) {
                Logger.error(error);
            }
        }

        // SELECT MENU
        else if (interaction.isSelectMenu()) {
            try {
            } catch (error: any) {
                Logger.error(error);
            }
        } else {
            return;
        }
    }
};
