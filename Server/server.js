const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const sequelize = require("./config/db");

const cardRoutes = require("./routes/cardRoutes");
const userRoutes = require("./routes/userRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/card", cardRoutes);
app.use("/user", userRoutes);
app.use("/activity", activityRoutes);

app.get("/ping", (req, res) => {
  res.send("pong");
});

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database connected");
    app.listen(3000, () => console.log("🚀 Server running on port 3000"));
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();
