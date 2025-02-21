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
