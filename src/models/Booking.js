const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const { BOOKING_SOURCE } = require("../constants/booking");

const Booking = sequelize.define(
    "Booking",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        customerId: { type: DataTypes.INTEGER, allowNull: false },
        serviceId: { type: DataTypes.INTEGER, allowNull: false },
        slotId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
        slotDate: { type: DataTypes.DATEONLY, allowNull: false },
        startMin: { type: DataTypes.INTEGER, allowNull: false },
        durationMin: { type: DataTypes.INTEGER, allowNull: false },
        status: { type: DataTypes.STRING(24), allowNull: false },
        source: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: BOOKING_SOURCE.WHATSAPP,
        },
        cancelledAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
        tableName: "bookings",
        indexes: [
            { name: "bookings_schedule_idx", fields: ["slot_date", "start_min"] },
            { name: "bookings_status_idx", fields: ["status"] },
        ],
    },
);

module.exports = Booking;
