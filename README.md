<div align="center">
  
  <a href="">[![Issues][issues-shield]][issues-url]
  <a href="">[![Typescript][typescript-shield]][typescript-url]
  <a href="">[![DiscordJS][discordjs-shield]][discordjs-url]
  <a href="">[![MIT License][license-shield]][license-url]
    
</div>

# Botterino

<div align="center">
  <br />
  <a href="https://unsplash.com/photos/N2zxMUDwT4I">
    <img src="https://images.weserv.nl/?url=https://unsplash.com/photos/N2zxMUDwT4I/download?ixid=MnwxMjA3fDB8MXxhbGx8N3x8fHx8fDJ8fDE2NTMyNzQzOTk&force=true&w=640?v=4&fit=cover&mask=circle&maxage=7d" alt="Botterino Photo" width="250" height="250">
  </a>
</div>
    
## Features

* Slash commands
* Music
  * YouTube
  * SoundCloud
  * Newgrounds
  * Direct Link To File
* Autocomplete
  * YouTube search suggestions
* TTS over voice connection
  * Says any text, multiple languages supported
  * Announces music tracks
  * Reads questions in Trivia games
* Multiplayer Games
  * TicTacToe
  * Four Wins
  * Trivia
* Administrator Role Commands
  * Delete Messages
* General & Fun Commands
  * Epic Free Games
  * Roast
  * Decide
  * Coin Flip

## Getting Started

Follow these steps to get the bot up and running.

### Prerequisites

* [nodejs](https://nodejs.org/) *v16.15 or higher*
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Clone or download this repo
3. Install the required node_modules:
>Run the following command in a terminal in the repo folder:
```sh
npm install
```
4. Create a file named `.env` in the root directory
5. Add the following line and replace `YOURTOKEN` with your [Discord Bot Token](https://discord.com/developers/applications):
```sh
BOT_TOKEN="YOURTOKEN"
```
6. Add the bot to your server via the `OAuth2` - `URL Generator`. Select `bot` as scope and insert the permissions integer in the `GENERATED URL`.
>Minimum required permissions integer:
```
294242221120
```

## Usage

### Run the bot

Run the `start.bat` file to start the bot in a terminal

**or**

>run the following command in a terminal:
```sh
npm run start
```
>For development:
```sh
npm run dev
```

### Deploy guild slash commands

Guild slash commands are only available in the guild in which they were deployed, but are available immediately.

Send the following messages in a guild text channel.

>Deploy slash commands to guild:
```
>deploy
```
>Delete slash commands from guild:
```
>clearcommands
```

### Deploy application slash commands

Application slash commands are available in all guilds. It may take some time until the commands are available.

>Run the following command in a terminal:
```sh
npm run deploy
```

## TODOs

See all TODOs in the [Project](https://github.com/users/danloe/projects/1)

## Contributing
Suggestions for extensions or improvements are welcome.

Pull requests are also welcome. For major changes, please open an issue first to discuss what you would like to change.

[issues-shield]: https://img.shields.io/github/issues/danloe/Botterino.svg?style=for-the-badge
[issues-url]: https://github.com/danloe/Botterino/issues
[typescript-shield]: https://img.shields.io/github/package-json/dependency-version/danloe/botterino/dev/typescript?style=for-the-badge
[typescript-url]: https://www.npmjs.com/package/typescript
[discordjs-shield]: https://img.shields.io/github/package-json/dependency-version/danloe/botterino/discord.js?style=for-the-badge
[discordjs-url]: https://github.com/discordjs/discord.js
[license-shield]: https://img.shields.io/github/license/danloe/Botterino.svg?style=for-the-badge
[license-url]: https://github.com/danloe/Botterino/blob/master/LICENSE.md
