const logger = require("../log/logger");
const { config } = require("../config/env");
const { knowledgeLines } = require("../config/salonKnowledge");
const { INTENT, PERIOD } = require("../constants/booking");
const { todayISO, addDays, weekdayOf, weekdayLabel, isValidISODate, daysBetween } = require("../utils/time");
const { findMonth, findDayNumber, stripDateTokens, levenshtein, containsWord } = require("../utils/dateWords");

const NEWLINE = "\n";

const SINHALA_SCRIPT = /[඀-෿]/;
const TAMIL_SCRIPT = /[஀-௿]/;

const SINGLISH_MARKERS = [
    "heta", "adha", "anidda", "hawasa", "ude", "dawal", "raa", "eka", "ekak", "ekakda",
    "karanna", "karaganna", "puluwanda", "mokakda", "monawada", "dawasak", "welawa",
    "welawak", "oney", "hari", "hondai", "kohomada", "thiyenawada", "denna",
    "mata", "oyata", "ganna", "balanna", "nathi", "naththam",
    "ayubowan", "aayubowan", "ayubowen", "subha", "istuti", "sthuthi",
];

const TAMIL_MARKERS = ["vanakkam", "nandri", "vanakam"];

const DAY_WORDS = {
    "today": 0, "අද": 0, "adha": 0, "ada": 0, "indru": 0, "இன்று": 0,
    "tomorrow": 1, "හෙට": 1, "heta": 1, "naalai": 1, "நாளை": 1,
    "day after tomorrow": 2, "අනිද්දා": 2, "anidda": 2, "aniddha": 2, "நாளை மறுநாள்": 2,
};

const WEEKDAY_WORDS = {
    sunday: 0, "ඉරිදා": 0, "ஞாயிறு": 0, irida: 0,
    monday: 1, "සඳුදා": 1, "திங்கள்": 1, sanduda: 1,
    tuesday: 2, "අඟහරුවාදා": 2, "செவ்வாய்": 2, angaharuwada: 2,
    wednesday: 3, "බදාදා": 3, "புதன்": 3, badada: 3,
    thursday: 4, "බ්‍රහස්පතින්දා": 4, "வியாழன்": 4, brahaspathinda: 4,
    friday: 5, "සිකුරාදා": 5, "வெள்ளி": 5, sikurada: 5,
    saturday: 6, "සෙනසුරාදා": 6, "சனி": 6, senasurada: 6,
};

const PERIOD_WORDS = {
    morning: "MORNING", "උදේ": "MORNING", ude: "MORNING", kaalai: "MORNING", "காலை": "MORNING",
    noon: "AFTERNOON", afternoon: "AFTERNOON", "දවල්": "AFTERNOON", dawal: "AFTERNOON",
    pagal: "AFTERNOON", "மதியம்": "AFTERNOON",
    "හවස": "LATE", hawasa: "LATE", hawaha: "LATE", maalai: "LATE", "மாலை": "LATE",
    am: "AM", pm: "PM",
    evening: "EVENING", night: "EVENING", "රාත්‍රී": "EVENING", raa: "EVENING", "இரவு": "EVENING",
};

const CONFIRM_WORDS = new Set([
    "confirm", "confirmed", "book it", "book karanna", "book the appointment",
    "please book", "go ahead", "confirm karanna", "confirm eka",
    "තහවුරු කරන්න", "book කරන්න", "உறுதி",
]);

const AFFIRM_WORDS = new Set([
    "ok", "oki", "okay", "okey", "k", "yes", "yeah", "yep", "yup", "sure", "fine",
    "good", "great", "perfect", "that one", "that works", "works", "alright",
    "eka damu", "eka damu ban", "eka hari", "ekama", "hari", "hari hari", "hondai",
    "hoda", "ela", "ow", "howa", "meka hari", "eka ganna", "eka",
    "හරි", "ඔව්", "හොඳයි", "එක හරි", "එක දමු",
    "sari", "seri", "aam", "aama", "ok pa", "ஆம்", "சரி", "நல்லது",
]);

const DENY_WORDS = new Set([
    "no", "nope", "nah", "not that", "another", "another one", "different",
    "na", "naha", "epa", "beri", "නෑ", "එපා", "නැහැ",
    "illai", "vendam", "இல்லை", "வேண்டாம்",
]);

const CANCEL_WORDS = new Set([
    "cancel", "cancel it", "cancel booking", "stop", "forget it", "never mind",
    "cancel karanna", "epa cancel", "අවලංගු", "ரத்து",
]);

const ORDINAL_WORDS = {
    first: 0, "1st": 0, "the first": 0, "first one": 0, "පළමු": 0, "modalavathu": 0,
    second: 1, "2nd": 1, "the second": 1, "second one": 1, "දෙවන": 1,
    third: 2, "3rd": 2, "the third": 2, "third one": 2, "තෙවන": 2,
    fourth: 3, "4th": 3,
    last: -1, "the last": -1, "last one": -1, "අන්තිම": -1,
};

const ORDINAL_WHOLE_MESSAGE = { one: 0, two: 1, three: 2, four: 3, five: 4, six: 5 };

