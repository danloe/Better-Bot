"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
exports.event = {
    name: "ready",
    run: async (client) => {
        client.user.setPresence({ activities: [{ name: 'BEEP BOOP', type: 4 }], status: 'dnd' });
        console.log(`${client.user.tag} is ready.`);
    },
};
//# sourceMappingURL=ready.js.map