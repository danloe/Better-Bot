const { Formatters } = require('discord.js');

module.exports = {
	name: 'modalSubmit',
	execute(modal) {
		if (modal.customId === 'modal-customid') {
			const firstResponse = modal.getTextInputValue('textinput-customid1');
			modal.reply(Formatters.codeBlock('markdown', firstResponse));
		}
	},
};