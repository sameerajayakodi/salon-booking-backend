const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { jsonColumn } = require("../utils/jsonColumn");

const Service = sequelize.define(
    "Service",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(120), allowNull: false },
        durationMin: { type: DataTypes.INTEGER, allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        aliases: jsonColumn("aliases", []),
        weekly: jsonColumn("weekly", {}),
    },
    { tableName: "services" },
);

module.exports = Service;
