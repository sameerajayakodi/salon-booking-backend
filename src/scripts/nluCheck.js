const { sequelize, Service } = require("../models");
const { understand, detectLanguage } = require("../services/nluService");
const { EMPTY_DRAFT } = require("../constants/booking");

const CASES = [
    { text: "I want to do a facial", expect: null },
    { text: "heta hawasa facial ekak karaganna puluwanda?", expect: "sien" },
    { text: "හෙට සැප් මුහුණු ප්‍රතිකාරයක් ගත හැකිද?", expect: "si" },
    { text: "நாளை facial வேண்டும்", expect: "ta" },
    { text: "හෙට උදේ haircut එකක්", expect: "si" },
    { text: "3 PM", expect: null },
    { text: "Confirm", expect: null },
];

async function run() {
    const services = await Service.findAll({ where: { isActive: true }, order: [["name", "ASC"]] });

    console.log("");
    for (const testCase of CASES) {
        const detected = detectLanguage(testCase.text);
        const nlu = await understand(testCase.text, { ...EMPTY_DRAFT }, services, null);
        const pass = detected === testCase.expect;

        console.log(`${pass ? "PASS" : "FAIL"}  "${testCase.text}"`);
        console.log(`      lang=${detected} (expected ${testCase.expect})  intent=${nlu.intent}  service=${nlu.serviceId ?? "-"}  date=${nlu.date ?? "-"}  period=${nlu.period ?? "-"}  time=${nlu.startMin ?? "-"}  model=${nlu.usedModel}`);
    }

    await sequelize.close();
    process.exit(0);
}

run();
