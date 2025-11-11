// index.js
const express = require("express");
const cors = require("cors"); // ← NEW
require("dotenv").config();
const connectDB = require("./database/db");
const cookieParser = require("cookie-parser");

const productRoutes = require("./routes/product-routes");
const authRoutes = require("./routes/auth-routes");
const contactUsRoutes = require("./routes/contact-us-routes");

const app = express();
const PORT = process.env.PORT || 4000; // ← keep 4000 (or whatever you use)

// -------------------------------------------------
// 1. CORS configuration
// -------------------------------------------------
const corsOptions = {
  origin: "http://localhost:3000", // ← exact Next.js origin
  credentials: true, // ← allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // ← enable CORS with the options above
// app.options("*", cors(corsOptions)); // ← answer pre-flight for every route

// -------------------------------------------------
// 2. Existing middlewares
// -------------------------------------------------
app.use(express.json());
app.use(cookieParser());

// -------------------------------------------------
// 3. Routes
// -------------------------------------------------
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contact-us", contactUsRoutes);

// -------------------------------------------------
// 4. Start server
// -------------------------------------------------
connectDB();

app.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}`);
});
