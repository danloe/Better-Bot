import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createErrorEmbed, safeDeferReply, safeReply } from '../../helpers';
import { getGames } from 'epic-free-games';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('epicfree')
        .setDescription('Shows this weeks free games available in the epic store.'),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    if (interaction instanceof ButtonInteraction) return;

                    await safeDeferReply(interaction);

                    const games: any = await getGames('DE', true);
                    if (games) {
                        games.currentGames.forEach(async (game: any) => {
                            if (game.price.lineOffers) {
                                let date = new Date(game.promotions.promotionalOffers[0].promotionalOffers[0].endDate);
                                let endDate = date.toLocaleDateString('de');

                                date = new Date(game.promotions.promotionalOffers[0].promotionalOffers[0].startDate);
                                let startDate = date.toLocaleDateString('de');

                                let image = '';
                                game.keyImages.forEach((element: any) => {
                                    if (element.type === 'OfferImageWide') {
                                        image = element.url;
                                    }
                                });

                                let embedmsg = new MessageEmbed()
                                    .setColor('#0078F2')
                                    .setTitle(game.title)
                                    .setDescription(game.description)
                                    .setImage(image)
                                    .addField('Valid from:', startDate, true)
                                    .addField('Valid until:', endDate, true)
                                    .addField('Original Price:', game.price.totalPrice.fmtPrice.originalPrice, true);

                                await interaction.channel!.send({ content: ' ', embeds: [embedmsg] });
                            }
                            await interaction.editReply({
                                embeds: [
                                    new MessageEmbed()
                                        .setColor('#0078F2')
                                        .setTitle("This week's free games")
                                        .setDescription(
                                            '`The following games are available for free this week in the Epic Games store.`'
                                        )
                                        .setURL('https://store.epicgames.com/de/free-games')
                                ]
                            });
                        });
                    }
                    done();
                } catch (err) {
                    await safeReply(
                        interaction,
                        createErrorEmbed('🚩 Error showing Epic Games Free Games: `' + err + '`')
                    );
                    error(err);
                }
            }
        })
};
