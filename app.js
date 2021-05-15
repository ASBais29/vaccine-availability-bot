require("dotenv").config();
const discord = require("discord.js");
const cron = require("node-cron");
const axios = require("axios");

const client = new discord.Client();
let requestsMade_Ajmer = 0;
let requestsMade_Jaipur=0;
client.login(process.env.BOT_TOKEN);
client.on("ready", () => {
  console.log("Bot has logged in!");

  const sendData = (url, channel_id, log_id,requestsMade) => {
    axios
      .get(url, {
        headers: {
          authority: "cdn-api.co-vin.in",
          pragma: "no-cache",
          "cache-control": "no-cache",
          "sec-ch-ua":
            '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
          accept: "application/json, text/plain, /",
          "sec-ch-ua-mobile": "?0",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
          origin: "https://www.cowin.gov.in",
          "sec-fetch-site": "cross-site",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: "https://www.cowin.gov.in/",
          "accept-language": "en",
        },
      })
      .then((response) => response.data)
      .then((data) => {
        if (!data.centers) {
          throw new Error("'centers' is not defined in API response.");
        }
        let logChannel = client.channels.cache.find(
          (channel) => channel.id === log_id
        );
        let announce = client.channels.cache.find(
          (channel) => channel.id === channel_id
        );  
        requestsMade++;
        
        if (requestsMade === 1 || requestsMade % 120 === 0) {
          logChannel.send(`Requests Made: ${requestsMade}`);
        }
   console.log(url);
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
            const currentTime = new Date();
            const checkedAt = currentTime
              .toLocaleString("en-US", {
                timeZone: "Asia/Kolkata",
              })
              .split(",")[1];
              if(center.district_name=='Ajmer')
              {
                requestsMade_Ajmer=requestsMade;
              }
              if(center.district_name=='Jaipur II')
              {
                requestsMade_Jaipur=requestsMade;
              }  
            if (ageLimit === 18 && capacity > 10) {
              // console.log(
              // 	`Name: ${centerName}, Age: ${ageLimit}`
              // );
              announce.send(
                `\n**${district}** *Last Checked:${checkedAt}*\nAvailable at: ${centerName} on ${date}\nAvailable capacity: ${capacity}\nVaccine Type: ${vaccineType}\nPin Code: ${pinCode}\n_____`
              );
            }
          }
        }
      })
      .catch((err) => {
        let message = `*Request #${requestsMade}*\nError occured: ${err.message}\n`;
        if (err.response && err.response.status) {
          message += `Response status code: ${err.response.status}`;
          status = err.response.status;
        }
        let logChannel = client.channels.cache.find(
          (channel) => channel.id === log_id
        );
        logChannel.send(message);
      });
  };
  cron.schedule("*/10 * * * * *", () => {
    const d = new Date();
    const currentOffset = d.getTimezoneOffset();

    const ISTOffset = 330; // IST offset UTC +5:30

    const ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);

    const url = `${process.env.API_ENDPOINT}?district_id=${
      process.env.CITY_ID
    }&date=${ISTTime.getDate()}-0${
      ISTTime.getMonth() + 1
    }-${ISTTime.getFullYear()}`;
       
  let date=ISTTime.getDate()>=1&&ISTTime.getDate()<10?'0'+ISTTime.getDate():ISTTime.getDate();
    const url_jaipur = `${process.env.API_ENDPOINT}?district_id=${
      process.env.JAIPUR_ID
    }&date=${date}-0${
      ISTTime.getMonth() + 1
    }-${ISTTime.getFullYear()}`;
    sendData(url,process.env.CHANNEL_ID,process.env.LOG_CHANNEL_ID,requestsMade_Ajmer);
    sendData(url_jaipur, process.env.JAIPUR_CHANNEL_ID, process.env.LOG_JAIPUR,requestsMade_Jaipur);
  });
});

