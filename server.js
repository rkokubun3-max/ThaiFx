import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import bcrypt from "bcrypt";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import pool from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "Ryuichi9876",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

io.on("connection", (socket) => {
  socket.on("join_user_room", (userId) => {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });
});
let latestRatesData = [];
const indexCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "SGD",
  "HKD",
  "KRW",
  "AUD",
  "CAD",
  "CHF",
];
const allowedCurrencies = [
  "usd",
  "eur",
  "gbp",
  "jpy",
  "cny",
  "sgd",
  "hkd",
  "krw",
  "aud",
  "cad",
  "chf",
  "thb",
];
const dashboardCurrencies = ["thb", "usd", "eur", "jpy"];

app.get("/", async (req, res) => {
  try {
    const thQuoteRates = await loadRate();
    res.render("index.ejs", {
      rates: thQuoteRates,
      pageStyle: "index",
      pageScript: "index",
      user: req.session.user,
      isLoggedIn: req.session.isLoggedIn,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching posts",
      reason: error.message,
    });
  }
});

app.get("/signin", async (req, res) => {
  res.render("signin.ejs", {
    pageStyle: "signin",
    pageScript: "signin",
    isLoggedIn: req.session.isLoggedIn,
  });
});

app.get("/signup", async (req, res) => {
  res.render("signup.ejs", {
    pageStyle: "signup",
    pageScript: "signup",
    isLoggedIn: req.session.isLoggedIn,
  });
});

app.get("/dashboard", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/signin");
  }
  req.session.user = await readUser(req, req.session.user.id);
  const thQuoteRates = await loadRate();

  res.render("dashboard.ejs", {
    currencies: dashboardCurrencies,
    pageStyle: "dashboard",
    pageScript: "dashboard",
    user: req.session.user,
    isLoggedIn: req.session.isLoggedIn,
    rates: thQuoteRates,
  });
});

app.get("/topup", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/signin");
  }

  res.render("topup.ejs", {
    pageStyle: "topup",
    pageScript: "topup",
    user: req.session.user,
    isLoggedIn: req.session.isLoggedIn,
  });
});

app.get("/topup/confirm", async (req, res) => {
  const { userId, amount } = req.query;
  res.render("topup-confirm.ejs", {
    userId: userId,
    amount: amount,
  });
});

app.get("/exchange", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/signin");
  }
  req.session.user = await readUser(req, req.session.user.id);
  const thQuoteRates = await loadRate();
  res.render("exchange.ejs", {
    pageStyle: "exchange",
    pageScript: "exchange",
    user: req.session.user,
    isLoggedIn: req.session.isLoggedIn,
    rates: thQuoteRates,
  });
});

app.get("/wallet", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/signin");
  }
  req.session.user = await readUser(req, req.session.user.id);
  res.render("wallet.ejs", {
    pageStyle: "wallet",
    pageScript: "wallet",
    user: req.session.user,
    isLoggedIn: req.session.isLoggedIn,
    currencies: allowedCurrencies,
  });
});

app.get("/history", async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/signin");
  }
  const userId = req.session.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC;",
      [userId],
    );
    res.render("history.ejs", {
      pageStyle: "history",
      pageScript: "history",
      transactions: result.rows,
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Fetch History Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/logout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Can't logout");
    }
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

app.post("/exchangesubmit", async (req, res) => {
  const { base, quote, amount, expectedAmount } = req.body;
  const userId = req.session.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const baseCol = base?.toLowerCase();
  const quoteCol = quote?.toLowerCase();

  if (
    !allowedCurrencies.includes(baseCol) ||
    !allowedCurrencies.includes(quoteCol)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid currency type" });
  }

  const numericAmount = Number(amount);
  const numericExpected = Number(expectedAmount);

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid amount" });
  }

  try {
    const userRes = await pool.query(
      `SELECT ${baseCol}, ${quoteCol} FROM users WHERE id = $1`,
      [userId],
    );

    if (userRes.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const currentBaseBalance = Number(userRes.rows[0][baseCol] || 0);
    const currentQuoteBalance = Number(userRes.rows[0][quoteCol] || 0);

    if (currentBaseBalance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }
    const response = await axios.get(
      `https://api.frankfurter.dev/v2/rates?base=${base}&quotes=${quote}`,
    );
    let currentRate = response.data[0]?.rate || response.data.rate;
    if (!currentRate) {
      throw new Error("Unable to fetch exchange rate");
    }
    const receivedAmount = numericAmount * currentRate;

    const percentageDiff =
      (Math.abs(receivedAmount - numericExpected) / numericExpected) * 100;

    if (percentageDiff > 1) {
      return res.status(400).json({
        success: false,
        message: "Exchange rate has updated. Please refresh and try again.",
      });
    }

    const newBaseBalance = currentBaseBalance - numericAmount;
    const newQuoteBalance = currentQuoteBalance + receivedAmount;

    await pool.query(
      `UPDATE users SET ${baseCol} = $1, ${quoteCol} = $2 WHERE id = $3`,
      [newBaseBalance, newQuoteBalance, userId],
    );

    await pool.query(
      "INSERT INTO transactions (user_id, type, from_currency, from_amount, to_currency, to_amount, rate) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        userId,
        "EXCHANGE",
        base,
        numericAmount,
        quote,
        receivedAmount,
        currentRate,
      ],
    );

    res.json({
      success: true,
      message: "Exchange successful",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Exchange failed",
    });
  }
});

