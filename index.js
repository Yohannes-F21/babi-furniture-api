const express = require("express");
require("dotenv").config();
const connectDB = require("./database/db");
const productRoutes = require("./routes/product-routes");

const app = express();
const PORT = process.env.PORT || 3000;

//connect to our database
connectDB();

//middleware -> express.json()
app.use(express.json());

//routes here
app.use("/api/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Server is now running on port ${PORT}`);
});
