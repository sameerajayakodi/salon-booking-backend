const { DataTypes } = require("sequelize");

function jsonColumn(field, fallback) {
    return {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: fallback,
        get() {
            const raw = this.getDataValue(field);
            if (typeof raw !== "string") return raw ?? fallback;
            try {
                return JSON.parse(raw);
            } catch {
                return fallback;
            }
        },
    };
}

module.exports = { jsonColumn };
