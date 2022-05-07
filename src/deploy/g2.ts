import { readdirSync } from 'node:fs';
import path from 'path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import dotenv from 'dotenv';
dotenv.config();

const commands: any[] = [];
const commandPath = path.join(__dirname, '..', 'commands');
readdirSync(commandPath).forEach((dir) => {
    const dirs = readdirSync(`${commandPath}\\${dir}`).filter((file) => file.endsWith('.ts'));
    for (const file of dirs) {
        const { command } = require(`${commandPath}\\${dir}\\${file}`);

        const regex = new RegExp('^[-_p{L}p{N}p{sc=Deva}p{sc=Thai}]{1,32}$');
        if (!regex.test(command.data.name)) {
            console.log('Command failed regex check:', command);
            //continue;
        }
        commands.push(command.data.toJSON());
    }
});

console.log('🚀 ~ file: g2.ts ~ line 31 ~ commands', commands);

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN as string);

rest.put(
    Routes.applicationGuildCommands(
        process.env.CLIENT_ID as string,
        process.env.GUILD2_ID as string
    ),
    { body: commands }
)
    .then(() => console.log('Successfully registered guild commands.'))
    .catch(console.error);
