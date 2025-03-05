// Backend (Node.js + Express)
const express = require("express");
const router = express.Router();
const BankAccount = require("../models/BankAccount");
const authMiddleware = require("../middleware/authMiddleware");
const BankMaster = require("../models/BankMaster");

const generateIFSC = (prefix, branch) => {
  const branchCode = Math.floor(1000 + Math.random() * 900000); // Random 4-digit branch code
  return `${prefix}0${branchCode}`; // Example: SBIN01234
};
router.post("/add-banks", async (req, res) => {
  try {
    const bankList = [
      {
        name: "State Bank of India",
        ifscPrefix: "SBIN",
        branch: "Andheri",
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        name: "HDFC Bank",
        ifscPrefix: "HDFC",
        branch: "Connaught Place",
        city: "Delhi",
        state: "Delhi",
      },
      {
        name: "ICICI Bank",
        ifscPrefix: "ICIC",
        branch: "Koramangala",
        city: "Bangalore",
        state: "Karnataka",
      },
      {
        name: "Axis Bank",
        ifscPrefix: "AXIS",
        branch: "Park Street",
        city: "Kolkata",
        state: "West Bengal",
      },
      {
        name: "Kotak Mahindra Bank",
        ifscPrefix: "KKBK",
        branch: "Anna Nagar",
        city: "Chennai",
        state: "Tamil Nadu",
      },
      {
        name: "Punjab National Bank",
        ifscPrefix: "PUNB",
        branch: "Sector 17",
        city: "Chandigarh",
        state: "Punjab",
      },
      {
        name: "Canara Bank",
        ifscPrefix: "CNRB",
        branch: "MG Road",
        city: "Pune",
        state: "Maharashtra",
      },
      {
        name: "Union Bank of India",
        ifscPrefix: "UBIN",
        branch: "Gandhinagar",
        city: "Ahmedabad",
        state: "Gujarat",
      },
      {
        name: "Bank of Baroda",
        ifscPrefix: "BARB",
        branch: "Hazratganj",
        city: "Lucknow",
        state: "Uttar Pradesh",
      },
      {
        name: "Yes Bank",
        ifscPrefix: "YESB",
        branch: "Dadar",
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        name: "IDBI Bank",
        ifscPrefix: "IBKL",
        branch: "Salt Lake",
        city: "Kolkata",
        state: "West Bengal",
      },
      {
        name: "IndusInd Bank",
        ifscPrefix: "INDB",
        branch: "Banjara Hills",
        city: "Hyderabad",
        state: "Telangana",
      },
      {
        name: "Federal Bank",
        ifscPrefix: "FDRL",
        branch: "Infopark",
        city: "Kochi",
        state: "Kerala",
      },
      {
        name: "South Indian Bank",
        ifscPrefix: "SIBL",
        branch: "MG Road",
        city: "Bangalore",
        state: "Karnataka",
      },
      {
        name: "Karur Vysya Bank",
        ifscPrefix: "KVBL",
        branch: "Tambaram",
        city: "Chennai",
        state: "Tamil Nadu",
      },
      {
        name: "Central Bank of India",
        ifscPrefix: "CBIN",
        branch: "Chandni Chowk",
        city: "Delhi",
        state: "Delhi",
      },
      {
        name: "UCO Bank",
        ifscPrefix: "UCBA",
        branch: "Shivaji Nagar",
        city: "Pune",
        state: "Maharashtra",
      },
      {
        name: "Indian Overseas Bank",
        ifscPrefix: "IOBA",
        branch: "Whitefield",
        city: "Bangalore",
        state: "Karnataka",
      },
      {
        name: "Saraswat Bank",
        ifscPrefix: "SRCB",
        branch: "Bandra",
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        name: "RBL Bank",
        ifscPrefix: "RATN",
        branch: "Marine Drive",
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        name: "Jammu & Kashmir Bank",
        ifscPrefix: "JAKA",
        branch: "Lal Chowk",
        city: "Srinagar",
        state: "Jammu & Kashmir",
      },
      {
        name: "Andhra Bank",
        ifscPrefix: "ANDB",
        branch: "Vijayawada",
        city: "Vijayawada",
        state: "Andhra Pradesh",
      },
      {
        name: "Dhanlaxmi Bank",
        ifscPrefix: "DLXB",
        branch: "Trivandrum",
        city: "Thiruvananthapuram",
        state: "Kerala",
      },
      {
        name: "Tamilnad Mercantile Bank",
        ifscPrefix: "TMBL",
        branch: "Madurai",
        city: "Madurai",
        state: "Tamil Nadu",
      },
      {
        name: "Bank of Maharashtra",
        ifscPrefix: "MAHB",
        branch: "Shivaji Park",
        city: "Mumbai",
        state: "Maharashtra",
      },
      {
        name: "Punjab & Sind Bank",
        ifscPrefix: "PSIB",
        branch: "Karol Bagh",
        city: "Delhi",
        state: "Delhi",
      },
      {
        name: "Karnataka Bank",
        ifscPrefix: "KARB",
        branch: "JP Nagar",
        city: "Bangalore",
        state: "Karnataka",
      },
      {
        name: "Allahabad Bank",
        ifscPrefix: "ALLA",
        branch: "Gomti Nagar",
        city: "Lucknow",
        state: "Uttar Pradesh",
      },
      {
        name: "Oriental Bank of Commerce",
        ifscPrefix: "ORBC",
        branch: "Secunderabad",
        city: "Hyderabad",
        state: "Telangana",
      },
    ];

    // Generate IFSC codes dynamically
    const banksWithIFSC = bankList.map((bank) => ({
      ...bank,
      ifscCode: generateIFSC(bank.ifscPrefix, bank.branch),
    }));

    await BankMaster.insertMany(banksWithIFSC);
    res.status(201).json({ message: "50+ Banks added successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error adding banks.", error });
  }
});

router.get("/banks", async (req, res) => {
  try {
    const banks = await BankMaster.find();
    res.status(200).json({ banks });
  } catch (error) {
    res.status(500).json({ message: "Error fetching bank list." });
  }
});
// Get all bank accounts for the user
router.get("/bank-accounts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const bankAccounts = await BankAccount.find({ userId });
    res.json(bankAccounts);
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// Add a new bank account
router.post("/bank-accounts", authMiddleware, async (req, res) => {
  try {
    const { bankName, branch, city, state, ifscCode, accountNumber, upiId } =
      req.body;

    if (!req.user) {
      console.log("User not found in request.");
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }
    if (!/^[1-9][0-9]{8,17}$/.test(accountNumber)) {
      return res.status(400).json({
        message:
          "Invalid Account Number! It should be 9-18 digits and cannot start with 0.",
      });
    }

    const userId = req.user.id;

    const newAccount = new BankAccount({
      userId,
      bankName,
      branch,
      city,
      state,
      accountNumber,
      ifscCode,
      upiId,
    });

    await newAccount.save();

    res.status(201).json({ message: "Bank account added successfully." });
  } catch (error) {
    console.error("Error in adding bank account:", error);
    res
      .status(500)
      .json({ message: "Error adding bank account.", error: error.message });
  }
});

// Delete a bank account
router.delete("/bank-accounts/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await BankAccount.findByIdAndDelete(id);
    res.json({ message: "Bank account removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing bank account." });
  }
});

module.exports = router;
