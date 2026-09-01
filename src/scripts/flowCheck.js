const { sequelize, Customer, Conversation, Booking } = require("../models");
const { handle } = require("../services/conversationService");
const { BOOKING_STATUS } = require("../constants/booking");
const { resetDemoData } = require("./resetDemo");

let phoneCounter = 0;

function nextPhone() {
    phoneCounter += 1;
    return `9477000${String(9000 + phoneCounter).padStart(4, "0")}`;
}

const REPLIES = {
    en: { pick: "1", affirm: "ok", confirm: "Confirm", name: "Amaya" },
    sien: { pick: "1", affirm: "eka damu", confirm: "hari", name: "Nimali" },
    si: { pick: "1", affirm: "හරි", confirm: "හරි", name: "කුමාරි" },
    ta: { pick: "1", affirm: "சரி", confirm: "சரி", name: "நளினி" },
};

function persona(langKey, serviceWord) {
    const words = REPLIES[langKey] || REPLIES.en;

    return (key) => {
        switch (key) {
            case "greeting":
            case "ask_service":
            case "unknown_service":
                return serviceWord;
            case "ask_date":
            case "no_slots":
                return words.pick;
            case "ask_date_open":
                return "tomorrow";
            case "ask_time":
            case "slot_taken":
                return words.pick;
            case "only_time":
                return words.affirm;
            case "ask_name":
                return words.name;
            case "summary":
                return words.confirm;
            case "restarted":
                return serviceWord;
            default:
                return null;
        }
    };
}

const SCENARIOS = [
    { name: "EN · plain opener", opener: "I want to do a facial", lang: "en", service: "Facial" },
    { name: "EN · service + tomorrow", opener: "Haircut tomorrow", lang: "en", service: "Haircut" },
    { name: "EN · service + explicit time", opener: "Facial tomorrow at 3 PM", lang: "en", service: "Facial" },
    { name: "EN · relative, next week", opener: "haircut next week", lang: "en", service: "Haircut" },
    { name: "EN · numeric date 23/09", opener: "facial on 23/09", lang: "en", service: "Facial" },
    { name: "EN · month name", opener: "cleanup on 23 September", lang: "en", service: "Cleanup" },
    { name: "EN · greeting first", opener: "hi", lang: "en", service: "Facial" },
    { name: "EN · unknown service", opener: "I need a gold treatment", lang: "en", service: "Facial" },
    { name: "EN · in 3 days", opener: "haircut in 3 days", lang: "en", service: "Haircut" },
    { name: "SIEN · heta hawasa", opener: "heta hawasa facial ekak karaganna puluwanda?", lang: "sien", service: "facial ekak" },
    { name: "SIEN · plain request", opener: "haircut ekak one heta", lang: "sien", service: "haircut ekak" },
    { name: "SI · Sinhala script", opener: "හෙට උදේ haircut එකක්", lang: "si", service: "haircut" },
    { name: "SI · Sinhala service word", opener: "හෙට මුහුණු ප්‍රතිකාරයක්", lang: "si", service: "මුහුණු" },
    { name: "TA · Tamil script", opener: "நாளை facial வேண்டும்", lang: "ta", service: "facial" },
    { name: "TA · Tamil haircut", opener: "நாளை முடி வெட்ட வேண்டும்", lang: "ta", service: "முடி வெட்ட" },
];

