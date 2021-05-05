require('dotenv').config();
const discord = require('discord.js');
const cron = require('node-cron');
const axios = require('axios');

const client = new discord.Client();
let requestsMade = 0;
client.login(process.env.BOT_TOKEN);
client.on('ready', () => {
	console.log('Bot has logged in!');
	let announce = client.channels.cache.find(
		(channel) => channel.id === process.env.CHANNEL_ID
	);
	announce.send('Bot has started...');

	let logChannel = client.channels.cache.find(
		(channel) => channel.id === process.env.LOG_CHANNEL_ID
	);
	logChannel.send('Errors will be logged...');

	const log = (message) => {
		// console.log(message);
		logChannel.send(message);
	};

	const sendData = (url) => {
		axios
			.get(url)
			.then((response) => response.data)
			.then((data) => {
				if (!data.centers) {
					throw new Error(
						"'centers' is not defined in API response."
					);
				}
				requestsMade++;
				if (requestsMade === 1 || requestsMade % 10 === 0) {
					log(`Requests Made: ${requestsMade}`);
				}
				const centers = data.centers;
				const length = centers.length;
				for (let i = 0; i < length; i++) {
					const center = centers[i];
					const sessionCount = center.sessions.length;
					const centerName = center.name;
					const district = center.district_name;
					const pinCode = center.pincode;
					for (let j = 0; j < sessionCount; j++) {
						const currentSession = center.sessions[j];
						const ageLimit = currentSession.min_age_limit;
						const capacity = currentSession.available_capacity;
						const date = currentSession.date;
						const vaccineType = currentSession.vaccine;

						if (ageLimit === 18 && capacity > 2) {
							// console.log(
							// 	`Name: ${centerName}, Age: ${ageLimit}`
							// );
							announce.send(
								`\n***${district}***\nAvailable at: ${centerName} on ${date}\nAvailable capacity: ${capacity}\nVaccine Type: ${vaccineType}\nPin Code: ${pinCode}`
							);
						}
					}
				}
			})
			.catch((err) => {
				let message = `***Request #${requestsMade}***\nError occured: ${err.message}\n`;
				if (err.response && err.response.status) {
					message += `Response status code: ${err.response.status}`;
				}
				log(message);
			});
	};
	cron.schedule('* * * * *', () => {
		const d = new Date();
		const currentOffset = d.getTimezoneOffset();

		const ISTOffset = 330; // IST offset UTC +5:30

		const ISTTime = new Date(
			d.getTime() + (ISTOffset + currentOffset) * 60000
		);

		//https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=507&date=04-05-2021
		const url = `${process.env.API_ENDPOINT}?district_id=${
			process.env.CITY_ID
		}&date=0${ISTTime.getDate()}-0${
			ISTTime.getMonth() + 1
		}-${ISTTime.getFullYear()}`;

		sendData(url);
	});
});
