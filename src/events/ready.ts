module.exports = {
	name: 'ready',
	once: true,
	execute(client : any) {
		console.log(`${client.user.tag} is ready.`);
	},
};