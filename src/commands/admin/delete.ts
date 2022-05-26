import { Command } from '../../interfaces';
import { ButtonInteraction, CommandInteraction, GuildMember, Message, TextChannel } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import BetterClient from '../../client';
import { createEmbed, createErrorEmbed, safeReply } from '../../helpers';

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Delete messages in a channel.')
        .addIntegerOption((option) =>
            option
                .setName('amount')
                .setDescription('Number of messages to delete?')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(99)
        )
        .addUserOption((option) =>
            option.setName('user').setDescription('Delete messages from a specific user only?').setRequired(false)
        ),
    run: (
        client: BetterClient,
        interaction?: CommandInteraction | ButtonInteraction,
        message?: Message,
        args?: string[]
    ) =>
        new Promise<void>(async (done, error) => {
            if (interaction) {
                try {
                    const member = interaction.member as GuildMember;
                    if (member.permissions.has('ADMINISTRATOR')) {
                        const channel = interaction.channel as TextChannel;
                        const amount =
                            interaction instanceof CommandInteraction ? interaction.options.getInteger('amount') : 1;
                        const user =
                            interaction instanceof CommandInteraction ? interaction.options.getUser('user') : undefined;
                        if (user) {
                            // User given
                            const messages = await channel.messages.fetch();
                            const userMessages = messages.filter(
                                function (m) {
                                    if (this.count < amount! && m.author.id == user.id) {
                                        this.count++;
                                        return true;
                                    }
                                    return false;
                                },
                                { count: 0 }
                            );
                            const bulk = await channel.bulkDelete(userMessages, true);
                            await safeReply(
                                interaction,
                                createEmbed(
                                    ' ',
                                    '`🚮 Deleted ' +
                                        bulk.size +
                                        ' messages by` ' +
                                        `${user}` +
                                        (bulk.size < amount!
                                            ? '\n`⚠️ Messages older than 14 days cannot be bulk deleted.`'
                                            : '`'),
                                    true
                                )
                            );
                        } else {
                            // No User given
                            const bulk = await channel.bulkDelete(amount!, true);
                            await safeReply(
                                interaction,
                                createEmbed(
                                    ' ',
                                    '`🚮 Deleted ' +
                                        bulk.size +
                                        ' messages.' +
                                        (bulk.size < amount!
                                            ? '\n⚠️ Messages older than 14 days cannot be bulk deleted.`'
                                            : '`'),
                                    true
                                )
                            );
                        }
                    } else {
                        // No permission
                        await safeReply(
                            interaction,
                            createEmbed(' ', '`⛔ You do not have access permission for this command!`', true)
                        );
                    }
                    done();
                } catch (err) {
                    await safeReply(interaction, createErrorEmbed('🚩 Error deleting messages: `' + err + '`', true));
                    error(err);
                }
            }
        })
};
