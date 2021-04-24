module.exports = {
	event: 'message',
	execute: async (client, message) => {
		if (!message.guild) return;

		let settings = await message.guild.settings;
		if (!settings) settings = await message.guild.createSettings();

		let is_blacklisted = false;
		if (settings.blacklist.includes(message.author.id)) {
			is_blacklisted = true;
			client.log.info(`Ignoring blacklisted member ${message.author.tag}`);
		} else {
			settings.blacklist.forEach(element => {
				if (message.guild.roles.cache.has(element) && message.member.roles.cache.has(element)) {
					is_blacklisted = true;
					client.log.info(`Ignoring member ${message.author.tag} with blacklisted role`);
				}
			});
		}

		if (is_blacklisted) {
			try {
				return message.react('❌');
			} catch (error) {
				return client.log.debug('Failed to react to a message');
			}
		}

		if (settings.log_messages && !message.system) client.tickets.archives.addMessage(message); // add the message to the archives (if it is in a ticket channel)

		let t_row = await client.db.Ticket.findOne({
			where: {
				id: message.channel.id
			}
		});

		const ignore = [client.user.id, t_row.creator];
		if (t_row && !t_row.first_response && !ignore.includes(message.author.id)) {
			t_row.update({
				first_response: new Date()
			});
		}

		client.commands.handle(message); // pass the message to the command handler
	}
};