import Client from "../client";
import { ClientEvents } from "discord.js";

interface Run {
  (client: Client, ...args: any[]): void;
}

export interface Event {
  name: String;
  run: Run;
}
