const mongoose = require("mongoose");
require("dotenv").config();

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB Atlas");

    const users = mongoose.connection.collection("users");

    // Step 1: Check existing indexes
    const indexes = await users.indexes();
    console.log("Current indexes:", indexes);

    // Step 2: Drop the username_1 index
    try {
      await users.dropIndex("username_1");
      console.log("Dropped username_1 index");
    } catch (error) {
      if (error.codeName === "IndexNotFound") {
        console.log("Index username_1 not found, skipping...");
      } else {
        throw error;
      }
    }

    // Step 3: (Optional) Remove username field from all documents
    await users.updateMany({}, { $unset: { username: "" } });
    console.log("Removed username field from all documents");

    // Step 4: (Optional) Create new unique index on userName
    // Check for duplicates first
    const duplicates = await users
      .aggregate([
        { $group: { _id: "$userName", count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicates.length > 0) {
      console.log("Found duplicate userName values:", duplicates);
      console.log("Please resolve duplicates before creating a unique index.");
    } else {
      await users.createIndex({ userName: 1 }, { unique: true });
      console.log("Created unique index on userName");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB Atlas");
  }
}

fixIndex();
