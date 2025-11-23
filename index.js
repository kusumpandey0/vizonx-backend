const express = require("express");
const dotenv = require("dotenv");
const app = express();
dotenv.config();
const cors = require("cors");
const connectToDb = require("./connections/index");

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/uploads", express.static("uploads"));

const blogRoutes = require("./routes/blog.js");
app.use("/api/blog", blogRoutes);

//database connectiona and starting the server
const URL = process.env.MONGODB_URI;
console.log(process.env.PORT);
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  connectToDb(URL);
  console.log(`${PORT} listened`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error("Server error:", err);
  }
});
