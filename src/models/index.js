const { sequelize, Sequelize } = require("../config/db");

const AdminUser = require("./AdminUser");
const Service = require("./Service");
const Slot = require("./Slot");
const Customer = require("./Customer");
const Booking = require("./Booking");
const Conversation = require("./Conversation");

Service.hasMany(Slot, { foreignKey: "serviceId", as: "slots" });
Slot.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

Service.hasMany(Booking, { foreignKey: "serviceId", as: "bookings" });
Booking.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

Customer.hasMany(Booking, { foreignKey: "customerId", as: "bookings" });
Booking.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

Slot.hasOne(Booking, { foreignKey: "slotId", as: "booking" });
Booking.belongsTo(Slot, { foreignKey: "slotId", as: "slot" });

Customer.hasOne(Conversation, { foreignKey: "customerId", as: "conversation" });
Conversation.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

module.exports = {
    sequelize,
    Sequelize,
    AdminUser,
    Service,
    Slot,
    Customer,
    Booking,
    Conversation,
};
