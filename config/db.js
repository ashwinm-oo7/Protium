const { MongoClient } = require("mongodb");
require("dotenv").config();

class Database {
  constructor(uri, dbName) {
    this.uri = uri;
    this.dbName = dbName;
    this.client = new MongoClient(this.uri);
    this.db = null;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("MongoDB connected successfully");
      this.db = this.client.db(this.dbName);
    } catch (error) {
      console.error("MongoDB Connection Error:", error);
      throw new Error("Could not connect to database");
    }
  }

  async getDb() {
    if (!this.db) {
      throw new Error("Database connection has not been established.");
    }
    return this.db;
  }
}

// Ensure environment variables are present
const requiredEnvVars = [
  "MONGO_USERNAME",
  "MONGO_PASSWORD",
  "MONGO_URI",
  "dbName",
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`Missing environment variable: ${varName}`);
    throw new Error(`Environment variable ${varName} is missing`);
  }
});

// Construct MongoDB URI
const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const uri = `mongodb+srv://${username}:${encodeURIComponent(password)}@${
  process.env.MONGO_URI
}/${process.env.dbName}?retryWrites=true&w=majority`;

console.log("MongoDB URI:", uri);

const dbName = process.env.dbName;

// Instantiate the Database class
const database = new Database(uri, dbName);

// Export function to connect to the database and return the database instance
async function connectDatabase() {
  await database.connect();
  return database;
}

module.exports = { connectDatabase };
