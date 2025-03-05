const fetchAndStoreAllStocks = async () => {
  try {
    console.log("📡 Fetching stock listings from Alpha Vantage...");

    // Alpha Vantage API to get all stock listings
    const url = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${API_KEY}`;
    const response = await axios.get(url);

    if (!response.data) {
      console.error("❌ No data received from Alpha Vantage.");
      return;
    }

    const stockList = response.data.split("\n").slice(1); // Remove header row

    let insertedCount = 0;

    for (const stockData of stockList) {
      const [
        symbol,
        name,
        exchange,
        assetType,
        ipoDate,
        delistingDate,
        status,
      ] = stockData.split(",");

      if (!symbol || symbol === "Symbol") continue; // Skip empty rows

      // Check if the stock already exists
      const existingStock = await Stock.findOne({ symbol });

      if (!existingStock) {
        // Insert new stock into the database
        await Stock.create({
          symbol,
          name,
          exchange,
          assetType,
          ipoDate,
          delistingDate,
          status,
          currentPrice: 0, // Default, to be updated later
        });
        insertedCount++;
        console.log(`✅ Added stock: ${symbol} - ${name}`);
      }
    }

    console.log(
      `🎉 Successfully added ${insertedCount} new stocks to the database.`
    );
  } catch (error) {
    console.error("❌ Error fetching stock data:", error.message);
  }
};

/**
 * Connect to MongoDB & Run the script
 */
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const start = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${username}:${encodeURIComponent(password)}@${
        process.env.MONGO_URI
      }/${process.env.dbName}?retryWrites=true&w=majority`
    );
    console.log("✅ Connected to MongoDB");

    await fetchAndStoreAllStocks();

    mongoose.connection.close();
    console.log("🔌 MongoDB connection closed.");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
};

start();

// ///////////////////////temp

const Joi = require("joi");

const validateStock = (req, res, next) => {
  const schema = Joi.object({
    symbol: Joi.string().required(),
    name: Joi.string().required(),
    currentPrice: Joi.number().greater(0).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateTransaction = (req, res, next) => {
  const schema = Joi.object({
    stockId: Joi.string().required(),
    type: Joi.string().valid("buy", "sell").required(),
    quantity: Joi.number().greater(0).required(),
    price: Joi.number().greater(0).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validateStock, validateTransaction };

const { body, param, validationResult } = require("express-validator");

exports.validateAddStock = [
  body("userId").notEmpty().withMessage("User ID is required"),
  body("stockId").notEmpty().withMessage("Stock ID is required"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

exports.validateUserRegistration = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
