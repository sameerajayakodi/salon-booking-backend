const { sequelize, Service } = require("../models");
const { EMPTY_DRAFT } = require("../constants/booking");

const realFetch = global.fetch;
let lastRequestBody = null;

function mockGemini(payload) {
    global.fetch = async (url, options) => {
        if (!String(url).includes("generativelanguage")) return realFetch(url, options);
        lastRequestBody = JSON.parse(options.body);
        return {
            ok: true,
            status: 200,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] }, finishReason: "STOP" }],
                usageMetadata: { promptTokenCount: 480, candidatesTokenCount: 70, thoughtsTokenCount: 0 },
            }),
        };
    };
}

function mockGeminiFailure(status, body) {
    global.fetch = async (url, options) => {
        if (!String(url).includes("generativelanguage")) return realFetch(url, options);
        return { ok: false, status, text: async () => body };
    };
}

const CASES = [
    {
        name: "canonical shape is accepted",
        model: { language: "en", intent: "BOOK", serviceId: 1, date: "2026-09-05", startMin: 600, period: null, name: null, confidence: 0.9 },
        expect: { intent: "BOOK", serviceId: 1, date: "2026-09-05", startMin: 600, usedModel: true },
    },
    {
        name: "lowercase and verbose intent are normalised",
        model: { language: "english", intent: "book_appointment", serviceId: 4, date: "2026-09-05", startMin: null, period: "morning", name: null, confidence: "high" },
        expect: { intent: "BOOK", serviceId: 4, period: "MORNING", usedModel: true },
    },
    {
        name: "worded confidence becomes a number",
        model: { language: "en", intent: "BOOK", serviceId: 1, date: null, startMin: null, period: null, name: null, confidence: "medium" },
        expect: { intent: "BOOK", confidence: 0.6, usedModel: true },
    },
    {
        name: "null time never becomes midnight",
        model: { language: "en", intent: "BOOK", serviceId: 1, date: "2026-09-05", startMin: null, period: null, name: null, confidence: 0.8 },
        expect: { startMinIsNull: true, usedModel: true },
    },
    {
        name: "unknown serviceId is discarded",
        model: { language: "en", intent: "BOOK", serviceId: 999, date: "2026-09-05", startMin: null, period: null, name: null, confidence: 0.8 },
        expect: { serviceIdIsUndefined: true, usedModel: true },
    },
    {
        name: "invalid date is discarded",
        model: { language: "en", intent: "BOOK", serviceId: 1, date: "not-a-date", startMin: null, period: null, name: null, confidence: 0.8 },
        expect: { dateIsUndefined: true, usedModel: true },
    },
    {
        name: "low confidence degrades to UNKNOWN",
        model: { language: "en", intent: "BOOK", serviceId: 1, date: "2026-09-05", startMin: 600, period: null, name: null, confidence: 0.2 },
        expect: { intent: "UNKNOWN", usedModel: true },
    },
    {
        name: "affirmative intent from the model is honoured",
        model: { language: "en", intent: "CONFIRM", serviceId: null, date: null, startMin: null, period: null, name: null, confidence: 0.95 },
        expect: { intent: "CONFIRM", usedModel: true },
    },
];

async function run() {
    const services = await Service.findAll({ where: { isActive: true }, order: [["name", "ASC"]] });
    const draft = { ...EMPTY_DRAFT };
    const vague = "can you fit me in sometime that suits";

    console.log("");
    console.log("=".repeat(88));
    console.log("GEMINI PATH CHECK (mocked transport, real parsing and validation)");
    console.log("=".repeat(88));

    let passed = 0;

    for (const testCase of CASES) {
        delete require.cache[require.resolve("../services/nluService")];
        mockGemini(testCase.model);
        const { understand } = require("../services/nluService");

        const nlu = await understand(vague, draft, services, null);
        const problems = [];
        const e = testCase.expect;

        if (e.intent && nlu.intent !== e.intent) problems.push(`intent ${nlu.intent} != ${e.intent}`);
        if (e.serviceId !== undefined && nlu.serviceId !== e.serviceId) problems.push(`serviceId ${nlu.serviceId} != ${e.serviceId}`);
        if (e.date !== undefined && nlu.date !== e.date) problems.push(`date ${nlu.date} != ${e.date}`);
        if (e.startMin !== undefined && nlu.startMin !== e.startMin) problems.push(`startMin ${nlu.startMin} != ${e.startMin}`);
        if (e.period !== undefined && nlu.period !== e.period) problems.push(`period ${nlu.period} != ${e.period}`);
        if (e.confidence !== undefined && nlu.confidence !== e.confidence) problems.push(`confidence ${nlu.confidence} != ${e.confidence}`);
        if (e.usedModel !== undefined && Boolean(nlu.usedModel) !== e.usedModel) problems.push(`usedModel ${nlu.usedModel} != ${e.usedModel}`);
        if (e.startMinIsNull && nlu.startMin !== null && nlu.startMin !== undefined) problems.push(`startMin should be empty, got ${nlu.startMin}`);
        if (e.serviceIdIsUndefined && nlu.serviceId !== undefined) problems.push(`serviceId should be dropped, got ${nlu.serviceId}`);
        if (e.dateIsUndefined && nlu.date !== undefined) problems.push(`date should be dropped, got ${nlu.date}`);

        const ok = problems.length === 0;
        if (ok) passed += 1;
        console.log(`${ok ? "PASS" : "FAIL"}  ${testCase.name}`);
        for (const problem of problems) console.log(`      ! ${problem}`);
    }

    delete require.cache[require.resolve("../services/nluService")];
    mockGeminiFailure(429, '{"error":{"code":429,"message":"quota"}}');
    const { understand } = require("../services/nluService");
    const degraded = await understand(vague, { ...EMPTY_DRAFT }, services, null);
    const degradedOk = degraded.usedModel === false && degraded.intent === "UNKNOWN";
    if (degradedOk) passed += 1;
    console.log(`${degradedOk ? "PASS" : "FAIL"}  429 degrades to the rules pass without throwing`);

    const level = lastRequestBody?.generationConfig?.thinkingConfig?.thinkingLevel;
    const thinkingOff = level === "low";
    if (thinkingOff) passed += 1;
    console.log(`${thinkingOff ? "PASS" : "FAIL"}  request minimises thinking (thinkingLevel "${level}")`);

    global.fetch = realFetch;

    const total = CASES.length + 2;
    console.log("=".repeat(88));
    console.log(`${passed}/${total} passed`);
    console.log("=".repeat(88));
    console.log("");

    await sequelize.close();
    process.exit(passed === total ? 0 : 1);
}

run();
