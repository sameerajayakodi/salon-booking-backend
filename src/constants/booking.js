const SLOT_STATUS = Object.freeze({
    OPEN: "OPEN",
    BOOKED: "BOOKED",
});

const BOOKING_STATUS = Object.freeze({
    CONFIRMED: "CONFIRMED",
    CANCELLED: "CANCELLED",
});

const BOOKING_SOURCE = Object.freeze({
    WHATSAPP: "WHATSAPP",
    MANUAL: "MANUAL",
});

const LANGUAGES = Object.freeze(["en", "si", "ta", "sien"]);

const INTENT = Object.freeze({
    BOOK: "BOOK",
    CONFIRM: "CONFIRM",
    AFFIRM: "AFFIRM",
    DENY: "DENY",
    CANCEL: "CANCEL",
    QUERY: "QUERY",
    ASK: "ASK",
    GREETING: "GREETING",
    UNKNOWN: "UNKNOWN",
});

const PERIOD = Object.freeze({
    MORNING: [0, 719],
    AFTERNOON: [720, 1019],
    EVENING: [1020, 1439],
    LATE: [780, 1439],
    AM: [0, 719],
    PM: [720, 1439],
});

const WEEKDAY_LABELS = Object.freeze([
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
]);

const EMPTY_DRAFT = Object.freeze({
    serviceId: null,
    date: null,
    startMin: null,
    timeExplicit: false,
    name: null,
    suggestedServiceId: null,
    offeredTimes: [],
    offeredDates: [],
    lastKey: null,
    repeat: 0,
});

const MAX_REPEAT_BEFORE_OPTIONS = 1;

module.exports = {
    SLOT_STATUS,
    BOOKING_STATUS,
    BOOKING_SOURCE,
    LANGUAGES,
    INTENT,
    PERIOD,
    WEEKDAY_LABELS,
    EMPTY_DRAFT,
    MAX_REPEAT_BEFORE_OPTIONS,
};
