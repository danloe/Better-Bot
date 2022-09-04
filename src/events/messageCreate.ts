import { Command, Event } from '../interfaces';
import { Message } from 'discord.js';
import BotterinoClient from '../client';
import { readdirSync } from 'fs';
import path from 'path';
import { Logger } from '../classes';

export const event: Event = {
    name: 'messageCreate',
    run: async (client: BotterinoClient, message: Message) => {
        if (message.author.bot || !message.content.startsWith(client.config.general.prefix)) return;

        const args = message.content.slice(client.config.general.prefix.length).trim().split(/ +/g);

        const cmd = args.shift()?.toLowerCase();
        if (!cmd) return;

        if (cmd === 'deploy' && message.author.id === client.config.general.hostUserId) {
            await setCommands(message);
            return;
        }

        if (cmd === 'clearcommands' && message.author.id === client.config.general.hostUserId) {
            await clearCommands(message);
            return;
        }

        const command = client.commands.get(cmd);
        if (command) {
            Logger.info(`${message.author.username} triggered an interaction. [${command.data.name}]`);
            (command as Command).run(client, undefined, message, args);
        }
    }
};

async function setCommands(message: Message) {
    const commands: any[] = [];
    const commandPath = path.join(__dirname, '..', 'commands');
    let passed = true;
    readdirSync(commandPath).forEach((dir) => {
        const dirs = readdirSync(`${commandPath}/${dir}`).filter((file) => file.endsWith('.ts'));
        // const regex = RegExp(/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/gu);
        for (const file of dirs) {
            const { command } = require(`${commandPath}/${dir}/${file}`);
            // if (!regex.test(command.data.name)) {
            //     Logger.info(command.data.name + ' failed the regex check.');
            //     passed = false;
            // }
            commands.push(command.data.toJSON());
        }
    });
    if (passed) {
        await message.reply('`🔺 Commands deployed to guild.`');
    } else {
        await message.reply('`🔺 Some commands failed the regex check. Commands may not be deployed.`');
    }
    await message.guild!.commands.set(commands);
}

async function clearCommands(message: Message) {
    await message.guild!.commands.set([]);
    await message.reply('`🔺 Commands cleared from guild.`');
}
