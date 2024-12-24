const redis = require("redis");
// const { console } = require("inspector");

const client = redis.createClient({
  url: "rediss://red-ctlf2ohopnds73f9s7eg:VMqkkg27IRPgnoInkRdpgZyL0L0Qij2P@oregon-redis.render.com:6379",
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
