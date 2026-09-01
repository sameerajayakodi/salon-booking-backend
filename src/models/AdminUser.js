const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AdminUser = sequelize.define(
    "AdminUser",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(120), allowNull: false },
        email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
        passwordHash: { type: DataTypes.STRING(255), allowNull: false },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "admin_users" },
);

AdminUser.prototype.toSafeJSON = function toSafeJSON() {
    return {
        id: this.id,
        name: this.name,
        email: this.email,
        isActive: this.isActive,
        lastLoginAt: this.lastLoginAt,
    };
};

module.exports = AdminUser;