const NUMBER_WORDS = (() => {
    const ones = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
        "sixteen", "seventeen", "eighteen", "nineteen"];
    const map = {};
    ones.forEach((w, i) => { map[w] = i + 1; });
    teens.forEach((w, i) => { map[w] = i + 10; });
    map.twenty = 20;
    map.thirty = 30;
    ones.slice(0, 9).forEach((w, i) => {
        map[`twenty ${w}`] = 21 + i;
        map[`twenty-${w}`] = 21 + i;
    });
    map["thirty one"] = 31;
    map["thirty-one"] = 31;
    return map;
})();

const SERVICE_QUERY_PATTERNS = [
    "what services", "which services", "what service", "services you",
    "about services", "know about service", "list of service", "list services",
    "what do you offer", "what can you do", "your services", "service list",
    "services conduct", "services available", "show services", "menu",
    "mona service", "service mokakda", "services mokakda",
    "සේවා මොනවාද", "සේවාවන් මොනවාද", "මොන සේවාද",
    "என்ன சேவை", "சேவைகள் என்ன",
];

const GREETING_WORDS = new Set([
    "hi", "hii", "hiii", "hie", "hy", "hyy", "hai",
    "hello", "helo", "hellow", "helloo", "hallo", "hlw", "hlo",
    "hey", "heyy", "hai ban", "hi there", "hello there", "hey there",
    "good morning", "good afternoon", "good evening", "good day",
    "ayubowan", "ayubowan!", "aayubowan", "vanakkam", "start", "hi hi",
    "ආයුබොවන්", "ආයුබෝවන්", "හලෝ", "හායි", "හෙලෝ", "வணக்கம்", "ஹலோ",
]);

const QUESTION_OPENERS = [
    "how", "what", "where", "why", "who", "which", "can i", "can we", "could i",
    "do you", "does it", "does the", "did you", "is it", "is there", "are you",
    "are there", "will i", "will it", "would i", "should i", "may i", "tell me about",
    "kohomada", "koheda", "kiyada", "kiiyada", "mokada", "monawada", "kochchara",
    "කොහොමද", "කොහෙද", "කීයද", "මොකක්ද",
    "எப்படி", "என்ன", "எங்கே", "எத்தனை",
];

function looksLikeQuestion(text) {
    const stripped = String(text).trim().toLowerCase().replace(/[.!?]+$/, "");
    if (stripped.length < 4) return false;
    return QUESTION_OPENERS.some((opener) => stripped.startsWith(opener));
}

const GREETING_FUZZY_TARGETS = ["hello", "hey", "hai"];

function isGreeting(normalized) {
    if (GREETING_WORDS.has(normalized)) return true;

    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length !== 1) return false;

    const token = tokens[0];
    if (token.length < 4 || token.length > 8) return false;
    if (!/^[a-z]+$/.test(token)) return false;

    return GREETING_FUZZY_TARGETS.some((target) => levenshtein(token, target) <= 1);
}

function detectLanguage(text) {
    if (SINHALA_SCRIPT.test(text)) return "si";
    if (TAMIL_SCRIPT.test(text)) return "ta";

    const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    if (words.some((w) => TAMIL_MARKERS.includes(w))) return "ta";

    const hits = words.filter((w) => SINGLISH_MARKERS.includes(w)).length;
    return hits > 0 ? "sien" : null;
}

const SERVICE_FUZZY_MIN_LENGTH = 5;
const SERVICE_FUZZY_MAX_DISTANCE = 2;

function fuzzyService(haystack, services) {
    const words = haystack.split(/[^\p{L}\p{M}]+/u).filter((w) => w.length >= SERVICE_FUZZY_MIN_LENGTH);
    if (!words.length) return null;

    let best = null;
    let bestDistance = SERVICE_FUZZY_MAX_DISTANCE + 1;

    for (const service of services) {
        for (const candidate of [service.name, ...(service.aliases || [])]) {
            const needle = String(candidate).toLowerCase().trim();
            if (needle.length < SERVICE_FUZZY_MIN_LENGTH || needle.includes(" ")) continue;

            for (const word of words) {
                if (word.charAt(0) !== needle.charAt(0)) continue;

                const allowed = word.length >= 7 ? SERVICE_FUZZY_MAX_DISTANCE : 1;
                const distance = levenshtein(word, needle);

                if (distance < bestDistance && distance <= allowed) {
                    best = service;
                    bestDistance = distance;
                }
            }
        }
    }

    return best;
}

function matchService(text, services) {
    const haystack = text.toLowerCase();
    let best = null;
    let bestLength = 0;

    for (const service of services) {
        const candidates = [service.name, ...(service.aliases || [])];
        for (const candidate of candidates) {
            const needle = String(candidate).toLowerCase().trim();
            if (needle.length < 3 || !haystack.includes(needle)) continue;
            if (needle.length > bestLength) {
                best = service;
                bestLength = needle.length;
            }
        }
    }

    return best || fuzzyService(haystack, services);
}

const MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
];

