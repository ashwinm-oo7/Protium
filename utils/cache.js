const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 3000 }); // Cache for 5 minutes

const getCache = (key) => cache.get(key);

const setCache = (key, value) => {
  cache.set(key, value);
  console.log(`Cache set for ${key}: ${value}`);
};

const delCache = (key) => {
  cache.del(key);
  console.log(`Cache deleted for ${key}`);
};

module.exports = { setCache, getCache, delCache };
