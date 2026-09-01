const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { SLOT_STATUS } = require("../constants/booking");

const Slot = sequelize.define(
    "Slot",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        serviceId: { type: DataTypes.INTEGER, allowNull: false },
        slotDate: { type: DataTypes.DATEONLY, allowNull: false },
        startMin: { type: DataTypes.INTEGER, allowNull: false },
        endMin: { type: DataTypes.INTEGER, allowNull: false },
        status: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: SLOT_STATUS.OPEN,
        },
    },
    {
        tableName: "slots",
        indexes: [
            { unique: true, name: "slots_service_date_start_unique", fields: ["service_id", "slot_date", "start_min"] },
            { name: "slots_lookup_idx", fields: ["service_id", "slot_date", "status"] },
        ],
    },
);

module.exports = Slot;
