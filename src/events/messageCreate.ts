import { Command, Event } from '../interfaces';
import { Message } from 'discord.js';
import BetterClient from '../client';
import { readdirSync } from 'fs';
import path from 'path';

export const event: Event = {
    name: 'messageCreate',
    run: async (client: BetterClient, message: Message) => {
        if (message.author.bot || !message.content.startsWith(client.config.prefix)) return;

        const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);

        const cmd = args.shift()?.toLowerCase();
        if (!cmd) return;

        if (cmd === 'deploy' && message.author.id === '98468190362828800') {
            await setCommands(message);
            return;
        }

        if (cmd === 'clearcommands' && message.author.id === '98468190362828800') {
            await clearCommands(message);
            return;
        }

        const command = client.commands.get(cmd);
        if (command) {
            console.log(
                `${message.author.username} triggered an interaction. [${command.data.name}]`
            );
            (command as Command).run(client, undefined, message, args);
        }
    }
};

async function setCommands(message: Message) {
    const commands: any[] = [];
    const commandPath = path.join(__dirname, '..', 'commands');
    readdirSync(commandPath).forEach((dir) => {
        const dirs = readdirSync(`${commandPath}\\${dir}`).filter((file) => file.endsWith('.ts'));
        for (const file of dirs) {
            const { command } = require(`${commandPath}\\${dir}\\${file}`);
            commands.push(command.data.toJSON());
        }
    });
    console.log(commands);
    await message.guild!.commands.set(commands);
    await message.reply('Commands deployed to guild.');
}

async function clearCommands(message: Message) {
    await message.guild!.commands.set([]);
    await message.reply('Commands cleared from guild.');
}
