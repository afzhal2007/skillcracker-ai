require("dotenv").config();

const express = require("express");
const cors = require("cors");
const interviewRoutes = require("./routes/interviewRoutes");
const errorHandler = require("./middleware/errorHandler");
const { initFirebase } = require("./services/firebaseService");

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "https://skillcracker-ai.netlify.app",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "SkillCracker AI backend is running" });
});

app.use("/api", interviewRoutes);
app.use(errorHandler);

initFirebase()
  .then(() => {
    if (require.main === module) {
      app.listen(port, () => {
        console.log(`SkillCracker AI backend running on port ${port}`);
      });
    }
  })
  .catch((error) => {
    console.error("Failed to initialize Firebase:", error);
    if (require.main === module) {
      process.exit(1);
    }
  });

module.exports = app;
