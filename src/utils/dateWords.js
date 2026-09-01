const MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
];

const NUMBER_WORDS = (() => {
    const ones = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
        "sixteen", "seventeen", "eighteen", "nineteen"];

    const map = {};
    ones.forEach((word, i) => { map[word] = i + 1; });
    teens.forEach((word, i) => { map[word] = i + 10; });
    map.twenty = 20;
    map.thirty = 30;
    ones.forEach((word, i) => {
        map["twenty " + word] = 21 + i;
        map["twenty-" + word] = 21 + i;
    });
    map["thirty one"] = 31;
    map["thirty-one"] = 31;
    return map;
})();

const FUZZY_MIN_LENGTH = 5;
const FUZZY_MAX_DISTANCE = 2;

function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

    for (let i = 0; i < a.length; i += 1) {
        const current = [i + 1];
        for (let j = 0; j < b.length; j += 1) {
            const cost = a[i] === b[j] ? 0 : 1;
            current[j + 1] = Math.min(
                current[j] + 1,
                previous[j + 1] + 1,
                previous[j] + cost,
            );
        }
        previous = current;
    }

    return previous[b.length];
}

function tokenise(text) {
    return String(text).toLowerCase().split(/[^a-z]+/).filter(Boolean);
}

function findMonth(text) {
    const tokens = tokenise(text).filter((token) => token.length >= 3);

    for (const token of tokens) {
        const exact = MONTH_NAMES.indexOf(token);
        if (exact !== -1) return { index: exact, token };
    }

    for (const token of tokens) {
        for (let i = 0; i < MONTH_NAMES.length; i += 1) {
            if (MONTH_NAMES[i].startsWith(token)) return { index: i, token };
        }
    }

    for (const token of tokens) {
        if (token.length < FUZZY_MIN_LENGTH) continue;
        for (let i = 0; i < MONTH_NAMES.length; i += 1) {
            const month = MONTH_NAMES[i];
            if (month.length < FUZZY_MIN_LENGTH) continue;
            if (Math.abs(month.length - token.length) > FUZZY_MAX_DISTANCE) continue;
            if (levenshtein(token, month) <= FUZZY_MAX_DISTANCE) return { index: i, token };
        }
    }

    return null;
}

function findDayNumber(text, monthToken) {
    const cleaned = String(text)
        .toLowerCase()
        .replace(monthToken ? new RegExp(escapeRegExp(monthToken), "g") : /$^/, " ");

    const digits = cleaned.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
    if (digits) {
        const value = Number(digits[1]);
        if (value >= 1 && value <= 31) return value;
    }

    const words = tokenise(cleaned).filter((w) => !["of", "the", "on", "at"].includes(w)).join(" ");
    const entries = Object.entries(NUMBER_WORDS).sort((a, b) => b[0].length - a[0].length);

    for (const [word, value] of entries) {
        const hit = words === word
            || words.startsWith(word + " ")
            || words.endsWith(" " + word)
            || words.includes(" " + word + " ");
        if (hit) return value;
    }

    return null;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const LETTER = /\p{L}/u;

function containsWord(haystack, needle) {
    if (!haystack || !needle) return false;

    const text = String(haystack);
    const word = String(needle);
    let from = 0;

    for (;;) {
        const at = text.indexOf(word, from);
        if (at === -1) return false;

        const before = at > 0 ? text[at - 1] : "";
        const afterIndex = at + word.length;
        const after = afterIndex < text.length ? text[afterIndex] : "";

        const touchesLetter = (before && LETTER.test(before)) || (after && LETTER.test(after));
        if (!touchesLetter) return true;

        from = at + 1;
    }
}

function stripDateTokens(text) {
    let out = String(text).toLowerCase();

    out = out.replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ");
    out = out.replace(/\b\d{1,2}\s*[/\-.]\s*\d{1,2}(?:\s*[/\-.]\s*\d{2,4})?\b/g, " ");
    out = out.replace(/\b(?:in|after)\s+\d{1,2}\s*days?\b/g, " ");

    const month = findMonth(out);
    if (month) {
        const token = escapeRegExp(month.token);
        out = out.replace(new RegExp("\\b\\d{1,2}(?:st|nd|rd|th)?\\s+" + token, "g"), " ");
        out = out.replace(new RegExp(token + "\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?\\b", "g"), " ");
        out = out.replace(new RegExp(token, "g"), " ");
    }

    return out;
}

module.exports = {
    MONTH_NAMES,
    NUMBER_WORDS,
    levenshtein,
    findMonth,
    findDayNumber,
    stripDateTokens,
    containsWord,
    escapeRegExp,
};
