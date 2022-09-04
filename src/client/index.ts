import { Client, Collection } from 'discord.js';
import path from 'path';
import { readdirSync } from 'fs';
import { Command, Config, Event } from '../interfaces';
import ConfigJson from '../config.json';
import { MusicManager } from '../classes/MusicManager';
import { GameManager } from '../classes/GameManager';
import { Logger } from '../classes';

class BotterinoClient extends Client {
    public commands: Collection<string, Command> = new Collection();
    public events: Collection<string, Event> = new Collection();
    public config: Config = ConfigJson;
    public musicManager: MusicManager = new MusicManager(this);
    public gameManager: GameManager = new GameManager(this);
    public SpotifyAuthorization: string = '';
    public SpotifyAuthorizationTimeout: Date = new Date();

    public async init() {
        this.login(process.env.BOT_TOKEN);
        //connect(process.env.MONGODB_URI);

        // config to global
        global.config = this.config;

        // Commands
        const commandPath = path.join(__dirname, '..', 'commands');
        readdirSync(commandPath).forEach((dir) => {
            const commands = readdirSync(`${commandPath}/${dir}`).filter((file) => file.endsWith('.ts'));

            for (const file of commands) {
                const { command } = require(`${commandPath}/${dir}/${file}`);
                this.commands.set(command.data.name, command);
            }
        });

        // Events
        const eventPath = path.join(__dirname, '..', 'events');
        readdirSync(eventPath).forEach(async (file) => {
            const { event } = await import(`${eventPath}/${file}`);
            this.events.set(event.name, event);
            this.on(event.name, event.run.bind(null, this));
        });
    }
}

export default BotterinoClient;
