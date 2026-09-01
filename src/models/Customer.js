const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Customer = sequelize.define(
    "Customer",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        phone: { type: DataTypes.STRING(32), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(120), allowNull: true },
        lang: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "en" },
    },
    { tableName: "customers" },
);

module.exports = Customer;
