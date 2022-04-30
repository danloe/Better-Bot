import { readdirSync } from "node:fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import dotenv from "dotenv";
dotenv.config();

const commands: any[] = [];
const commandPath = path.join(__dirname, "..", "commands");
readdirSync(commandPath).forEach((dir) => {
  const dirs = readdirSync(`${commandPath}\\${dir}`).filter((file) =>
    file.endsWith(".ts")
  );
  for (const file of dirs) {
    const { command } = require(`${commandPath}\\${dir}\\${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: "9" }).setToken(
    process.env.BOT_TOKEN as string
  );

  rest
    .put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID as string,
        process.env.GUILD1_ID as string
      ),
      { body: commands }
    )
    .then(() => console.log("Successfully registered guild commands."))
    .catch(console.error);
});
