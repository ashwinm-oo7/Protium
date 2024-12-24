const express = require("express");
const axios = require("axios");
const router = express.Router();

const RAPIDAPI_URL =
  "https://yahoo-finance15.p.rapidapi.com/api/yahoo/hi/history/";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY; // Store your RapidAPI key securely

router.get("/history", async (req, res) => {
  const options = {
    method: "GET",
    url: "https://yahoo-finance166.p.rapidapi.com/api/news/list-by-symbol",
    params: {
      s: "AAPL,GOOGL,TSLA",
      region: "US",
      snippetCount: "500",
    },
    headers: {
      "x-rapidapi-key": "RAPIDAPI_KEY",
      "x-rapidapi-host": "yahoo-finance166.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    console.log(response);
    res.json(response.data); // Send the data to the frontend
  } catch (error) {
    console.error("Error fetching stock news:", error.message);
    res.status(500).json({ error: "Failed to fetch stock news" });
  }
});

module.exports = router;
