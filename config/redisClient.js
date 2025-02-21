const redis = require("redis");
// const { console } = require("inspector");
const dotenv = require("dotenv");
dotenv.config();

const client = redis.createClient({
  url: process.env.REDIS_URL, // Fetch from env variable
});

client.on("error", (err) => console.error("Redis Client Error:", err));

(async () => {
  try {
    await client.connect();
    console.log("Connected to Redis");
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
  }
})();

module.exports = client;
