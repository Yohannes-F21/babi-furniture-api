const express = require("express");
require("dotenv").config();
const connectDB = require("./database/db");
const productRoutes = require("./routes/product-routes");
const authRoutes = require("./routes/auth-routes");
const contactUsRoutes = require("./routes/contact-us-routes");

const app = express();
const PORT = process.env.PORT || 3000;

//connect to our database
connectDB();

//middleware -> express.json()
app.use(express.json());

//routes here
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/contact-us", contactUsRoutes);

app.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
});