const EDGE_CASES = [
    {
        name: "GREET · a greeting is never captured as the name",
        steps: ["Haircut", "tomorrow", "1", "hi"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.name) return `the greeting became the name: ${last.draft.name}`;
            if (last.key !== "ask_name") return `expected ask_name, got ${last.key}`;
            return null;
        },
    },
    {
        name: "GREET · greeting mid-booking keeps progress",
        steps: ["Haircut", "tomorrow", "good morning"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (!last.corrections.includes("greeting_back")) return "no greeting acknowledgement";
            if (last.draft.serviceId !== 4) return "the service was lost";
            if (last.draft.date === null) return "the date was lost";
            return null;
        },
    },
    {
        name: "QUERY · a bare services request shows the list",
        steps: ["Haircut", "tomorrow", "1", "Dilini", "services"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.key !== "services_info_held") return `expected services_info_held, got ${last.key}`;
            if (last.draft.name !== "Dilini") return "the draft was lost";
            return null;
        },
    },
    {
        name: "QUERY · a bare services request is not a name",
        steps: ["Haircut", "tomorrow", "1", "services"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.name) return `services became the name: ${last.draft.name}`;
            return null;
        },
    },
    {
        name: "ASK · a question is intercepted and the step is kept",
        steps: ["Facial", "How long does a facial take?"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (!last.answered) return "the question was not intercepted";
            if (last.key !== "ask_date") return `expected ask_date to be re-asked, got ${last.key}`;
            if (last.draft.serviceId !== 1) return "the draft lost its service";
            return null;
        },
    },
    {
        name: "ASK · an enquiry does not select the service it names",
        steps: ["What is the difference between cleanup and facial?"],
        assert: (keys, results) => {
            const last = results[0];
            if (!last.answered) return "the question was not intercepted";
            if (last.draft.serviceId !== null) return `a service was silently selected: ${last.draft.serviceId}`;
            return null;
        },
    },
    {
        name: "ASK · repeated questions never trip the loop breaker",
        steps: ["Facial", "Can I bring a friend?", "Where are you located?", "How long does it take?"],
        assert: (keys) => (keys.includes("fallback") ? "the loop breaker fired on answered questions" : null),
    },
    {
        name: "ASK · a booking request is not mistaken for a question",
        steps: ["can i book a facial tomorrow"],
        assert: (keys, results) => (results[0].answered ? "a booking request was treated as a question" : null),
    },
    {
        name: "ASK · changing mind after an answer works",
        steps: ["Facial", "tomorrow", "then make it a cleanup instead"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.serviceId !== 3) return `expected Cleanup, got ${last.draft.serviceId}`;
            if (last.draft.startMin !== null) return "the time was not cleared";
            return null;
        },
    },
    {
        name: "GREET · typo openers get a warm welcome",
        steps: ["helo"],
        assert: (keys) => (keys[0] === "greeting" ? null : `expected greeting, got ${keys[0]}`),
    },
    {
        name: "GREET · hlw and hi there are greetings",
        steps: ["hlw"],
        assert: (keys) => (keys[0] === "greeting" ? null : `expected greeting, got ${keys[0]}`),
    },
    {
        name: "GREET · good morning is a greeting, not a period",
        steps: ["good morning"],
        assert: (keys) => (keys[0] === "greeting" ? null : `expected greeting, got ${keys[0]}`),
    },
    {
        name: "GREET · a service name is still a booking",
        steps: ["Facial"],
        assert: (keys) => (keys[0] === "ask_date" ? null : `expected ask_date, got ${keys[0]}`),
    },
    {
        name: "MONTH · next month suggests next month's dates",
        steps: ["Facial", "next month"],
        assert: (keys, results) => {
            const reply = results[1].reply;
            if (results[1].key !== "ask_date") return `expected ask_date, got ${results[1].key}`;
            if (!reply.includes("October")) return "did not suggest dates in October";
            if (reply.includes("September")) return "repeated this month's dates";
            return null;
        },
    },
    {
        name: "MONTH · a bare month name suggests that month",
        steps: ["Facial", "october"],
        assert: (keys, results) => {
            const reply = results[1].reply;
            if (!reply.includes("October")) return "did not suggest dates in October";
            return null;
        },
    },
    {
        name: "MONTH · a month with a day still books that day",
        steps: ["Facial", "october 3"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.date !== "2026-10-03") return `expected 2026-10-03, got ${last.draft.date}`;
            return null;
        },
    },
    {
        name: "REJECT · no offers a helpful choice",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "no"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.key !== "reject_options") return `expected reject_options, got ${last.key}`;
            if (last.draft.startMin !== null) return "the rejected time was not cleared";
            return null;
        },
    },
    {
        name: "REJECT · a typo'd month switches the date",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "no", "septermber 3"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.date !== "2026-09-03") return `expected 2026-09-03, got ${last.draft.date}`;
            if (last.key !== "ask_time") return `expected ask_time, got ${last.key}`;
            if (last.draft.startMin !== null) return `a time was assumed: ${last.draft.startMin}`;
            return null;
        },
    },
    {
        name: "REJECT · a weekday switches the date",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "no", "Friday"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.date !== "2026-09-04") return `expected 2026-09-04, got ${last.draft.date}`;
            if (last.key !== "ask_time") return `expected ask_time, got ${last.key}`;
            return null;
        },
    },
    {
        name: "REJECT · a different service is accepted",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "no", "cleanup"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.serviceId !== 3) return `expected Cleanup (id 3), got ${last.draft.serviceId}`;
            return null;
        },
    },
    {
        name: "REJECT · a number still picks a time",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "no", "2"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.key !== "summary") return `expected summary, got ${last.key}`;
            if (last.draft.startMin === null) return "no time was picked";
            return null;
        },
    },
    {
        name: "TYPO · month misspellings resolve",
        steps: ["Facial", "sept 3"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.date !== "2026-09-03") return `expected 2026-09-03, got ${last.draft.date}`;
            return null;
        },
    },
    {
        name: "TYPO · a month name never leaks a time",
        steps: ["Facial", "septermber 3"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.startMin !== null) return `spurious time ${last.draft.startMin} from the day number`;
            if (last.key !== "ask_time") return `expected ask_time, got ${last.key}`;
            return null;
        },
    },
    {
        name: "BUG1 · bare number picks the right service",
        steps: ["Hi", "2"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.serviceId !== 1) return `expected Facial (id 1), got serviceId ${last.draft.serviceId}`;
            return null;
        },
    },
    {
        name: "BUG1 · bare number never becomes a time",
        steps: ["Hi", "2"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.startMin !== null) return `a bare number leaked a time: ${last.draft.startMin}`;
            return null;
        },
    },
    {
        name: "BUG2 · spelled-out date resolves, no time is assumed",
        steps: ["Facial", "october one"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.draft.date !== "2026-10-01") return `expected 2026-10-01, got ${last.draft.date}`;
            if (last.key !== "ask_time") return `expected ask_time, got ${last.key}`;
            if (last.draft.startMin !== null) return `a time was assumed: ${last.draft.startMin}`;
            return null;
        },
    },
    {
        name: "BUG2 · slot selection is never skipped",
        steps: ["Facial", "tomorrow", "Dilini"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.key !== "ask_time") return `expected ask_time, got ${last.key}`;
            return null;
        },
    },
    {
        name: "BUG3 · service query mid-flow keeps context",
        steps: ["Facial", "tomorrow", "what are the services you conduct?", "1"],
        assert: (keys, results) => {
            if (keys[2] !== "services_info") return `expected services_info, got ${keys[2]}`;
            const last = results[3];
            if (last.draft.startMin === null) return "the pending time pick was lost after the query";
            return null;
        },
    },
    {
        name: "BUG3 · service query at summary does not loop",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "can i know about services", "can i know about services"],
        assert: (keys) => {
            if (keys[2] !== "services_info_held") return `expected services_info_held, got ${keys[2]}`;
            if (keys.filter((k) => k === "summary").length > 1) return "summary looped";
            return null;
        },
    },
    {
        name: "LANG · an English sentence stays English",
        steps: ["Facial", "october one"],
        assert: (keys, results) => (results[results.length - 1].lang === "en" ? null : `language drifted to ${results[results.length - 1].lang}`),
    },
    {
        name: "FLOW · all details in one message reaches summary",
        steps: ["Hi, I want a facial tomorrow at 3pm for Dilini"],
        assert: (keys) => (keys[0] === "summary" ? null : `expected summary on turn 1, got ${keys[0]}`),
    },
    {
        name: "FIX · change the time at the summary step",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "make it 4pm instead"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.key !== "summary") return `expected summary, got ${last.key}`;
            if (last.draft.startMin !== 960) return `expected 4 PM (960), got ${last.draft.startMin}`;
            if (!last.corrections.includes("ack_time")) return "no ack_time acknowledgement";
            return null;
        },
    },
    {
        name: "FIX · change the service mid-flow",
        steps: ["Facial tomorrow", "make it cleanup instead"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (!last.corrections.includes("ack_service")) return "no ack_service acknowledgement";
            if (last.draft.startMin !== null) return "time should have been cleared on a service change";
            return null;
        },
    },
    {
        name: "FIX · change the date mid-flow",
        steps: ["Haircut tomorrow", "actually change it to 23/09"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (!last.corrections.includes("ack_date")) return "no ack_date acknowledgement";
            if (!last.draft.date.endsWith("-09-23")) return `date did not move, got ${last.draft.date}`;
            return null;
        },
    },
    {
        name: "JSON · confirmed booking carries a complete payload",
        steps: ["Facial tomorrow at 3 PM", "Dilini", "Confirm"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.key !== "booked") return `expected booked, got ${last.key}`;
            const b = last.booking;
            if (!b) return "no booking payload on the response";
            const missing = [];
            if (!b.reference) missing.push("reference");
            if (b.status !== "CONFIRMED") missing.push("status");
            if (!b.customer || !b.customer.name || !b.customer.phone) missing.push("customer");
            if (!b.service || !b.service.name || !b.service.durationMin) missing.push("service");
            if (!b.appointment || !b.appointment.date || !b.appointment.startLabel
                || !b.appointment.endLabel || !b.appointment.timezone) missing.push("appointment");
            return missing.length ? `payload missing: ${missing.join(", ")}` : null;
        },
    },
    {
        name: "EDGE · gibberish must not loop",
        steps: ["Facial", "asdkjh qwe", "zzz xyz", "qqq www"],
        assert: (keys) => {
            let worst = 1;
            let run = 1;
            for (let i = 1; i < keys.length; i += 1) {
                run = keys[i] === keys[i - 1] ? run + 1 : 1;
                worst = Math.max(worst, run);
            }
            return worst <= 2 ? null : `same reply repeated ${worst} times in a row`;
        },
    },
    {
        name: "EDGE · cancel restarts cleanly",
        steps: ["Facial", "tomorrow", "cancel"],
        assert: (keys) => (keys[keys.length - 1] === "restarted" ? null : `expected restarted, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · deny at time offers other dates",
        steps: ["Haircut", "tomorrow", "no"],
        assert: (keys) => (keys[keys.length - 1] === "ask_date" ? null : `expected ask_date, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · ordinal beats bare-number-as-hour",
        steps: ["Haircut", "tomorrow", "2"],
        assert: (keys) => (keys[keys.length - 1] === "ask_name" ? null : `expected ask_name, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · explicit time still wins",
        steps: ["Facial", "tomorrow", "3 PM"],
        assert: (keys) => (keys[keys.length - 1] === "ask_name" ? null : `expected ask_name, got ${keys[keys.length - 1]}`),
    },
    {
        name: "BOOKED · the confirmation carries the booking reference",
        steps: ["Haircut", "tomorrow", "1", "Amali", "Confirm"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (keys[keys.length - 1] !== "booked") return `expected booked, got ${keys[keys.length - 1]}`;
            if (!last.booking || !last.booking.reference) return "no reference in the payload";
            return last.reply.includes(last.booking.reference)
                ? null
                : `reply is missing ${last.booking.reference}`;
        },
    },
    {
        name: "KB · a price question quotes the real price list",
        steps: ["hi", "i want know about price list"],
        assert: (keys, results) => {
            const reply = results[results.length - 1].reply;
            if (keys[keys.length - 1] !== "kb_answer") return `expected kb_answer, got ${keys[keys.length - 1]}`;
            if (!reply.includes("5,500")) return "the Facial price is missing";
            if (!reply.includes("2,500")) return "the Haircut price is missing";
            return null;
        },
    },
    {
        name: "KB · one service price answers for that service only",
        steps: ["how much is a facial"],
        assert: (keys, results) => {
            const reply = results[results.length - 1].reply;
            if (!reply.includes("5,500")) return "the Facial price is missing";
            if (reply.includes("2,500")) return "it listed unrelated services";
            return null;
        },
    },
    {
        name: "KB · directions include the Google Maps link",
        steps: ["where are you located?"],
        assert: (keys, results) => {
            const reply = results[results.length - 1].reply;
            if (!reply.includes("maps.google.com")) return "no maps link";
            if (!reply.includes("Galle Road")) return "no address";
            return null;
        },
    },
    {
        name: "KB · every answer offers to book",
        steps: ["is there parking?", "what time do you open", "can i pay by card", "can i just walk in"],
        assert: (keys, results) => {
            const missing = results.filter((r) => !/book|reserve/i.test(r.reply));
            return missing.length ? `${missing.length} answer(s) did not offer a booking` : null;
        },
    },
    {
        name: "KB · a question never loops the engine",
        steps: ["where are you", "where are you", "where are you", "where are you"],
        assert: (keys) => (keys.every((k) => k === "kb_answer") ? null : `engine drifted: ${keys.join(", ")}`),
    },
    {
        name: "BRIDGE · yes after a price answer starts the booking",
        steps: ["how much is a facial", "yes, lets book"],
        assert: (keys) => (keys[keys.length - 1] === "ask_date" ? null : `expected ask_date, got ${keys[keys.length - 1]}`),
    },
    {
        name: "BRIDGE · a full booking after a concierge answer",
        steps: ["how much is a haircut", "yes please", "tomorrow", "1", "Dilini", "Confirm"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (keys[keys.length - 1] !== "booked") return `expected booked, got ${keys[keys.length - 1]}`;
            if (!last.booking || last.booking.service.name !== "Haircut") return "the wrong service was booked";
            return null;
        },
    },
    {
        name: "BRIDGE · a question mid-flow keeps the offered times",
        steps: ["Facial", "tomorrow", "is there parking?", "1", "Dilini"],
        assert: (keys) => (keys[keys.length - 1] === "summary" ? null : `expected summary, got ${keys[keys.length - 1]}`),
    },
    {
        name: "KB · Singlish gets a Singlish answer",
        steps: ["ayubowan", "salon eka koheda thiyenne?"],
        assert: (keys, results) => {
            const last = results[results.length - 1];
            if (last.lang !== "sien") return `answered in ${last.lang}, not Singlish`;
            return /maps\.google\.com/.test(last.reply) ? null : "the maps link is missing";
        },
    },
    {
        name: "KB · Sinhala gets a Sinhala answer",
        steps: ["\u0d86\u0dba\u0dd4\u0db6\u0ddd\u0dc0\u0db1\u0dca", "\u0db4\u0dcf\u0dbb\u0dca\u0d9a\u0dd2\u0db1\u0dca \u0dad\u0dd2\u0dba\u0dd9\u0db1\u0dc0\u0daf?"],
        assert: (keys, results) => {
            const reply = results[results.length - 1].reply;
            return /[\u0d80-\u0dff]/.test(reply) ? null : "the answer was not in Sinhala";
        },
    },
    {
        name: "KB · a Sinhala greeting is a greeting",
        steps: ["\u0d86\u0dba\u0dd4\u0db6\u0ddd\u0dc0\u0db1\u0dca"],
        assert: (keys) => (keys[0] === "greeting" ? null : `expected greeting, got ${keys[0]}`),
    },
    {
        name: "EDGE · another service reopens the menu",
        steps: ["Facial", "tomorrow", "another service"],
        assert: (keys) => (keys[keys.length - 1] === "ask_service" ? null : `expected ask_service, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · another date reopens the days",
        steps: ["Facial", "tomorrow", "9 AM", "Sameera", "another date"],
        assert: (keys) => (keys[keys.length - 1] === "ask_date" ? null : `expected ask_date, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · another time reopens the times",
        steps: ["Facial", "tomorrow", "9 AM", "Sameera", "another time"],
        assert: (keys) => (keys[keys.length - 1] === "ask_time" ? null : `expected ask_time, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · singlish date change at the summary",
        steps: ["Facial", "tomorrow", "9 AM", "Sameera", "meka waradi wena dawsk balmuda"],
        assert: (keys) => (keys[keys.length - 1] === "ask_date" ? null : `expected ask_date, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · a day word beats the change phrase",
        steps: ["Facial", "tomorrow", "anidda balamu"],
        assert: (keys) => (keys[keys.length - 1] === "ask_time" ? null : `expected ask_time, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · out of horizon date is named as such",
        steps: ["Facial", "9/05"],
        assert: (keys) => (keys[keys.length - 1] === "date_too_far" ? null : `expected date_too_far, got ${keys[keys.length - 1]}`),
    },
    {
        name: "EDGE · a name survives an affirmative prefix",
        steps: ["Facial", "tomorrow", "9 AM", "yes, I am sameera"],
        assert: (keys, results) => {
            const reply = results[results.length - 1].reply;
            if (keys[keys.length - 1] !== "summary") return `expected summary, got ${keys[keys.length - 1]}`;
            return reply.includes("Sameera") ? null : "the name was not captured";
        },
    },
    {
        name: "EDGE · a name is never cut at an inner lead-in",
        steps: ["Facial", "tomorrow", "9 AM", "Nimali"],
        assert: (keys, results) => {
            const reply = results[results.length - 1].reply;
            return reply.includes("Nimali") ? null : "the name was truncated";
        },
    },
    {
        name: "EDGE · a repeated summary does not loop",
        steps: ["Facial", "tomorrow", "9 AM", "Sameera", "hmm", "hmm", "hmm"],
        assert: (keys) => {
            let worst = 1;
            let run = 1;
            for (let i = 1; i < keys.length; i += 1) {
                run = keys[i] === keys[i - 1] ? run + 1 : 1;
                worst = Math.max(worst, run);
            }
            return worst <= 2 ? null : `same reply repeated ${worst} times in a row`;
        },
    },
];

async function resetPhone(phone) {
    const customer = await Customer.findOne({ where: { phone } });
    if (customer) await Conversation.destroy({ where: { customerId: customer.id } });
}

async function runConversation(scenario) {
    const phone = nextPhone();
    await resetPhone(phone);

    const answer = persona(scenario.lang, scenario.service);
    const transcript = [];
    let modelCalls = 0;
    let message = scenario.opener;

    for (let turn = 0; turn < 10 && message !== null; turn += 1) {
        const result = await handle(phone, message);
        if (result.nlu.usedModel) modelCalls += 1;

        transcript.push({
            customer: message,
            key: result.key,
            lang: result.lang,
            usedModel: result.nlu.usedModel,
            bookingId: result.bookingId,
            reply: result.reply.replace(/\n/g, " | "),
        });

        if (result.key === "booked") break;
        message = answer(result.key);
    }

    const last = transcript[transcript.length - 1];
    const failures = [];

    if (last.key !== "booked") failures.push(`did not reach a booking (stopped at "${last.key}")`);
    if (scenario.lang && last.lang !== scenario.lang) {
        failures.push(`expected language "${scenario.lang}", got "${last.lang}"`);
    }

    return { name: scenario.name, transcript, modelCalls, failures, turns: transcript.length };
}

async function runEdgeCase(edge) {
    await resetDemoData({ quiet: true });
    const phone = nextPhone();
    await resetPhone(phone);

    const transcript = [];
    const keys = [];
    const results = [];
    let modelCalls = 0;

    for (const step of edge.steps) {
        const result = await handle(phone, step);
        if (result.nlu.usedModel) modelCalls += 1;
        keys.push(result.key);
        results.push(result);
        transcript.push({
            customer: step,
            key: result.key,
            lang: result.lang,
            usedModel: result.nlu.usedModel,
            reply: result.reply.replace(/\n/g, " | "),
        });
    }

    const problem = edge.assert(keys, results);
    return {
        name: edge.name,
        transcript,
        modelCalls,
        failures: problem ? [problem] : [],
        turns: transcript.length,
    };
}

async function run() {
    const verbose = process.argv.includes("--verbose");

    await resetDemoData({ quiet: true });
    console.log("[flow] demo data reset for a deterministic run");

    const results = [];

    for (const scenario of SCENARIOS) results.push(await runConversation(scenario));
    for (const edge of EDGE_CASES) results.push(await runEdgeCase(edge));

    console.log("");
    console.log("=".repeat(100));
    console.log("CONVERSATION FLOW CHECK");
    console.log("=".repeat(100));

    let passed = 0;
    let totalModelCalls = 0;

    for (const result of results) {
        const ok = result.failures.length === 0;
        if (ok) passed += 1;
        totalModelCalls += result.modelCalls;

        console.log(
            `${ok ? "PASS" : "FAIL"}  ${result.name.padEnd(42)} ` +
            `turns=${String(result.turns).padStart(2)}  gemini=${result.modelCalls}  final=${result.transcript[result.turns - 1].key}`,
        );

        for (const failure of result.failures) console.log(`      ! ${failure}`);

        if (verbose || !ok) {
            for (const line of result.transcript) {
                console.log(`      > ${line.customer}`);
                console.log(`        [${line.key}/${line.lang}/${line.usedModel ? "gemini" : "rules"}] ${line.reply.slice(0, 100)}`);
            }
        }
    }

    const bookings = await Booking.count({ where: { status: BOOKING_STATUS.CONFIRMED } });
    const bookingScenarios = results.filter((r) => r.transcript.some((l) => l.key === "booked"));
    const avgCalls = bookingScenarios.length
        ? (bookingScenarios.reduce((sum, r) => sum + r.modelCalls, 0) / bookingScenarios.length).toFixed(2)
        : "0";

    console.log("=".repeat(100));
    console.log(`${passed}/${results.length} passed · ${totalModelCalls} Gemini calls total · ${avgCalls} per completed booking · ${bookings} bookings in DB`);
    console.log("=".repeat(100));
    console.log("");

    await sequelize.close();
    process.exit(passed === results.length ? 0 : 1);
}

run();
