const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { jsonColumn } = require("../utils/jsonColumn");
const { EMPTY_DRAFT } = require("../constants/booking");

const Conversation = sequelize.define(
    "Conversation",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        customerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        draft: jsonColumn("draft", { ...EMPTY_DRAFT }),
        history: jsonColumn("history", []),
        lang: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "en" },
        lastIntent: { type: DataTypes.STRING(32), allowNull: true },
    },
    { tableName: "conversations" },
);

module.exports = Conversation;
