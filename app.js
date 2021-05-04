require("dotenv").config();
const discord = require("discord.js");
const request = require("request");
const express = require("express");
const app = express();
const port = 3000;
const cron = require("node-cron");

const client = new discord.Client();
client.login(process.env.BOT_TOKEN);
client.on("ready", () => {
  console.log("Bot has logged in!");
  let announce = client.channels.cache.find(
    (channel) => channel.id === process.env.CHANNEL_ID
  );
  announce.send("Fetching Data...");

  const sendData = (url) => {
    request({ url: url, json: true }, async (error, response) => {
      console.log(url);
      console.log(response.body.centers.length);
      for (let i = 0; i < response.body.centers.length; i++) {
        for (let j = 0; j < response.body.centers[i].sessions.length; j++) {
          if (
            response.body.centers[i].sessions[j].min_age_limit === 18 &&
            response.body.centers[i].sessions[j].available_capacity > 5
          ) {
            console.log(
              response.body.centers[i].name +
                " " +
                response.body.centers[i].sessions[j].min_age_limit
            );
            announce.send(
              response.body.centers[i].district_name +
                ": available at " +
                response.body.centers[i].name +
                " on " +
                response.body.centers[i].sessions[j].date +
                ". Available Capacity: " +
                response.body.centers[i].sessions[j].available_capacity
            );
          }
        }
      }
    });
  };

  cron.schedule("* * * * *", () => {
    let d = new Date();
    let currentOffset = d.getTimezoneOffset();

    let ISTOffset = 330; // IST offset UTC +5:30

    let ISTTime = new Date(d.getTime() + (ISTOffset + currentOffset) * 60000);

    //https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=507&date=04-05-2021
    const url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${
      process.env.CITY_ID
    }&date=0${ISTTime.getDate()}-0${
      ISTTime.getMonth() + 1
    }-${ISTTime.getFullYear()}`;

    sendData(url);
  });
});
