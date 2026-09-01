const realFetch = global.fetch;

let scripted = [];
let sentBodies = [];

function mockGemini() {
    global.fetch = async (url, options) => {
        if (!String(url).includes("generativelanguage")) return realFetch(url, options);

        const body = JSON.parse(options.body);
        sentBodies.push(body);

        const next = scripted.shift();
        if (!next) throw new Error("the mock ran out of scripted model responses");
        if (next.httpError) {
            return { ok: false, status: next.httpError, text: async () => '{"error":{"code":' + next.httpError + '}}' };
        }

        const parts = next.calls
            ? next.calls.map((c) => ({ functionCall: { name: c.name, args: c.args } }))
            : [{ text: next.text }];

        return {
            ok: true,
            status: 200,
            json: async () => ({
                candidates: [{ content: { role: "model", parts }, finishReason: "STOP" }],
                usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 40, thoughtsTokenCount: 0 },
            }),
        };
    };
}

const { sequelize, Customer, Conversation, Booking, Slot } = require("../models");
const { resetDemoData } = require("./resetDemo");
const chatRouter = require("../services/chatRouter");
const agentService = require("../services/agentService");
const { todayISO, addDays } = require("../utils/time");

let failures = 0;

function check(label, problem) {
    if (problem) {
        failures += 1;
        console.log("FAIL  " + label);
        console.log("      ! " + problem);
    } else {
        console.log("PASS  " + label);
    }
}

async function freshPhone() {
    const phone = "9477000" + String(2000 + Math.floor(Math.random() * 7999));
    const customer = await Customer.findOne({ where: { phone } });
    if (customer) await Conversation.destroy({ where: { customerId: customer.id } });
    return phone;
}

