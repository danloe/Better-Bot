<!-- markdownlint-disable-file MD033 -->
<!-- markdownlint-disable-file MD041 -->

<div id="top"></div>

<div align="center">

  <a href="">[![Release][release-shield]][release-url]
  <a href="">[![Issues][issues-shield]][issues-url]
  <a href="">[![Typescript][typescript-shield]][typescript-url]
  <a href="">[![DiscordJS][discordjs-shield]][discordjs-url]
  <a href="">[![MIT License][license-shield]][license-url]

</div>

<div align="center">
  <br />
  <a href="https://unsplash.com/photos/N2zxMUDwT4I">
    <img src="https://images.weserv.nl/?url=https://unsplash.com/photos/N2zxMUDwT4I/download?ixid=MnwxMjA3fDB8MXxhbGx8N3x8fHx8fDJ8fDE2NTMyNzQzOTk&force=true&w=640?v=4&fit=cover&mask=circle&maxage=7d&con=-15&mod=1.2" alt="Botterino Photo" width="250" height="250">
  </a>
  <p align="center">
    <h3 align="center">« Botterino »</h3>
    A discord bot for music, games and more...
    <br />
    <br />
    <a href="https://github.com/danloe/Botterino/issues">Report Bug</a>
    :small_red_triangle:
    <a href="https://github.com/danloe/Botterino/issues">Request Feature</a>
    :small_red_triangle:
    <a href="https://github.com/users/danloe/projects/1">View Project</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#features">Features</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
      <ul>
        <li><a href="#run-the-bot">Run the bot</a></li>
        <li><a href="#deploy-guild-slash-commands">Deploy guild slash commands</a></li>
        <li><a href="#deploy-application-slash-commands">Deploy application slash commands</a></li>
      </ul>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
  </ol>
</details>

## Features

- Slash commands
- Music
  - YouTube
    - Search
    - Video & Playlist URL
    - YouTube generated playlists
  - SoundCloud
  - Newgrounds
  - Spotify Tracks, Albums & Playlists
  - Direct Link To File
- Autocomplete
  - YouTube search suggestions
- TTS over voice connection
  - Says any text :gb: :de: :netherlands: :fr: :es:
  - Announces music tracks
  - Reads questions in Trivia games
- Multiplayer Games
  - Tic Tac Toe
  - Four Wins
  - Trivia
  - Find The Emoji
- Administrator Role Commands
  - Delete Messages
- General & Fun Commands
  - Epic Free Games
  - Roast
  - Decide
  - Coin Flip

<details>
  <summary>Screenshots</summary>
      <table style="width: 250px;"  cellpadding="2">
        <tbody>
          <tr>
          <td><img src="http://fayyn.bplaced.net/botterino/youtube.jpg" maxwidth alt="Botterino YouTube"></td>
          <td><img src="http://fayyn.bplaced.net/botterino/trivia.jpg" maxwidth alt="Botterino Trivia"></td>
          </tr>
          <tr>
          <td><img src="http://fayyn.bplaced.net/botterino/playlist.jpg" maxwidth alt="Botterino Playlist">
            <img src="http://fayyn.bplaced.net/botterino/soundcloud.jpg" maxwidth alt="Botterino SoundCloud"></td>
          <td><img src="http://fayyn.bplaced.net/botterino/queue.jpg" maxwidth alt="Botterino Queue"></td>
          </tr>
          <tr>
          <td><img src="http://fayyn.bplaced.net/botterino/challenge.jpg" maxwidth alt="Botterino Challenge"></td>
          <td><img src="http://fayyn.bplaced.net/botterino/fw.jpg" maxwidth alt="Botterino FourWins"></td>
          </tr>
          <tr>
          <td><img src="http://fayyn.bplaced.net/botterino/about.jpg" maxwidth alt="Botterino About"></td>
          <td><img src="http://fayyn.bplaced.net/botterino/ttt.jpg" maxwidth alt="Botterino TicTacToe"></td>
          </tr>
        </tbody>
      </table>
</details>

<p align="right"><a href="#top">&uarr;</a></p>

## Getting Started

Follow these steps to get the bot up and running.

### Prerequisites

[![NodeJS][node-shield]][node-url]
[![npm][npm-shield]][npm-url]

> npm comes with nodejs, update with the following command:

```sh
npm i -g npm@latest
```

> install ffmpeg and add it to the PATH environment variable[^ffmpeg]

[^ffmpeg]: required for playing unsupported audio sources

[![ffmpeg][ffmpeg-shield]][ffmpeg-url]

<p align="right"><a href="#top">&uarr;</a></p>

