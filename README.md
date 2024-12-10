# Stock Portfolio Management System

## Directory Structure
   ```bash
    .
    ├── controllers
    │   ├── portfolioController.js
    │   ├── transactionController.js
    │   └── stockController.js
    ├── models
    │   ├── Stock.js
    │   ├── Portfolio.js
    │   └── Transaction.js
    ├── routes
    │   ├── portfolioRoutes.js
    │   ├── transactionRoutes.js
    │   └── stockRoutes.js
    ├── middleware
    │   └── validate.js
    ├── config
    │   └── db.js
    ├── .env
    ├── index.js
    ├── package.json
    └── README.md
  ```


# Stock Price Update Service

This Node.js application fetches and updates stock prices from Alpha Vantage API, storing them in MongoDB. It uses `node-cron` for scheduling tasks to update the stock prices every minute.

## Features

- Fetch stock prices from Alpha Vantage API.
- Periodically update stock prices (every minute).
- Store stock data (symbol, name, current price, daily change) in MongoDB.
- API to add stock details and fetch current stock prices.

---

## Table of Contents

1. [Installation](#installation)
2. [Environment Variables](#environment-variables)
3. [API Endpoints](#api-endpoints)
4. [Cron Job](#cron-job)
5. [Technologies](#technologies)
6. [License](#license)

---

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/stock-price-update-service.git

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd stock-portfolio-management-system
    ```"# Protium" 
