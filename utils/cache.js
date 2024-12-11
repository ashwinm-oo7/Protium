// utils/cache.js
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

exports.getCache = (key) => cache.get(key);

exports.setCache = (key, value) => cache.set(key, value);
