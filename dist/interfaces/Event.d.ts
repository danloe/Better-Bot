import Client from "../client";
interface Run {
    (client: Client, ...args: any[]): void;
}
export interface Event {
    name: String;
    run: Run;
}
export {};
