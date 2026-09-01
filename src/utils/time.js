const { config } = require("../config/env");
const { WEEKDAY_LABELS } = require("../constants/booking");

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function todayISO() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: config.salon.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

function nowMinutes() {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: config.salon.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(new Date());
    const [h, m] = parts.split(":").map(Number);
    return h * 60 + m;
}

function toISODate(value) {
    if (!value) return null;
    if (typeof value === "string") return value.slice(0, 10);
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: config.salon.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(value);
}

function addDays(iso, days) {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function weekdayOf(iso) {
    return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

function weekdayLabel(iso) {
    return WEEKDAY_LABELS[weekdayOf(iso)];
}

function isValidISODate(iso) {
    return typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(`${iso}T00:00:00Z`));
}

function daysBetween(fromISO, toISO) {
    const a = Date.parse(`${fromISO}T00:00:00Z`);
    const b = Date.parse(`${toISO}T00:00:00Z`);
    return Math.round((b - a) / 86400000);
}

function minutesToLabel(minutes) {
    const h24 = Math.floor(minutes / 60);
    const m = minutes % 60;
    const suffix = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function labelToMinutes(label) {
    const match = String(label).trim().match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const suffix = (match[3] || "").toLowerCase();
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
    if (hour > 23 || minute > 59) return null;
    return hour * 60 + minute;
}

function formatDateLong(iso) {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatTimeList(slots) {
    return slots.map((s) => minutesToLabel(s.startMin)).join("\n");
}

function formatDateShort(iso) {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${WEEKDAY_LABELS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function numberedTimes(minutes) {
    return minutes.map((m, i) => `${i + 1}. ${minutesToLabel(m)}`).join("\n");
}

function numberedDates(dates) {
    return dates.map((d, i) => `${i + 1}. ${formatDateShort(d)}`).join("\n");
}

module.exports = {
    todayISO,
    nowMinutes,
    toISODate,
    addDays,
    weekdayOf,
    weekdayLabel,
    isValidISODate,
    daysBetween,
    minutesToLabel,
    labelToMinutes,
    formatDateLong,
    formatTimeList,
    formatDateShort,
    numberedTimes,
    numberedDates,
};
