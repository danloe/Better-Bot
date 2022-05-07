"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.event = void 0;
exports.event = {
    name: "ready",
    run: async (client) => {
        client.user.setPresence({
            activities: [{ name: "PEW POW!", type: 5 /* COMPETING */ }],
            status: "online",
        });
        console.log(`${client.user.tag} is ready.`);
    },
};
//# sourceMappingURL=ready.js.map