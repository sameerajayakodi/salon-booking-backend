const logger = require("../log/logger");
const { Service, Conversation } = require("../models");
const { config } = require("../config/env");
const { INTENT, EMPTY_DRAFT } = require("../constants/booking");
const { understand, answerQuestion } = require("./nluService");
const { t, serviceMenu, normalizeLang } = require("./messageService");
const { topicAnswer, bookingOffer } = require("../config/salonKnowledge");
const { listAvailability, suggestAlternatives, nextOpenDates } = require("./availabilityService");
const { upsertCustomer, createBooking, findBooking, bookingPayload } = require("./bookingService");
const {
    todayISO,
    daysBetween,
    formatDateLong,
    minutesToLabel,
    numberedTimes,
    numberedDates,
} = require("../utils/time");

const NEWLINE = String.fromCharCode(10);
const DATE_CHOICES = 3;
const TIME_CHOICES = 6;
const STUCK_AFTER = 2;
const QUESTION_KEYS = new Set(["ask_service", "ask_date", "ask_date_open", "ask_time", "ask_name", "unknown_service", "summary"]);

async function getConversation(customerId) {
    const [conversation] = await Conversation.findOrCreate({
        where: { customerId },
        defaults: { customerId, draft: { ...EMPTY_DRAFT }, lang: "en" },
    });
    return conversation;
}

function pickFrom(list, ordinal) {
    if (!Array.isArray(list) || !list.length) return null;
    if (ordinal === null || ordinal === undefined) {
        return list.length === 1 ? list[0] : null;
    }
    const index = ordinal === -1 ? list.length - 1 : ordinal;
    return index >= 0 && index < list.length ? list[index] : null;
}

function resolveFromOffer(draft, nlu, expecting) {
    const affirmative = nlu.intent === INTENT.AFFIRM || nlu.intent === INTENT.CONFIRM;
    const hasOrdinal = nlu.ordinal !== null && nlu.ordinal !== undefined;

    if (expecting === "time") {
        const offered = draft.offeredTimes || [];
        if (!offered.length) return null;

        if (hasOrdinal) {
            const picked = pickFrom(offered, nlu.ordinal);
            if (picked !== null) return { field: "startMin", value: picked, via: "ordinal" };
        }
        if (nlu.startMin !== null && nlu.startMin !== undefined && offered.includes(nlu.startMin)) {
            return { field: "startMin", value: nlu.startMin, via: "exact-time" };
        }
        if (affirmative) {
            const picked = pickFrom(offered, null);
            if (picked !== null) return { field: "startMin", value: picked, via: "only-option" };
        }
        return null;
    }

    if (expecting === "date") {
        const offered = draft.offeredDates || [];
        if (!offered.length) return null;

        if (hasOrdinal) {
            const picked = pickFrom(offered, nlu.ordinal);
            if (picked) return { field: "date", value: picked, via: "ordinal" };
        }
        if (affirmative) {
            const picked = offered.length === 1 ? offered[0] : offered[0];
            if (picked) return { field: "date", value: picked, via: "first-offered" };
        }
        return null;
    }

    if (expecting === "service") {
        const offered = draft.offeredServices || [];
        if (!offered.length) return null;
        if (hasOrdinal) {
            const picked = pickFrom(offered, nlu.ordinal);
            if (picked) return { field: "serviceId", value: picked, via: "ordinal" };
        }
        return null;
    }

    return null;
}

