const { Sequelize } = require("sequelize");
require("dotenv").config();

// --- Main DB for reads ---
const sequelizeDB1 = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: false,
  },
  dialectOptions: {
    ssl: {
      require: false,
      rejectUnauthorized: false,
    },
  },
});

// --- Secondary DB for mirrored writes ---
const sequelizeDB2 = new Sequelize(process.env.DATABASE_URL2, {
  dialect: "postgres",
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: false,
  },
  dialectOptions: {
    ssl: {
      require: false,
      rejectUnauthorized: false,
    },
  },
});

// --- Connect both ---
const connectDB = async () => {
  try {
    await sequelizeDB1.authenticate();
    console.log("✅ DB1 connected");

    await sequelizeDB2.authenticate();
    console.log("✅ DB2 connected");

    await sequelizeDB1.sync({ alter: true });
    await sequelizeDB2.sync({ alter: true });
    console.log("🛠️ Both databases synchronized");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
};

// --- Polling health check ---
const startDBPolling = (interval = 30000) => {
  setInterval(async () => {
    try {
      await sequelizeDB1.authenticate();
      console.log("💚 DB1 Healthy");
    } catch (err) {
      console.error("💔 DB1 Connection Lost:", err.message);
    }

    try {
      await sequelizeDB2.authenticate();
      console.log("💚 DB2 Healthy");
    } catch (err) {
      console.error("💔 DB2 Connection Lost:", err.message);
    }
  }, interval);
};

// --- 🧠 Magic Patch: Write to both DBs transparently ---
const patchSequelize = (sequelizePrimary, sequelizeSecondary) => {
  const originalDefine = sequelizePrimary.define.bind(sequelizePrimary);

  sequelizePrimary.define = (modelName, attributes, options) => {
    const model = originalDefine(modelName, attributes, options);

    // Define same model on secondary DB
    const model2 = sequelizeSecondary.define(modelName, attributes, options);

    // Patch create/update/destroy to mirror writes
    ["create", "update","bulkCreate"].forEach((method) => {
      const originalMethod = model[method].bind(model);
      model[method] = async function (...args) {
        try {
          const result = await originalMethod(...args);
          // Fire-and-forget mirror to DB2
          model2[method](...args).catch((err) =>
            console.warn(`⚠️ Mirror ${method} failed for ${modelName}:`, err.message)
          );
          return result;
        } catch (err) {
          throw err;
        }
      };
    });

    return model;
  };
};

// Apply the patch so the rest of your app uses this behavior automatically
patchSequelize(sequelizeDB1, sequelizeDB2);

// Export as if it’s a single DB
module.exports = {
  sequelize: sequelizeDB1, // Your app keeps using this one
  connectDB,
  startDBPolling,
};
