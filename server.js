require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const hpp = require("hpp");
const errorHandler = require("./middlewares/errorHandler");
const { connectRedis } = require("./config/redis");
const notFound = require("./middlewares/notFound");

const app = express();
require("./config/db");
connectRedis();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(helmet()); 
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] })); 
app.use(hpp()); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later!",
});
app.use("/api", limiter);

app.use('/api/auth', require('./routes/auth.routes'));   
app.use(notFound);
app.use(errorHandler);
app.listen(3000, () => {
  console.log("✅ Server is running on port 3000");
});
