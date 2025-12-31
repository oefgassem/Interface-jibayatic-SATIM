// middleware/db.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Set to true to see SQL queries in console, useful for debugging
  }
);

// Define Payment Model
const Payment = sequelize.define('Payment', {
  orderId: { type: DataTypes.STRING, primaryKey: true, allowNull: false, unique: true },
  orderNumber: { type: DataTypes.STRING, allowNull: false }, // The original order number from the frontend
  satimOrderNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  accountId: {                       
    type: DataTypes.STRING,
    allowNull: true
  },
  amount: { type: DataTypes.INTEGER, allowNull: false }, // Store in smallest currency unit (e.g., cents)
  sapAmount: { type: DataTypes.INTEGER, allowNull: true },   // raw SAP amount
  mcfAmount: { type: DataTypes.INTEGER, allowNull: true },   // original MCF amount
  confirmationToken: { type: DataTypes.STRING, allowNull: true },
  currency: { type: DataTypes.STRING(3), allowNull: false }, // e.g., '012' for DZD
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' }, // e.g., 'registered', 'pending', 'success', 'failed', 'refunded', 'error'
  retryCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, // Renamed from 'retries' for frontend consistency
  satimRegisterResponse: { type: DataTypes.JSONB, allowNull: true }, // Store the full initial SATIM registration response
  satimAckDetails: { type: DataTypes.JSONB, allowNull: true }, // Store details from SATIM acknowledgeTransaction
  sapResponse: { type: DataTypes.JSONB, allowNull: true }, // Store SAP S/4HANA response
  sapSynced: { type: DataTypes.BOOLEAN, defaultValue: false },
  sapRetryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  sapLastTryAt: { type: DataTypes.DATE, allowNull: true },
  sapDocumentNumber: { type: DataTypes.STRING, allowNull: true },
  lastError: { type: DataTypes.TEXT, allowNull: true }, // Store the last error message
  actions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }, // Array of action objects { timestamp, type, details }
}, {
  tableName: 'payments', // Explicitly set table name
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

module.exports = { sequelize, Payment };