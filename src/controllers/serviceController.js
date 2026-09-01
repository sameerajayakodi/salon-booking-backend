const { success } = require("../config/response");
const { asyncHandler } = require("../utils/asyncHandler");
const { appError } = require("../middleware/errorHandler");
const { Service } = require("../models");
const { listAvailability } = require("../services/availabilityService");
const { minutesToLabel } = require("../utils/time");

function serialize(service) {
    return {
        id: service.id,
        name: service.name,
        durationMin: service.durationMin,
        isActive: service.isActive,
        aliases: service.aliases || [],
        weekly: service.weekly || {},
        createdAt: service.createdAt,
    };
}

const services = {
    list: asyncHandler(async (req, res) => {
        const rows = await Service.findAll({ order: [["name", "ASC"]] });
        return success(res, { items: rows.map(serialize), total: rows.length });
    }),

    create: asyncHandler(async (req, res) => {
        const service = await Service.create({
            name: req.body.name,
            durationMin: req.body.durationMin,
            isActive: req.body.isActive ?? true,
            aliases: req.body.aliases || [],
            weekly: req.body.weekly || {},
        });
        return success(res, serialize(service), "Service created", 201);
    }),

    update: asyncHandler(async (req, res) => {
        const service = await Service.findByPk(req.params.id);
        if (!service) throw appError(404, "service_not_found", "Service not found");

        await service.update(req.body);
        return success(res, serialize(service), "Service updated");
    }),
};

const availability = {
    read: asyncHandler(async (req, res) => {
        const { serviceId, date, period } = req.query;
        const slots = await listAvailability(serviceId, date, period);

        return success(res, {
            serviceId,
            date,
            period: period || null,
            slots: slots.map((s) => ({
                id: s.id,
                startMin: s.startMin,
                endMin: s.endMin,
                label: minutesToLabel(s.startMin),
            })),
        });
    }),
};

module.exports = { services, availability, serialize };
