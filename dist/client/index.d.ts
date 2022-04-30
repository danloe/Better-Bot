import { Client, Collection } from "discord.js";
import { Command, Config, Event } from "../interfaces";
declare class ExtendedClient extends Client {
    commands: Collection<string, Command>;
    aliases: Collection<string, Command>;
    events: Collection<string, Event>;
    config: Config;
    init(): Promise<void>;
}
export default ExtendedClient;