function normaliseYear(year, month, day) {
    const today = todayISO();
    const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!isValidISODate(candidate)) return null;
    if (daysBetween(today, candidate) >= 0) return candidate;

    const nextYear = `${year + 1}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isValidISODate(nextYear) ? nextYear : null;
}

function matchDate(text) {
    const haystack = text.toLowerCase();
    const today = todayISO();
    const currentYear = Number(today.slice(0, 4));

    const explicit = haystack.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (explicit && isValidISODate(explicit[1])) return explicit[1];

    const dayEntries = Object.entries(DAY_WORDS).sort((a, b) => b[0].length - a[0].length);
    for (const [word, offset] of dayEntries) {
        if (containsWord(haystack, word)) return addDays(today, offset);
    }

    const inDays = haystack.match(/\b(?:in|after)\s+(\d{1,2})\s*(?:days?|දවස්|நாட்)\b/);
    if (inDays) return addDays(today, Number(inDays[1]));

    const month = findMonth(haystack);
    if (month) {
        const day = findDayNumber(haystack, month.token);
        if (day) {
            const resolved = normaliseYear(currentYear, month.index + 1, day);
            if (resolved) return resolved;
        }
    }

    const numeric = haystack.match(/\b(\d{1,2})\s*[/\-.]\s*(\d{1,2})(?:\s*[/\-.]\s*(\d{2,4}))?\b/);
    if (numeric) {
        const a = Number(numeric[1]);
        const b = Number(numeric[2]);
        let year = numeric[3] ? Number(numeric[3]) : currentYear;
        if (year < 100) year += 2000;

        let day = a;
        let month = b;
        if (a > 12 && b <= 12) {
            day = a;
            month = b;
        } else if (b > 12 && a <= 12) {
            day = b;
            month = a;
        }

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const resolved = normaliseYear(year, month, day);
            if (resolved) return resolved;
        }
    }

    const wantsNextWeek = /\bnext week\b|ලබන සතියේ|அடுத்த வாரம்/.test(haystack);
    if (wantsNextWeek && !Object.keys(WEEKDAY_WORDS).some((w) => containsWord(haystack, w))) {
        const currentWeekday = weekdayOf(today);
        return addDays(today, ((1 - currentWeekday + 7) % 7) || 7);
    }

    for (const [word, weekday] of Object.entries(WEEKDAY_WORDS)) {
        if (!containsWord(haystack, word)) continue;
        const nextModifier = /\bnext\b|ලබන|அடுத்த/.test(haystack);
        const currentWeekday = weekdayOf(today);
        let delta = (weekday - currentWeekday + 7) % 7;
        if (delta === 0) delta = 7;
        if (nextModifier && delta < 7) delta += 7;
        return addDays(today, delta);
    }

    return null;
}

function firstOfMonth(year, month) {
    return year + "-" + String(month).padStart(2, "0") + "-01";
}

function matchMonthWindow(text) {
    const haystack = text.toLowerCase();
    const today = todayISO();
    const year = Number(today.slice(0, 4));
    const month = Number(today.slice(5, 7));

    if (haystack.includes("next month") || haystack.includes("coming month")) {
        return month === 12 ? firstOfMonth(year + 1, 1) : firstOfMonth(year, month + 1);
    }

    if (haystack.includes("this month")) return today;

    const named = findMonth(haystack);
    if (named && findDayNumber(haystack, named.token) === null) {
        const target = named.index + 1;
        const candidateYear = target < month ? year + 1 : year;
        const first = firstOfMonth(candidateYear, target);
        return daysBetween(today, first) >= 0 ? first : today;
    }

    return null;
}

function matchOrdinal(text) {
    const haystack = text.toLowerCase().trim().replace(/[.!?]+$/, "");

    if (Object.prototype.hasOwnProperty.call(ORDINAL_WHOLE_MESSAGE, haystack)) {
        return ORDINAL_WHOLE_MESSAGE[haystack];
    }

    const entries = Object.entries(ORDINAL_WORDS).sort((a, b) => b[0].length - a[0].length);
    for (const [word, index] of entries) {
        if (new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack)) {
            return index;
        }
    }

    const bare = haystack.match(/^(?:number\s*)?(\d{1,2})$/);
    if (bare) {
        const n = Number(bare[1]);
        if (n >= 1 && n <= 20) return n - 1;
    }

    return null;
}

function matchPeriod(text) {
    const haystack = text.toLowerCase();
    const entries = Object.entries(PERIOD_WORDS).sort((a, b) => b[0].length - a[0].length);
    for (const [word, period] of entries) {
        if (containsWord(haystack, word)) return period;
    }
    return null;
}

function matchTime(text, period) {
    const cleaned = stripDateTokens(text);
    const match = cleaned.match(/\b(\d{1,2})[:.]?(\d{2})?\s*(a\.?m\.?|p\.?m\.?)?\b/);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    const suffix = (match[3] || "").replace(/\./g, "");

    if (minute > 59) return null;
    if (hour > 23) return null;

    if (suffix.startsWith("p") && hour < 12) hour += 12;
    else if (suffix.startsWith("a") && hour === 12) hour = 0;
    else if (!suffix && hour <= 11) {
        if (period === "AFTERNOON" || period === "EVENING" || period === "LATE") {
            if (hour >= 1 && hour <= 11) hour += 12;
        } else if (period !== "MORNING" && hour >= 1 && hour <= 6) {
            hour += 12;
        }
    }

    if (hour > 23) return null;
    return hour * 60 + minute;
}

function looksLikeName(text) {
    const trimmed = text.trim();
    if (!trimmed || /\d/.test(trimmed)) return false;
    if (isGreeting(trimmed.toLowerCase().replace(/[.!?]+$/, ""))) return false;
    if (isServiceQuery(trimmed)) return false;
    if (matchTopics(trimmed).length > 0) return false;
    const words = trimmed.split(/\s+/);
    if (words.length > 3 || trimmed.length > 40) return false;
    const parts = trimmed.toLowerCase().split(/\s+/);
    if (parts.some((w) => NAME_STOPWORDS.has(w))) return false;
    return /^[\p{L}\p{M}\s.'-]+$/u.test(trimmed);
}

const NAME_LEAD_INS = [
    "my name is", "name is", "the name is", "booking for", "book for", "it is for",
    "its for", "it's for", "this is for", "call me", "i am", "i'm", "im", "this is",
    "myself", "for",
    "mage nama", "mama", "nama",
    "මගේ නම", "නම",
    "என் பெயர்", "பெயர்",
];

const NAME_STOPWORDS = new Set([
    "a", "an", "the", "me", "my", "us", "you", "her", "him", "them", "myself",
    "today", "tomorrow", "morning", "afternoon", "evening", "night", "now",
    "one", "two", "three", "please", "plz", "sure", "ok", "appointment", "booking",
    "slot", "time", "date", "salon", "service", "pm", "am",
    "location", "parking", "price", "prices", "cost", "hours", "address", "directions",
    "something", "anything", "some", "sort", "out", "in", "at", "on", "to", "and",
]);

function isWordChar(ch) {
    return ch !== undefined && /[\p{L}\p{M}\p{N}]/u.test(ch);
}

function lastBoundedIndexOf(haystack, needle) {
    let at = haystack.lastIndexOf(needle);
    while (at > -1) {
        const before = at === 0 ? undefined : haystack[at - 1];
        const after = haystack[at + needle.length];
        if (!isWordChar(before) && !isWordChar(after)) return at;
        if (at === 0) break;
        at = haystack.lastIndexOf(needle, at - 1);
    }
    return -1;
}

function matchInlineName(text, services) {
    const lowered = text.toLowerCase();
    const aliasWords = new Set();
    for (const service of services) {
        for (const candidate of [service.name, ...(service.aliases || [])]) {
            for (const word of String(candidate).toLowerCase().split(/\s+/)) aliasWords.add(word);
        }
    }

    const leadIns = [...NAME_LEAD_INS].sort((a, b) => b.length - a.length);

    for (const leadIn of leadIns) {
        const at = lastBoundedIndexOf(lowered, leadIn);
        if (at === -1) continue;

        const tail = text
            .slice(at + leadIn.length)
            .trim()
            .replace(/^[:,\-–]\s*/, "")
            .replace(/[.,!?]+$/, "");

        if (!tail) continue;

        const words = tail.split(/\s+/);
        if (words.length > 2) continue;

        const candidate = words.join(" ");
        const parts = candidate.toLowerCase().split(/\s+/);

        if (
            looksLikeName(candidate)
            && !parts.some((w) => NAME_STOPWORDS.has(w))
            && !parts.some((w) => aliasWords.has(w))
        ) {
            return candidate;
        }
    }

    return null;
}

function cleanName(text) {
    return text
        .trim()
        .replace(/^(my name is|i am|im|mage nama|මගේ නම|என் பெயர்)\s*/i, "")
        .replace(/[.,!]+$/, "")
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function isBareNumber(text) {
    return /^\s*(?:number\s*)?\d{1,2}\s*$/.test(text);
}

const PRICE_PATTERNS = [
    "price", "prices", "pricing", "cost", "costs", "how much", "rate", "rates",
    "charge", "charges", "fee", "fees", "gaana", "gaanak", "mudal",
    "ගාණ", "මිල", "விலை",
];

function isPriceQuery(text) {
    const haystack = text.toLowerCase();
    return PRICE_PATTERNS.some((p) => haystack.includes(p));
}

const TOPIC_PATTERNS = [
    { topic: "price", phrases: PRICE_PATTERNS },
    { topic: "location", phrases: [
        "where are you", "where r u", "where is the salon", "where is your salon",
        "where exactly", "your location", "the location", "salon location", "location",
        "address", "adress", "directions", "direction", "how to get there",
        "how do i get", "how can i get", "how to come", "how do i come",
        "find you", "find the salon", "google map", "google maps", "map link",
        "send me the map", "send the location", "which area", "what area", "nearest",
        "koheda", "kohedha", "kohe da", "thiyenne kohe", "thiyenne koheda",
        "enne kohomada", "එන්නෙ කොහොමද", "කොහෙද", "ලිපිනය", "සිතියම",
        "முகவரி", "எங்கே", "எப்படி வர",
    ] },
    { topic: "parking", phrases: [
        "parking", "park my car", "park the car", "park my vehicle", "car park",
        "somewhere to park", "vehicle park", "wahana park", "වාහන නවත්", "පාර්කින්",
        "வாகனம் நிறுத்த", "பார்க்கிங்",
    ] },
    { topic: "hours", phrases: [
        "opening hour", "opening time", "open hour", "working hour", "business hour",
        "hours of operation", "what time do you open", "what time do you close",
        "what time you open", "what time you close", "when do you open",
        "when do you close", "when are you open", "are you open", "you open on",
        "open on sunday", "open on sundays", "closing time", "what time close",
        "till what time", "until what time", "how late are you",
        "kiyata da open", "kiyatada open", "kiyata wahanne", "open wenne kiyatada",
        "විවෘත", "වහන්නෙ", "වේලාවන්", "திறக்கும்", "மூடும்", "நேரம் என்ன",
    ] },
    { topic: "contact", phrases: [
        "phone number", "contact number", "telephone", "hotline", "land line",
        "landline", "your number", "call you", "call the salon", "email",
        "contact detail", "contact details", "how can i contact", "how do i contact",
        "get in touch", "reach you", "durakathana", "දුරකථන", "අංකය",
        "தொலைபேசி", "எண் என்ன",
    ] },
    { topic: "aftercare", phrases: [
        "aftercare", "after care", "after the facial", "after the treatment",
        "after treatment", "care after", "what should i do after", "what to do after",
        "look after", "maintain", "tips after", "post treatment", "post care",
        "passe mokada", "පසුව මොකද", "பராமரிப்பு",
    ] },
    { topic: "cancellation", phrases: [
        "cancellation policy", "cancel my appointment", "cancel my booking",
        "cancel the appointment", "cancel the booking", "reschedule", "postpone",
        "change my appointment", "move my appointment", "if i am late",
        "if i'm late", "if im late", "arrive late", "come late", "running late",
        "notice do you need", "how much notice",
        "cancel karanna", "wenas karanna puluwanda", "අවලංගු",
        "ரத்து", "தாமதமாக",
    ] },
    { topic: "payment", phrases: [
        "payment method", "how do i pay", "how can i pay", "how to pay",
        "do you accept card", "accept cards", "card payment", "credit card",
        "debit card", "visa", "mastercard", "master card", "cash only",
        "pay by card", "pay by cash", "by card", "with card", "card only",
        "take card", "cards accepted", "accept cash", "pay with",
        "take cash", "deposit", "advance payment", "pay in advance", "pay online",
        "gewanne kohomada", "ගෙවීම", "பணம் செலுத்த",
    ] },
    { topic: "walkin", phrases: [
        "walk in", "walk-in", "walkin", "without appointment", "without booking",
        "without a booking", "just come", "drop in", "come directly",
        "booking nathuwa", "appointment nathuwa", "වෙන් නොකර",
        "முன்பதிவு இல்லாமல்",
    ] },
];

const BOOKING_NUDGES = [
    "lets book", "let's book", "let us book", "book it", "book me", "book that",
    "book this", "book please", "book now", "go ahead", "sounds good", "sounds great",
    "that works", "reserve it", "reserve that", "reserve please", "make the booking",
    "yes please", "yes book", "ok book", "okay book", "i would like to book",
    "i want to book", "id like to book", "i'd like to book",
    "book karamu", "book karanna", "eka book", "hari book", "book eka danna",
    "වෙන් කරන්න",
];

function isBookingNudge(text) {
    const haystack = text.toLowerCase();
    return BOOKING_NUDGES.some((phrase) => haystack.includes(phrase));
}

const MAX_TOPICS = 3;

function matchTopics(text) {
    const haystack = text.toLowerCase();
    const hits = [];

    for (const entry of TOPIC_PATTERNS) {
        let at = -1;
        for (const phrase of entry.phrases) {
            const found = haystack.indexOf(phrase);
            if (found !== -1 && (at === -1 || found < at)) at = found;
        }
        if (at !== -1) hits.push({ topic: entry.topic, at });
    }

    return hits.sort((a, b) => a.at - b.at).slice(0, MAX_TOPICS).map((hit) => hit.topic);
}

function matchTopic(text) {
    const topics = matchTopics(text);
    return topics.length ? topics[0] : null;
}

const CHANGE_REQUESTS = [
    { target: "date", phrases: [
        "another date", "another day", "other date", "other day", "different date",
        "different day", "change the date", "change date", "some other day", "next day",
        "wena dawas", "wena daw", "dawasak wenas",
        "වෙන දවස", "වෙනත් දිනය",
    ] },
    { target: "time", phrases: [
        "another time", "other time", "different time", "change the time", "change time",
        "another slot", "different slot", "wena welaw", "welawak wenas",
        "වෙන වේල",
    ] },
    { target: "service", phrases: [
        "another service", "other service", "different service", "change the service",
        "change service", "wena service", "wenas service",
        "වෙන සේව", "වෙනත් සේව",
    ] },
];

function matchChangeRequest(text) {
    const haystack = text.toLowerCase();
    for (const entry of CHANGE_REQUESTS) {
        if (entry.phrases.some((phrase) => haystack.includes(phrase))) return entry.target;
    }
    return null;
}

const SERVICE_QUERY_WHOLE = new Set([
    "services", "service", "services?", "service list", "services list",
    "price list", "prices", "price", "rates", "treatments", "options",
    "what you have", "what do you have", "show me services", "show services",
    "sewa", "sewawan", "සේවා", "සේවාවන්", "சேவைகள்",
]);

function isServiceQuery(text) {
    const haystack = text.toLowerCase();
    const whole = haystack.trim().replace(/[.!?]+$/, "");
    if (SERVICE_QUERY_WHOLE.has(whole)) return true;
    return SERVICE_QUERY_PATTERNS.some((pattern) => haystack.includes(pattern));
}

function rulesPass(text, draft, services, expecting) {
    const normalized = text.trim().toLowerCase().replace(/[!.?]+$/, "");
    const result = { language: detectLanguage(text), confidence: 1 };

    const ordinal = matchOrdinal(text);
    if (ordinal !== null) result.ordinal = ordinal;

    const topics = matchTopics(text);
    if (topics.length) {
        const about = matchService(text, services);
        result.intent = INTENT.ASK;
        result.topic = topics[0];
        result.topics = topics;
        result.resolved = true;
        if (about) result.aboutServiceId = about.id;
        return result;
    }

    if (isServiceQuery(text)) {
        result.intent = INTENT.QUERY;
        result.resolved = true;
        return result;
    }

    if (CANCEL_WORDS.has(normalized)) {
        result.intent = INTENT.CANCEL;
        result.resolved = true;
        return result;
    }

    if (CONFIRM_WORDS.has(normalized)) {
        result.intent = INTENT.CONFIRM;
        result.resolved = true;
        return result;
    }

    if (AFFIRM_WORDS.has(normalized)) {
        result.intent = INTENT.AFFIRM;
        result.resolved = true;
        return result;
    }

    if (DENY_WORDS.has(normalized)) {
        result.intent = INTENT.DENY;
        result.resolved = true;
        return result;
    }

    if (isGreeting(normalized)) {
        result.intent = INTENT.GREETING;
        result.resolved = true;
        return result;
    }

    const service = matchService(text, services);
    const date = matchDate(text);
    const period = matchPeriod(text);
    const startMin = matchTime(text, period);

    if (service) result.serviceId = service.id;
    if (date) result.date = date;

    if (!date) {
        const window = matchMonthWindow(text);
        if (window) result.searchFrom = window;
    }
    if (period) result.period = period;

    if (startMin !== null && !isBareNumber(text)) {
        result.startMin = startMin;
        result.timeExplicit = /am|pm|[:.]\s*\d{2}/i.test(text);
    }

    if (!draft.name) {
        const inline = matchInlineName(text, services);
        if (inline) result.name = cleanName(inline);
    }

    if (isBookingNudge(text) && !date && startMin === null && !service) {
        result.intent = INTENT.AFFIRM;
        result.resolved = true;
        return result;
    }

    const changeTarget = matchChangeRequest(text);
    if (changeTarget && !date && startMin === null && !service) {
        result.intent = INTENT.DENY;
        result.changeTarget = changeTarget;
        result.resolved = true;
        return result;
    }

    const namePosition = expecting === "name"
        || (!draft.name && (expecting === "time" || expecting === "confirm"));
    if (namePosition && !result.name && !service && !date && period === null && startMin === null && looksLikeName(text)) {
        result.intent = INTENT.BOOK;
        result.name = cleanName(text);
        result.resolved = true;
        return result;
    }

    const informational = looksLikeQuestion(text)
        && !date
        && startMin === null
        && ordinal === null;

    if (informational) {
        result.intent = INTENT.ASK;
        result.resolved = true;
        if (service) result.aboutServiceId = service.id;
        delete result.serviceId;
        delete result.period;
        delete result.searchFrom;
        return result;
    }

    const resolvedSomething = service || date || period || startMin !== null || result.name || result.searchFrom;
    if (resolvedSomething) {
        result.intent = INTENT.BOOK;
        result.resolved = true;
        return result;
    }

    if (ordinal !== null && (expecting === "time" || expecting === "date")) {
        result.intent = INTENT.AFFIRM;
        result.resolved = true;
        return result;
    }

    result.intent = INTENT.UNKNOWN;
    result.resolved = false;
    return result;
}

function buildPrompt(text, draft, services, expecting) {
    const today = todayISO();
    const catalog = services
        .map((s) => `id=${s.id} name="${s.name}" aliases=${JSON.stringify(s.aliases || [])}`)
        .join("\n");

    return [
        "You extract booking details from a salon customer's WhatsApp message.",
        "The customer may write in English, Sinhala, Tamil, or romanised Singlish.",
        "",
        `Today is ${today} (${weekdayLabel(today)}). Timezone ${config.salon.timezone}.`,
        "",
        "Services offered:",
        catalog,
        "",
        `Details already collected: ${JSON.stringify(draft)}`,
        `The assistant last asked the customer for: ${expecting || "nothing"}`,
        "",
        `Customer message: "${text}"`,
        "",
        "Reply with JSON only, no markdown, using exactly these keys:",
        "{",
        '  "language": "en" | "si" | "ta" | "sien",',
        '  "intent": "BOOK" | "CONFIRM" | "CANCEL" | "GREETING" | "UNKNOWN",',
        '  "serviceId": number or null,',
        '  "date": "YYYY-MM-DD" or null,',
        '  "startMin": minutes from midnight (0-1439) or null,',
        '  "period": "MORNING" | "AFTERNOON" | "EVENING" or null,',
        '  "name": string or null,',
        '  "confidence": number between 0 and 1',
        "}",
        "",
        "Rules:",
        "- Only use a serviceId from the list above. Use null if unsure.",
        "- Resolve relative dates such as tomorrow, heta, naalai, this Friday into a real date.",
        "- Never invent a time that the customer did not mention.",
        '- Use "sien" when the customer writes Sinhala words in Latin letters.',
        "- Set confidence below 0.5 when the message is unclear.",
    ].join("\n");
}

function parseModelJson(raw) {
    const cleaned = String(raw)
        .replace(/^\s*```(?:json)?/i, "")
        .replace(/```\s*$/, "")
        .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    try {
        return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
        return null;
    }
}

async function askGemini(text, draft, services, expecting) {
    if (!config.gemini.apiKey) {
        logger.warn("Gemini not configured, falling back to rules", { event: "nlu.gemini.skipped" });
        return null;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.gemini.timeoutMs);
    const startedAt = Date.now();

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: buildPrompt(text, draft, services, expecting) }] }],
                generationConfig: {
                    temperature: 0,
                    responseMimeType: "application/json",
                    maxOutputTokens: 512,
                    ...(config.gemini.thinkingLevel
                        ? { thinkingConfig: { thinkingLevel: config.gemini.thinkingLevel } }
                        : {}),
                },
            }),
        });

        if (!response.ok) {
            logger.error("Gemini request failed", {
                event: "nlu.gemini.error",
                status: response.status,
                durationMs: Date.now() - startedAt,
                detail: (await response.text()).slice(0, 400),
            });
            return null;
        }

        const payload = await response.json();
        const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
        const usage = payload?.usageMetadata || {};

        logger.info("Gemini extraction", {
            event: "nlu.gemini",
            model: config.gemini.model,
            durationMs: Date.now() - startedAt,
            promptTokens: usage.promptTokenCount,
            outputTokens: usage.candidatesTokenCount,
            thoughtTokens: usage.thoughtsTokenCount || 0,
            finishReason: payload?.candidates?.[0]?.finishReason,
            raw: raw ? raw.replace(/\s+/g, " ").slice(0, 300) : null,
        });

        return raw ? parseModelJson(raw) : null;
    } catch (err) {
        logger.error("Gemini call failed", {
            event: "nlu.gemini.error",
            reason: err.name === "AbortError" ? "timeout" : err.message,
            durationMs: Date.now() - startedAt,
        });
        return null;
    } finally {
        clearTimeout(timer);
    }
}

const INTENT_ALIASES = {
    BOOK: INTENT.BOOK,
    BOOKING: INTENT.BOOK,
    BOOK_APPOINTMENT: INTENT.BOOK,
    CHECK_AVAILABILITY: INTENT.BOOK,
    RESCHEDULE: INTENT.BOOK,
    CONFIRM: INTENT.CONFIRM,
    CONFIRMED: INTENT.CONFIRM,
    CONFIRM_BOOKING: INTENT.CONFIRM,
    CANCEL: INTENT.CANCEL,
    CANCEL_REQUEST: INTENT.CANCEL,
    GREETING: INTENT.GREETING,
    HELLO: INTENT.GREETING,
    GENERAL_QUERY: INTENT.UNKNOWN,
    UNKNOWN: INTENT.UNKNOWN,
};

const CONFIDENCE_WORDS = { high: 0.9, medium: 0.6, low: 0.3, none: 0.1 };

function isPresent(value) {
    return value !== null && value !== undefined && value !== "";
}

const LANGUAGE_ALIASES = {
    en: "en", english: "en",
    si: "si", sinhala: "si", sinhalese: "si",
    ta: "ta", tamil: "ta",
    sien: "sien", singlish: "sien", "si-en": "sien", "sinhala-english": "sien",
};

function normalizeConfidence(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const word = CONFIDENCE_WORDS[value.trim().toLowerCase()];
        if (word !== undefined) return word;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0.5;
}

function sanitize(candidate, services) {
    const clean = {};
    const serviceIds = new Set(services.map((s) => s.id));

    const language = LANGUAGE_ALIASES[String(candidate.language || "").trim().toLowerCase()];
    if (language) clean.language = language;

    const intent = INTENT_ALIASES[String(candidate.intent || "").trim().toUpperCase()];
    if (intent) clean.intent = intent;

    if (isPresent(candidate.serviceId) && serviceIds.has(Number(candidate.serviceId))) {
        clean.serviceId = Number(candidate.serviceId);
    }

    if (isValidISODate(candidate.date)) clean.date = candidate.date;

    if (isPresent(candidate.startMin)) {
        const startMin = Number(candidate.startMin);
        if (Number.isInteger(startMin) && startMin >= 0 && startMin <= 1439) clean.startMin = startMin;
    }

    const period = String(candidate.period || "").trim().toUpperCase();
    if (Object.prototype.hasOwnProperty.call(PERIOD, period)) clean.period = period;

    if (typeof candidate.name === "string" && looksLikeName(candidate.name)) clean.name = cleanName(candidate.name);

    clean.confidence = normalizeConfidence(candidate.confidence);

    return clean;
}

const LANGUAGE_NAMES = {
    en: "English",
    si: "Sinhala",
    ta: "Tamil",
    sien: "romanised Singlish (Sinhala written in Latin letters)",
};

function buildAnswerPrompt(question, services, lang, pending) {
    return [
        "You are a warm, friendly receptionist at " + config.salon.name + ", a ladies salon in Sri Lanka.",
        "",
        "These are the ONLY facts you know about the salon:",
        "",
        knowledgeLines(services),
        "",
        "Customer question: " + question,
        "",
        "Answer in ONE or TWO short sentences, in " + (LANGUAGE_NAMES[lang] || "English") + ".",
        "",
        "Rules you must follow:",
        "- Use ONLY the facts listed above. Do not add anything from general knowledge.",
        "- If the answer is not in those facts, say warmly that the salon can confirm it for them.",
        "- Never state or invent appointment availability, specific dates, or specific times.",
        "  The booking system owns those and will show them separately.",
        "- Prices and the Google Maps link are listed above. Quote them exactly, never round or guess.",
        "- Sound like a warm human receptionist, not a form. Never mention that you are an AI.",
        "- Do not ask the customer a question; the assistant asks the next question itself.",
        "- Plain text only. No markdown, no lists, no greeting, no sign-off.",
    ].join(NEWLINE);
}

async function answerQuestion(question, services, lang, pending) {
    if (!config.gemini.apiKey) {
        logger.warn("Gemini not configured, cannot answer the question", { event: "nlu.answer.skipped" });
        return null;
    }

    const url = "https://generativelanguage.googleapis.com/v1beta/models/"
        + config.gemini.model + ":generateContent?key=" + config.gemini.apiKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.gemini.timeoutMs);
    const startedAt = Date.now();

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: buildAnswerPrompt(question, services, lang, pending) }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 200,
                    ...(config.gemini.thinkingLevel
                        ? { thinkingConfig: { thinkingLevel: config.gemini.thinkingLevel } }
                        : {}),
                },
            }),
        });

        if (!response.ok) {
            logger.error("Gemini could not answer the question", {
                event: "nlu.answer.error",
                status: response.status,
                durationMs: Date.now() - startedAt,
            });
            return null;
        }

        const payload = await response.json();
        const raw = payload && payload.candidates && payload.candidates[0]
            && payload.candidates[0].content && payload.candidates[0].content.parts
            && payload.candidates[0].content.parts[0]
            ? payload.candidates[0].content.parts[0].text
            : null;

        const answer = raw ? String(raw).trim().replace(/\s+/g, " ").slice(0, 400) : null;

        logger.info("Gemini answered a question", {
            event: "nlu.answer",
            durationMs: Date.now() - startedAt,
            language: lang,
            question: String(question).slice(0, 120),
            answer: answer ? answer.slice(0, 200) : null,
        });

        return answer || null;
    } catch (err) {
        logger.error("Gemini answer failed", {
            event: "nlu.answer.error",
            reason: err.name === "AbortError" ? "timeout" : err.message,
            durationMs: Date.now() - startedAt,
        });
        return null;
    } finally {
        clearTimeout(timer);
    }
}

async function understand(text, draft, services, expecting) {
    const rules = rulesPass(text, draft, services, expecting);

    const settle = (reason, result) => {
        logger.info("Message understood by rules", {
            event: "nlu.rules",
            reason,
            intent: result.intent,
            language: result.language,
            serviceId: result.serviceId,
            date: result.date,
            startMin: result.startMin,
            period: result.period,
            name: result.name,
        });
        return result;
    };

    const DETERMINISTIC = [
        INTENT.CONFIRM, INTENT.CANCEL, INTENT.GREETING,
        INTENT.AFFIRM, INTENT.DENY, INTENT.QUERY, INTENT.ASK,
    ];

    if (DETERMINISTIC.includes(rules.intent)) {
        return settle("keyword", { ...rules, usedModel: false });
    }

    if (rules.resolved && (rules.name || rules.date || rules.startMin !== undefined)) {
        if (rules.serviceId || draft.serviceId) {
            return settle("entities-resolved", { ...rules, usedModel: false });
        }
    }

    logger.debug("Rules could not resolve, asking Gemini", {
        event: "nlu.escalate",
        text: text.slice(0, 120),
        expecting,
        knownServiceId: draft.serviceId,
    });

    const candidate = await askGemini(text, draft, services, expecting);
    if (!candidate) {
        return settle("gemini-unavailable", { ...rules, usedModel: false });
    }

    const clean = sanitize(candidate, services);
    if (clean.confidence < 0.4) {
        logger.warn("Gemini confidence too low, asking for clarification", {
            event: "nlu.lowconfidence",
            confidence: clean.confidence,
        });
        return { ...rules, intent: INTENT.UNKNOWN, usedModel: true };
    }

    return {
        language: clean.language || rules.language,
        intent: clean.intent || rules.intent,
        serviceId: clean.serviceId ?? rules.serviceId,
        date: clean.date ?? rules.date,
        startMin: clean.startMin ?? rules.startMin,
        period: clean.period ?? rules.period,
        name: clean.name ?? rules.name,
        confidence: clean.confidence,
        usedModel: true,
    };
}

module.exports = {
    understand,
    rulesPass,
    detectLanguage,
    matchService,
    matchDate,
    matchPeriod,
    matchTime,
    matchOrdinal,
    matchInlineName,
    isServiceQuery,
    matchTopic,
    matchTopics,
    isBookingNudge,
    isPriceQuery,
    matchChangeRequest,
    isGreeting,
    looksLikeQuestion,
    answerQuestion,
    matchMonthWindow,
    isBareNumber,
    looksLikeName,
    cleanName,
};
