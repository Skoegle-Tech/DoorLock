const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("postgresql://admin:admin@52.66.43.15/CardDB", {
  dialect: "postgres",
  logging: false,
  define: { freezeTableName: true, timestamps: false },
  dialectOptions: {
    ssl: { require: false, rejectUnauthorized: false },
  },
});

sequelize.sync({ alter: true, force: false });
sequelize.authenticate()
  .then(() => console.log("✅ Database connected"))
    .catch((err) => console.error("❌ Database connection failed:", err));

module.exports = sequelize;
