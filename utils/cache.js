const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 30000 }); // Cache for 5 minutes

const getCache = (key) => cache.get(key);

const setCache = (key, value) => {
  cache.set(key, value);
  console.log(`Cache set for ${key}: ${value}`);
};
module.exports = { setCache, getCache };
