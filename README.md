[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

# Botterino

A discord bot, better than my last one. This time in Typescript.

<br />
<div align="center">
  <a href="https://unsplash.com/photos/N2zxMUDwT4I">
    <img src="https://unsplash.com/photos/N2zxMUDwT4I/download?ixid=MnwxMjA3fDB8MXxhbGx8N3x8fHx8fDJ8fDE2NTMyNzQzOTk&force=true&w=640" alt="Logo" width="300" height="300">
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
  * Says any text given in multiple languages
  * Announces music tracks
  * Reads questions in trivia games
* Multiplayer Games
  * TicTacToe
  * Four Wins
  * Trivia
* Admin Commands
  * Delete Messages
* Fun Commands
  * Roast
  * Epic Free Games
  * Decide
  * Coin Flip

## Getting Started

Follow these steps to get the bot up and running.

### Prerequisites

You must have node.js installed with the latest node package manager.
* [nodejs](https://nodejs.org/) v16.15
* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Download or clone this repo
2. Open the `.env` file in the root directory
3. Replace `YOURTOKEN` with your [Discord Bot Token](https://discord.com/developers/applications):

```sh
BOT_TOKEN="YOURTOKEN"
```

4. Open a terminal in the repo folder
5. Install the required node_modules:

```sh
npm install
```

## Usage

### Run the bot

Run the `start.bat` file to start the bot in a terminal

**or**

run the following command in a terminal:
```sh
npm run start
```

### Deploy guild slash commands

Guild slash commands are only available in the guild deployed to.
Send a message in a guild text channel.

Deploy slash commands:
```
>deploy
```
Delete slash commands:
```
>clearcommands
```

### Deploy application slash commands

Application slash commands are available in all guilds.

Run the following command in a terminal:
```sh
npm run deploy
```

## TODOs

- [x] Add Readme
- [x] Add autocomplete functionality
- [ ] **Add music player controls as embed message**
- [ ] Add more games
    - [x] Trivia
    - [ ] ?  
- [ ] Add platform support for music playback
    - [x] YouTube
    - [x] SoundCloud
    - [x] Newgrounds
    - [ ] Instagram
    - [ ] TikTok

## Contributing
Suggestions for extensions or improvements are welcome.

Pull requests are also welcome. For major changes, please open an issue first to discuss what you would like to change.

[issues-shield]: https://img.shields.io/github/issues/danloe/Botterino.svg?style=for-the-badge
[issues-url]: https://github.com/danloe/Botterino/issues
[license-shield]: https://img.shields.io/github/license/danloe/Botterino.svg?style=for-the-badge
[license-url]: https://github.com/danloe/Botterino/blob/master/LICENSE
[product-screenshot]: https://unsplash.com/photos/N2zxMUDwT4I