### Installation

1. Clone this repo for the latest (unstable) changes or download the [latest release](https://github.com/danloe/Botterino/releases/)

2. Install the required npm packages

    > Run the following command in a terminal in the repo folder:

    ```sh
    npm i
    ```

3. Rename the file `.env.example` to `.env` in the root directory

    ```sh
    BOT_TOKEN="YOURTOKEN"
    GOOGLE_API_KEY="YOURKEY"
    SPOTIFY_CLIENT_ID="YOURCLIENTID"
    SPOTIFY_CLIENT_SECRET="YOURCLIENTSECRET"
    PORT=53134
    ```

4. Replace `YOURTOKEN` with your [Discord Bot Token](https://discord.com/developers/applications)

5. _(optional)_ Replace `YOURKEY` with your [Google API Key for YouTube Data API v3](https://console.cloud.google.com/marketplace/product/google/youtube.googleapis.com)[^googleapi]
  [^googleapi]:required for playlist search; free for up to 10,000 searches per day

6. _(optional)_ Replace `YOURCLIENTID` and `YOURCLIENTSECRET` with your [Spotify API Credentials](https://developer.spotify.com/dashboard/)[^spotifyapi]
  [^spotifyapi]:required to search for spotify content; free of charge for appropriate, rate limited use

7. _(optional)_ Change the `PORT` for the webserver as desired

8. Add the bot to your server via the [OAuth2 > URL Generator](https://discord.com/developers/applications). Select `bot` as scope and insert the permissions integer in the `GENERATED URL`

> Minimum [permissions integer](https://discordapi.com/permissions.html#294242221120):[^permissions]

```sh
294242221120
```

[^permissions]: required for full bot functionality

<p align="right"><a href="#top">&uarr;</a></p>

## Usage

### Run the bot

Run the `start.bat` file to start the bot in a terminal

#### or

> run the following command in a terminal:

```sh
npm start
```

<p align="right"><a href="#top">&uarr;</a></p>

### Deploy guild slash commands

Enter your Discord client id as `hostUserId` in the `config.json` file.

>To find your client id: `Discord Settings > Advanced > Enable Developer Mode`. Then right-click yourself and choose `Copy ID`.

Guild slash commands are only available in the guild in which they were deployed, but are available immediately.

Send the following messages in a guild text channel.

> Deploy slash commands to guild:

```sh
>deploy
```

> Delete slash commands from guild:

```sh
>clearcommands
```

<p align="right"><a href="#top">&uarr;</a></p>

### Deploy application slash commands

Application slash commands are available in all guilds. It may take some time until the commands are available.

> Run the following commands in a terminal to deploy or delete:

```sh
npm run deploy
```

```sh
npm run clear
```

<p align="right"><a href="#top">&uarr;</a></p>

## Roadmap

Have a look at the [Project](https://github.com/users/danloe/projects/1) or [Milestones](https://github.com/danloe/Botterino/milestones).

<p align="right"><a href="#top">&uarr;</a></p>

## Contributing

Suggestions for extensions or improvements are very welcome.

Pull requests are also welcome. For major changes, please open an issue first to discuss what you would like to change.

<p align="right"><a href="#top">&uarr;</a></p>

[release-shield]: https://img.shields.io/github/v/release/danloe/botterino?style=for-the-badge
[release-url]: https://github.com/danloe/Botterino/releases
[issues-shield]: https://img.shields.io/github/issues/danloe/Botterino.svg?style=for-the-badge
[issues-url]: https://github.com/danloe/Botterino/issues
[typescript-shield]: https://img.shields.io/github/package-json/dependency-version/danloe/botterino/dev/typescript?style=for-the-badge
[typescript-url]: https://github.com/Microsoft/TypeScript
[discordjs-shield]: https://img.shields.io/github/package-json/dependency-version/danloe/botterino/discord.js?style=for-the-badge
[discordjs-url]: https://github.com/discordjs/discord.js
[license-shield]: https://img.shields.io/github/license/danloe/Botterino.svg?style=for-the-badge
[license-url]: https://github.com/danloe/Botterino/blob/master/LICENSE.md
[node-shield]: https://img.shields.io/node/v/discord.js?style=flat-square
[node-url]: https://nodejs.org/
[npm-shield]: https://img.shields.io/npm/v/npm?style=flat-square
[npm-url]: https://github.com/npm
[ffmpeg-shield]: https://img.shields.io/badge/FFMPEG-%3E%3D5.0-brightgreen?style=flat-square
[ffmpeg-url]: https://www.ffmpeg.org/download.html
