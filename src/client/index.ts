import { Client, Collection } from "discord.js";
import { connect } from "mongoose";
import path from "path";
import { readdirSync } from "fs";
import { Command, Config, Event } from "../interfaces";
import ConfigJson from "../config.json";
import discordModals from "discord-modals";

class ExtendedClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public aliases: Collection<string, Command> = new Collection();
  public events: Collection<string, Event> = new Collection();
  public config: Config = ConfigJson;

  public async init() {
    discordModals(this);
    this.login(process.env.BOT_TOKEN);
    //connect(process.env.MONGO_URI);

    // Commands
    const commandPath = path.join(__dirname, "..", "commands");
    readdirSync(commandPath).forEach((dir) => {
      const commands = readdirSync(`${commandPath}\\${dir}`).filter((file) =>
        file.endsWith(".ts")
      );

      for (const file of commands) {
        const { command } = require(`${commandPath}\\${dir}\\${file}`);
        this.commands.set(command.data.name, command);
        if (command?.aliases?.length) {
          command.aliases.forEach((alias: string) => {
            this.aliases.set(alias, command);
          });
        }
      }
    });

    // Events
    const eventPath = path.join(__dirname, "..", "events");
    readdirSync(eventPath).forEach(async (file) => {
      const { event } = await import(`${eventPath}/${file}`);
      this.events.set(event.name, event);
      //console.log(event);
      this.on(event.name, event.run.bind(null, this));
    });
  }
}

export default ExtendedClient;