async function run() {
    await resetDemoData({ quiet: true });
    mockGemini();

    console.log("");
    console.log("=".repeat(96));
    console.log("AGENT CHECK (mocked model transport, real tools, real database)");
    console.log("=".repeat(96));

    const tomorrow = addDays(todayISO(), 1);

    // --- 1. the model asks for availability, then replies with real times ---
    let phone = await freshPhone();
    scripted = [
        { calls: [{ name: "check_availability", args: { service: "Facial", date: tomorrow } }] },
        { text: "We have 9:00 AM, 11:00 AM and 2:00 PM open tomorrow. Which suits you?" },
    ];
    let result = await chatRouter.handle(phone, "facial tomorrow please");

    check("the agent engine handled the turn", result.engine === "agent" ? null : "engine was " + result.engine);
    check("the tool loop ran check_availability", result.toolCalls.some((t) => t.name === "check_availability") ? null : "tool not called");

    const availability = result.toolCalls.find((t) => t.name === "check_availability").result;
    check(
        "availability came from the database",
        Array.isArray(availability.openTimes) && availability.openTimes.length > 0
            ? null
            : "no real slots returned",
    );
    check("the model reply reached the customer", result.reply.includes("9:00 AM") ? null : "reply missing");
    check("two model calls for one tool round trip", result.modelCalls === 2 ? null : "modelCalls was " + result.modelCalls);

    // --- 2. the declarations and system instruction are sent correctly ---
    const firstBody = sentBodies[0];
    const names = firstBody.tools[0].functionDeclarations.map((d) => d.name);
    check(
        "all five tools are declared",
        ["list_services", "check_availability", "suggest_dates", "create_booking", "get_salon_info"]
            .filter((n) => !names.includes(n)).join(", ") || null,
    );
    check("function calling mode is AUTO", firstBody.toolConfig.functionCallingConfig.mode === "AUTO" ? null : "mode missing");

    const instruction = firstBody.systemInstruction.parts[0].text;
    check("the instruction forbids inventing times", instruction.includes("NEVER state, guess or imply an appointment time") ? null : "missing");
    check("the instruction forbids claiming a booking", instruction.includes("NEVER say an appointment is booked") ? null : "missing");
    check("the instruction carries today's date", instruction.includes(todayISO()) ? null : "missing");
    check("the knowledge base is inlined", instruction.includes("Galle Road") && instruction.includes("4 hours notice") ? null : "missing");

    // --- 3. the tool result is fed back to the model ---
    const secondBody = sentBodies[1];
    const hasResponse = JSON.stringify(secondBody.contents).includes("functionResponse");
    check("the tool result is returned to the model", hasResponse ? null : "functionResponse not sent back");

    // --- 4. a real booking, through the real atomic claim ---
    phone = await freshPhone();
    sentBodies = [];
    scripted = [
        { calls: [{ name: "check_availability", args: { service: "Haircut", date: tomorrow } }] },
        { text: "Those are open. Which time would you like?" },
    ];
    await chatRouter.handle(phone, "haircut tomorrow");

    const openBefore = await Slot.count({ where: { slotDate: tomorrow, status: "OPEN" } });

    scripted = [
        { calls: [{ name: "create_booking", args: { service: "Haircut", date: tomorrow, time: "9:00 AM", customerName: "Dilini" } }] },
        { text: "Lovely, that is booked for you Dilini. See you then." },
    ];
    result = await chatRouter.handle(phone, "9am, my name is Dilini");

    check("create_booking was called", result.toolCalls.some((t) => t.name === "create_booking") ? null : "not called");
    check("a booking payload is returned", result.booking && result.booking.reference ? null : "no payload");
    check("the payload has the right shape", result.booking
        && result.booking.customer.name === "Dilini"
        && result.booking.service.name === "Haircut"
        && result.booking.appointment.startLabel === "9:00 AM" ? null : "payload wrong");

    const row = await Booking.findByPk(result.booking.id);
    check("the booking is really in the database", row && row.status === "CONFIRMED" ? null : "not persisted");

    const openAfter = await Slot.count({ where: { slotDate: tomorrow, status: "OPEN" } });
    check("a slot was consumed", openAfter === openBefore - 1 ? null : "open slots went " + openBefore + " -> " + openAfter);

    // --- 5. a taken slot is reported, not silently accepted ---
    phone = await freshPhone();
    scripted = [
        { calls: [{ name: "create_booking", args: { service: "Haircut", date: tomorrow, time: "9:00 AM", customerName: "Second" } }] },
        { text: "Sorry, that one just went. Here are other times." },
    ];
    result = await chatRouter.handle(phone, "book haircut tomorrow 9am for Second");
    const claim = result.toolCalls.find((t) => t.name === "create_booking").result;
    check("a taken slot returns booked:false with alternatives",
        claim.booked === false && Array.isArray(claim.alternatives) ? null : "lock not reported to the model");
    check("no second booking row was created", (await Booking.count({ where: { slotDate: tomorrow, startMin: 540, serviceId: row.serviceId } })) === 1 ? null : "double booking");

    // --- 6. tools refuse to invent things ---
    phone = await freshPhone();
    scripted = [
        { calls: [{ name: "check_availability", args: { service: "Facial", date: "2020-01-01" } }] },
        { text: "That date has passed." },
    ];
    result = await chatRouter.handle(phone, "facial on 1 January 2020");
    check("a past date is refused by the tool",
        result.toolCalls[0].result.error ? null : "past date accepted");

    phone = await freshPhone();
    scripted = [
        { calls: [{ name: "check_availability", args: { service: "Massage", date: tomorrow } }] },
        { text: "We do not offer that." },
    ];
    result = await chatRouter.handle(phone, "massage tomorrow");
    check("an unknown service is refused by the tool",
        result.toolCalls[0].result.error ? null : "unknown service accepted");

    // --- 7. history persists across turns and clears after a booking ---
    phone = await freshPhone();
    scripted = [{ text: "Which service would you like?" }];
    await chatRouter.handle(phone, "hello");
    let customer = await Customer.findOne({ where: { phone } });
    let conversation = await Conversation.findOne({ where: { customerId: customer.id } });
    check("history is persisted between turns", conversation.history.length >= 2 ? null : "history not stored");

    scripted = [
        { calls: [{ name: "create_booking", args: { service: "Cleanup", date: tomorrow, time: "9:00 AM", customerName: "Ruvini" } }] },
        { text: "Booked." },
    ];
    await chatRouter.handle(phone, "cleanup tomorrow 9am, Ruvini");
    conversation = await Conversation.findOne({ where: { customerId: customer.id } });
    check("history clears after a confirmed booking", conversation.history.length === 0 ? null : "history not cleared");

    // --- 8. the deterministic engine catches a model failure ---
    phone = await freshPhone();
    scripted = [{ httpError: 429 }];
    result = await chatRouter.handle(phone, "I want a facial");
    check("a 429 falls back to the rules engine", result.engine === "rules-fallback" ? null : "engine was " + result.engine);
    check("the fallback still replies usefully", result.reply && result.reply.length > 10 ? null : "no usable reply");

    global.fetch = realFetch;

    console.log("=".repeat(96));
    console.log(failures === 0 ? "ALL AGENT CHECKS PASSED" : failures + " CHECK(S) FAILED");
    console.log("=".repeat(96));
    console.log("");

    await sequelize.close();
    process.exit(failures === 0 ? 0 : 1);
}

run();
