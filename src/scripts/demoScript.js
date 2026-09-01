const fs = require("fs");
const path = require("path");
const { sequelize, Customer, Conversation } = require("../models");
const { resetDemoData } = require("./resetDemo");
const chatRouter = require("./../services/chatRouter");

const SCENARIOS = [
    {
        title: "1. The straight booking",
        subtitle: "An English customer who knows what she wants",
        phone: "94770100001",
        steps: ["Hi", "Facial", "tomorrow", "2", "Amaya Silva", "Confirm"],
    },
    {
        title: "2. Everything in one message",
        subtitle: "Zero-shot booking, no back and forth",
        phone: "94770100002",
        steps: ["I want a haircut tomorrow at 3 PM, my name is Ishara", "Confirm"],
    },
    {
        title: "3. The concierge questions",
        subtitle: "Location, parking, hours, contact, payment, walk-ins, aftercare",
        phone: "94770100003",
        steps: [
            "where are you located?",
            "is there parking?",
            "what time do you open on saturday",
            "can i have your phone number",
            "can i pay by card",
            "can i just walk in without booking?",
            "what should i do after a facial",
        ],
    },
    {
        title: "4. Two questions in one breath",
        subtitle: "Compound question, then a seamless jump into booking",
        phone: "94770100004",
        steps: ["Where are you located and how much is a facial?", "yes, lets book", "tomorrow", "1", "Natalie", "Confirm"],
    },
    {
        title: "5. The full price list",
        subtitle: "Browsing the menu before deciding",
        phone: "94770100005",
        steps: ["hi", "what services do you have?", "how much is bridal makeup?", "yes please", "tomorrow"],
    },
    {
        title: "6. Singlish, the way people really type",
        subtitle: "Romanised Sinhala from first message to confirmation",
        phone: "94770100006",
        steps: ["ayubowan", "salon eka koheda thiyenne?", "mata oni hair cut ekak karaganna", "heta", "pm times monada thyenne", "1", "Nimali", "hari"],
    },
    {
        title: "7. Sinhala script",
        subtitle: "The same engine, in Sinhala",
        phone: "94770100007",
        steps: ["ආයුබෝවන්", "පාර්කින් තියෙනවද?", "මට Threading එකක් ඕන", "හෙට", "1", "Sachini", "Confirm"],
    },
    {
        title: "8. Tamil",
        subtitle: "Tamil greeting and a price question",
        phone: "94770100008",
        steps: ["வணக்கம்", "முகவரி என்ன?", "Manicure"],
    },
    {
        title: "9. She changes her mind, twice",
        subtitle: "Changing the service, then the date, then the time",
        phone: "94770100009",
        steps: ["Facial", "tomorrow", "actually another service", "Haircut", "tomorrow", "1", "Dilini", "another date", "2", "1", "Confirm"],
    },
    {
        title: "10. Saying no at the summary",
        subtitle: "Rejecting the proposed time and picking another",
        phone: "94770100010",
        steps: ["Pedicure", "tomorrow", "1", "Kavitha", "no", "2", "Confirm"],
    },
    {
        title: "11. Awkward inputs",
        subtitle: "Typos, a date too far out, gibberish, and a restart",
        phone: "94770100011",
        steps: ["helo", "fasial", "9/05", "tomorrow", "asdkjh qwe", "zzz xyz", "qqq www", "cancel"],
    },
    {
        title: "12. A question in the middle of booking",
        subtitle: "The booking is held, answered, and resumed",
        phone: "94770100012",
        steps: ["Hair Treatment", "tomorrow", "wait, is there parking?", "1", "Ruvini", "Confirm"],
    },
];

function line(text) {
    return String(text).split("\n").map((l) => "    " + l).join("\n");
}

async function run() {
    await resetDemoData({ quiet: true });

    const out = [];

    for (const scenario of SCENARIOS) {
        const customer = await Customer.findOne({ where: { phone: scenario.phone } });
        if (customer) await Conversation.destroy({ where: { customerId: customer.id } });

        out.push("");
        out.push("=".repeat(100));
        out.push(scenario.title + "  --  " + scenario.subtitle);
        out.push("=".repeat(100));

        for (const step of scenario.steps) {
            const result = await chatRouter.handle(scenario.phone, step);
            out.push("");
            out.push("  CUSTOMER: " + step);
            out.push("  SALON:");
            out.push(line(result.reply));
            out.push("  [key=" + result.key + " lang=" + result.lang + " engine=" + result.engine
                + " model=" + (result.nlu && result.nlu.usedModel ? "yes" : "no") + "]");
        }
    }

    const target = path.join(__dirname, "..", "..", "logs", "demo-script.txt");
    fs.writeFileSync(target, out.join("\n"), "utf8");
    console.log(out.join("\n"));
    console.log("");
    console.log("written to " + target);

    await sequelize.close();
    process.exit(0);
}

run();