app.post("/topup/confirm", async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: userId and amount.",
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid top-up amount.",
      });
    }
    await client.query("BEGIN");
    const updateQuery = `
            UPDATE users 
            SET thb = thb + $1 
            WHERE id = $2 `;
    const updateResult = await client.query(updateQuery, [
      numericAmount,
      userId,
    ]);
    if (updateResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const insertQuery = `
            INSERT INTO transactions (user_id, type, from_currency, from_amount, to_currency, to_amount)
            VALUES ($1, 'TOPUP', 'THB', $2, 'THB', $3)`;
    await pool.query(insertQuery, [userId, numericAmount, numericAmount]);
    io.to(`user_${userId}`).emit("topup_success", {
      status: "completed",
      amount: numericAmount,
      message: "Top-up successfully processed!",
    });
    await client.query("COMMIT");

    return res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    client.release();
  }
});

app.post("/signupsubmit", async (req, res) => {
  const { username, email, password, phone } = req.body;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  if (!username || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all fields.",
    });
  }
  try {
    const sql = `
      INSERT INTO users (username, email, password_hash, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(sql, [
      username,
      email,
      hashedPassword,
      phone,
    ]);
    req.session.user = result.rows[0];
    req.session.isLoggedIn = true;
    req.session.user.id = req.session.user.id;
    return res.status(200).json({
      success: true,
      message: "Sign up success",
    });
  } catch (err) {
    console.error("Signup Error:", err);
    if (err.code === "23505") {
      if (err.detail && err.detail.includes("username")) {
        return res
          .status(400)
          .json({ success: false, message: "Username is used" });
      }
      if (err.detail && err.detail.includes("email")) {
        return res
          .status(400)
          .json({ success: false, message: "Email is used" });
      }
      return res
        .status(400)
        .json({ success: false, message: "Already have account" });
    }
    return res.status(500).json({
      success: false,
      message: "Have a problem with server",
    });
  }
});

app.post("/signinsubmit", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Not found this account" });
    }

    const isMatch = await bcrypt.compare(
      password,
      result.rows[0].password_hash,
    );

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Password is incorrect" });
    }

    req.session.user = result.rows[0];
    req.session.isLoggedIn = true;
    req.session.user.id = req.session.user.id;

    return res
      .status(200)
      .json({ success: true, message: "Log in successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

server.listen(port, () => {
  console.log(`Successfully started server on port ${port}.`);
});

function filter(data, currencies) {
  const filteredRates = data.filter((item) => currencies.includes(item.quote));
  return filteredRates;
}

function thQuote(data) {
  const thQuoteRates = data.map((item) => {
    return {
      base: item.quote,
      quote: "THB",
      rate: (1 / item.rate).toFixed(2),
    };
  });
  return thQuoteRates;
}

async function readUser(req, userId) {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      delete user.password_hash;

      if (req && req.session) {
        req.session.user = user;
      }

      return user;
    }

    return null;
  } catch (err) {
    console.error(err);
  }
}

async function loadRate() {
  try {
    const response = await axios.get(
      "https://api.frankfurter.dev/v2/rates?base=THB",
      { timeout: 5000 },
    );
  } catch (error) {
    console.error(
      "⚠️ External API Error, using latest cached data:",
      error.message,
    );
  }
  const filteredRates = filter(latestRatesData, indexCurrencies);
  return thQuote(filteredRates);
}
