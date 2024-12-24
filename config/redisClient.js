const redis = require("redis");

const client = redis.createClient({
  url: "rediss://red-ctlf2ohopnds73f9s7eg:VMqkkg27IRPgnoInkRdpgZyL0L0Qij2P@oregon-redis.render.com:6379",
});

client.on("error", (err) => console.error("Redis Client Error:", err));

(async () => {
  try {
    await client.connect();
    console.log("Connected to Redis");

    // Example operation: setting a key-value pair
    await client.set("exampleKey", "exampleValue");
    console.log("Key set in Redis");

    // Perform more operations if needed...

    // Disconnect the Redis client when done
    await client.quit();
    console.log("Redis connection closed");
  } catch (err) {
    console.error("Error:", err);

    // Ensure the client is stopped in case of an error
    if (client.isOpen) {
      await client.quit();
      console.log("Redis connection closed after error");
    }
  }
})();