async function handle(phone, text) {
    const startedAt = Date.now();

    const services = await Service.findAll({
        where: { isActive: true },
        order: [["name", "ASC"]],
    });

    const customer = await upsertCustomer(phone);
    const conversation = await getConversation(customer.id);
    const draft = { ...EMPTY_DRAFT, ...(conversation.draft || {}) };
    const expecting = conversation.lastIntent;

    logger.info("Customer message received", {
        event: "chat.inbound",
        phone,
        customerId: customer.id,
        text,
        expecting,
        draftBefore: { serviceId: draft.serviceId, date: draft.date, startMin: draft.startMin, name: draft.name },
    });

    const nlu = await understand(text, draft, services, expecting);
    const lang = normalizeLang(nlu.language || customer.lang);
    const menu = serviceMenu(services);

    await upsertCustomer(phone, { lang });

    const snapshotBefore = JSON.stringify([draft.serviceId, draft.date, draft.startMin, draft.name]);

    const acks = [];
    const acknowledge = (key, params) => acks.push({ key, params });

    let answered = false;
    let handled = false;

    if (nlu.intent === INTENT.ASK && !nlu.topic) {
        const answer = await answerQuestion(text, services, lang, null);
        acks.push(answer ? { text: answer } : { key: "answer_unavailable" });
        answered = true;

        logger.info("Answered an off-track question", {
            event: "chat.answered",
            phone,
            question: String(text).slice(0, 140),
            usedModel: Boolean(answer),
        });
    }

    const respond = async (key, params, nextExpecting, extra = {}) => {
        const learned = answered
            || handled
            || JSON.stringify([draft.serviceId, draft.date, draft.startMin, draft.name]) !== snapshotBefore;
        draft.repeat = draft.lastKey === key && !learned ? (draft.repeat || 0) + 1 : 0;
        draft.lastKey = key;

        let renderKey = key;
        if (draft.repeat >= STUCK_AFTER && QUESTION_KEYS.has(key)) {
            renderKey = "fallback";
            draft.repeat = 0;
            draft.lastKey = null;
            logger.warn("Conversation was stuck, sending guidance instead", {
                event: "chat.stuck",
                phone,
                stuckOn: key,
            });
        }

        await conversation.update({ draft, lang, lastIntent: nextExpecting });

        const body = t(renderKey, lang, renderKey === "fallback" ? {} : params);
        const preface = acks.map((a) => (a.text ? a.text : t(a.key, lang, a.params))).join(" ");
        const reply = preface ? `${preface}

${body}` : body;

        logger.info("Assistant replied", {
            event: "chat.reply",
            phone,
            customerId: customer.id,
            templateKey: renderKey,
            language: lang,
            intent: nlu.intent,
            usedModel: Boolean(nlu.usedModel),
            expectingNext: nextExpecting,
            repeat: draft.repeat,
            draftAfter: { serviceId: draft.serviceId, date: draft.date, startMin: draft.startMin, name: draft.name },
            durationMs: Date.now() - startedAt,
            reply: reply.replace(/\n/g, " | "),
            ...extra,
        });

        return {
            reply,
            key: renderKey,
            lang,
            draft: {
                serviceId: draft.serviceId,
                date: draft.date,
                startMin: draft.startMin,
                name: draft.name,
            },
            nlu: {
                intent: nlu.intent,
                usedModel: nlu.usedModel,
                confidence: nlu.confidence,
                ordinal: nlu.ordinal ?? null,
            },
            corrections: acks.filter((a) => a.key).map((a) => a.key),
            answered,
            ...extra,
        };
    };

    const askForDate = async (service, fromISO) => {
        const start = fromISO || todayISO();
        const span = fromISO ? 45 : 21;
        const dates = await nextOpenDates(service.id, start, DATE_CHOICES, span, 0);
        draft.offeredDates = dates;
        draft.offeredTimes = [];

        if (!dates.length) return respond("ask_date_open", {}, "date");
        return respond("ask_date", { dates: numberedDates(dates) }, "date");
    };

    const offerTimes = async (service, slots, key, params = {}) => {
        const times = slots.slice(0, TIME_CHOICES).map((s) => s.startMin);
        draft.offeredTimes = times;
        draft.offeredDates = [];

        if (times.length === 1 && key === "ask_time") {
            return respond(
                "only_time",
                { date: formatDateLong(draft.date), time: minutesToLabel(times[0]) },
                "time",
            );
        }

        return respond(key, { times: numberedTimes(times), ...params }, "time");
    };

    if (!services.length) {
        return respond("fallback", {}, null);
    }

    if (nlu.intent === INTENT.CANCEL) {
        Object.assign(draft, EMPTY_DRAFT, { offeredServices: services.map((s) => s.id) });
        return respond("restarted", { services: menu }, "service");
    }

    if (nlu.intent === INTENT.ASK && nlu.topic) {
        const about = services.find((s) => s.id === (nlu.aboutServiceId || draft.serviceId)) || null;
        const info = topicAnswer(nlu.topic, lang, services, about);

        if (info) {
            const midFlow = Boolean(draft.serviceId && draft.date);
            const offer = bookingOffer(lang, midFlow ? null : about, midFlow);

            draft.suggestedServiceId = about ? about.id : null;
            if (!draft.serviceId) draft.offeredServices = services.map((s) => s.id);
            answered = true;

            logger.info("Answered from the salon knowledge hub", {
                event: "chat.concierge",
                phone,
                topic: nlu.topic,
                about: about ? about.name : null,
                language: lang,
            });

            return respond(
                "kb_answer",
                { answer: info + NEWLINE + NEWLINE + offer },
                expecting || (draft.serviceId ? "date" : "service"),
                { topic: nlu.topic },
            );
        }
    }

    const nudged = nlu.intent === INTENT.AFFIRM || nlu.intent === INTENT.CONFIRM;
    if (nudged && !draft.serviceId && draft.suggestedServiceId) {
        const suggested = services.find((s) => s.id === draft.suggestedServiceId);
        if (suggested) {
            draft.serviceId = suggested.id;
            draft.suggestedServiceId = null;
            handled = true;

            logger.info("Bridged a concierge answer into the booking ladder", {
                event: "chat.bridge",
                phone,
                service: suggested.name,
            });
        }
    }

    if (nlu.intent === INTENT.QUERY) {
        draft.offeredServices = services.map((s) => s.id);

        const complete = Boolean(draft.serviceId && draft.date && draft.startMin !== null && draft.name);
        const midFlow = Boolean(draft.serviceId) && !complete;

        const key = complete ? "services_info_held" : midFlow ? "services_info" : "ask_service";
        return respond(key, { services: menu }, expecting || "service");
    }

    if (nlu.intent === INTENT.GREETING) {
        if (!draft.serviceId) {
            draft.offeredServices = services.map((s) => s.id);
            return respond("greeting", { salon: config.salon.name, services: menu }, "service");
        }
        acknowledge("greeting_back", {});
        handled = true;
    }

    if (nlu.serviceId && nlu.serviceId !== draft.serviceId) {
        if (draft.serviceId) {
            const next = services.find((s) => s.id === nlu.serviceId);
            if (next) acknowledge("ack_service", { service: next.name });
        }
        draft.serviceId = nlu.serviceId;
        draft.startMin = null;
        draft.timeExplicit = false;
    }
    if (nlu.date && nlu.date !== draft.date) {
        if (draft.date) acknowledge("ack_date", { date: formatDateLong(nlu.date) });
        draft.date = nlu.date;
        draft.startMin = null;
        draft.timeExplicit = false;
    }
    if (nlu.startMin !== null && nlu.startMin !== undefined) {
        if (draft.startMin !== null && draft.startMin !== undefined && draft.startMin !== nlu.startMin) {
            acknowledge("ack_time", { time: minutesToLabel(nlu.startMin) });
        }
        draft.startMin = nlu.startMin;
        draft.timeExplicit = Boolean(nlu.timeExplicit);
    }
    if (nlu.name) {
        if (draft.name && draft.name !== nlu.name) acknowledge("ack_name", { name: nlu.name });
        draft.name = nlu.name;
    }

    const resolved = resolveFromOffer(draft, nlu, expecting);
    if (resolved) {
        if (resolved.field === "startMin") {
            draft.startMin = resolved.value;
            draft.timeExplicit = true;
        }
        if (resolved.field === "date" && resolved.value !== draft.date) {
            draft.date = resolved.value;
            draft.startMin = null;
        }
        if (resolved.field === "serviceId" && resolved.value !== draft.serviceId) {
            draft.serviceId = resolved.value;
            draft.startMin = null;
        }

        logger.info("Resolved a pick from what was offered", {
            event: "chat.pick",
            field: resolved.field,
            value: resolved.value,
            via: resolved.via,
            ordinal: nlu.ordinal ?? null,
        });
    }

    if (nlu.intent === INTENT.DENY && nlu.changeTarget) {
        if (nlu.changeTarget !== "service") acknowledge("ack_change", {});

        if (nlu.changeTarget === "service") {
            Object.assign(draft, EMPTY_DRAFT);
            draft.offeredServices = services.map((s) => s.id);
            return respond("ask_service", { services: menu }, "service");
        }

        if (nlu.changeTarget === "date" && draft.serviceId) {
            draft.date = null;
            draft.startMin = null;
            draft.timeExplicit = false;
            const service = services.find((s) => s.id === draft.serviceId);
            if (service) return askForDate(service);
        }

        if (nlu.changeTarget === "time" && draft.serviceId && draft.date) {
            draft.startMin = null;
            draft.timeExplicit = false;
            const service = services.find((s) => s.id === draft.serviceId);
            const open = await listAvailability(draft.serviceId, draft.date);
            if (service && open.length) {
                return offerTimes(service, open, "ask_time", { date: formatDateLong(draft.date) });
            }
        }
    }

    if (nlu.intent === INTENT.DENY) {
        if (expecting === "confirm" && draft.serviceId && draft.date) {
            draft.startMin = null;
            draft.timeExplicit = false;

            const stillOpen = await listAvailability(draft.serviceId, draft.date);
            if (stillOpen.length) {
                draft.offeredTimes = stillOpen.slice(0, TIME_CHOICES).map((slot) => slot.startMin);
                draft.offeredDates = [];
                return respond(
                    "reject_options",
                    {
                        date: formatDateLong(draft.date),
                        times: numberedTimes(draft.offeredTimes),
                    },
                    "time",
                );
            }
        } else if (expecting === "confirm") {
            draft.startMin = null;
            draft.timeExplicit = false;
        } else if (expecting === "time" && draft.date) {
            const nextDates = await nextOpenDates(draft.serviceId, draft.date, DATE_CHOICES, 21);
            if (nextDates.length) {
                draft.date = null;
                draft.startMin = null;
                draft.offeredDates = nextDates;
                draft.offeredTimes = [];
                return respond("ask_date", { dates: numberedDates(nextDates) }, "date");
            }
        }
    }

    if (!draft.serviceId) {
        draft.offeredServices = services.map((s) => s.id);
        const key = nlu.intent === INTENT.UNKNOWN ? "unknown_service" : "ask_service";
        return respond(key, { services: menu }, "service");
    }

    const service = services.find((s) => s.id === draft.serviceId);
    if (!service) {
        draft.serviceId = null;
        draft.offeredServices = services.map((s) => s.id);
        return respond("unknown_service", { services: menu }, "service");
    }

    if (!draft.date) {
        return askForDate(service, nlu.searchFrom);
    }

    if (daysBetween(todayISO(), draft.date) > config.salon.bookingHorizonDays) {
        const requested = formatDateLong(draft.date);
        draft.date = null;
        draft.startMin = null;
        return respond("date_too_far", { date: requested, days: config.salon.bookingHorizonDays }, "date");
    }

    const open = await listAvailability(draft.serviceId, draft.date, nlu.period);

    if (!open.length) {
        const requestedDate = formatDateLong(draft.date);
        const dates = await nextOpenDates(draft.serviceId, draft.date, DATE_CHOICES, 21);

        draft.date = null;
        draft.startMin = null;
        draft.offeredDates = dates;
        draft.offeredTimes = [];

        if (!dates.length) {
            return respond("no_dates", { service: service.name, date: requestedDate }, "date");
        }

        return respond(
            "no_slots",
            { service: service.name, date: requestedDate, dates: numberedDates(dates) },
            "date",
        );
    }

    const chosen = draft.timeExplicit ? open.find((s) => s.startMin === draft.startMin) : null;

    if (!chosen) {
        if (draft.timeExplicit && draft.startMin !== null && draft.startMin !== undefined) {
            const requested = minutesToLabel(draft.startMin);
            const alternatives = await suggestAlternatives(draft.serviceId, draft.date, draft.startMin);
            draft.startMin = null;
            return offerTimes(service, alternatives, "slot_taken", { time: requested });
        }

        return offerTimes(service, open, "ask_time", { date: formatDateLong(draft.date) });
    }

    if (!draft.name) {
        return respond("ask_name", {}, "name");
    }

    const wantsToBook = nlu.intent === INTENT.CONFIRM
        || (nlu.intent === INTENT.AFFIRM && expecting === "confirm");

    if (!wantsToBook) {
        return respond(
            "summary",
            {
                name: draft.name,
                service: service.name,
                date: formatDateLong(draft.date),
                time: minutesToLabel(draft.startMin),
            },
            "confirm",
        );
    }

    await upsertCustomer(phone, { name: draft.name, lang });

    const booking = await createBooking({
        customerId: customer.id,
        serviceId: draft.serviceId,
        date: draft.date,
        startMin: draft.startMin,
    });

    if (!booking) {
        const requested = minutesToLabel(draft.startMin);
        const alternatives = await suggestAlternatives(draft.serviceId, draft.date, draft.startMin);
        draft.startMin = null;
        return offerTimes(service, alternatives, "slot_taken", { time: requested });
    }

    const full = await findBooking(booking.id);
    const payload = bookingPayload(full, config.salon.timezone);

    const confirmed = {
        reference: payload.reference,
        service: service.name,
        date: formatDateLong(draft.date),
        time: minutesToLabel(draft.startMin),
    };

    Object.assign(draft, EMPTY_DRAFT);
    return respond("booked", confirmed, null, { bookingId: booking.id, booking: payload });
}

module.exports = { handle, getConversation };
