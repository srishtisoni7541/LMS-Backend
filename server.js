require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const hpp = require("hpp");
const errorHandler = require("./middlewares/errorHandler");
const { connectRedis } = require("./config/redis");
const notFound = require("./middlewares/notFound");
const logger = require("./utils/logger"); 
const app = express();
require("./config/db");
connectRedis();

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(helmet());
app.use(cors({ 
  origin: ["http://localhost:5173","http://localhost:5174",process.env.FRONTEND_ADMIN_URL,process.env.FRONTEND_STUDENT_URL],  
  credentials: true,                
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

app.use(hpp());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later!",
  handler: (req, res, next) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`); 
    res.status(429).json({ error: "Too many requests, please try again later!" });
  },
});
app.use("/api", limiter);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use('/api/courses',require('./routes/course.routes'));
app.use("/api/instructor", require("./routes/instructor.routes"));
app.use("/api/module", require('./routes/module.routes'));
app.use("/api/lesson", require("./routes/lesson.routes"));
app.use('/api/quiz', require("./routes/quiz.routes"));
app.use('/api/certificate', require("./routes/certificates.routes"));
app.use('/api/enrollment', require("./routes/enrollement.routes"));
// app.use("/api/admin", require("./routes/admin.routes"));
// app.use("/api/student", require("./routes/student.routes"));
app.use("/api/payments", require("./routes/payment.routes"));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`✅ Server is running on port ${PORT}`);
});