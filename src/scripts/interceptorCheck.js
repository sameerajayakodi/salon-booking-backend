const realFetch = global.fetch;
let lastPrompt = null;

function mockModel(answerText) {
    global.fetch = async (url, options) => {
        if (!String(url).includes("generativelanguage")) return realFetch(url, options);
        const body = JSON.parse(options.body);
        const prompt = body.contents[0].parts[0].text;
        const isAnswer = prompt.includes("receptionist");
        if (isAnswer) lastPrompt = prompt;

        return {
            ok: true,
            status: 200,
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{
                            text: isAnswer
                                ? answerText
                                : JSON.stringify({ language: "en", intent: "UNKNOWN", confidence: 0.3 }),
                        }],
                    },
                    finishReason: "STOP",
                }],
                usageMetadata: { promptTokenCount: 700, candidatesTokenCount: 24, thoughtsTokenCount: 0 },
            }),
        };
    };
}

const { sequelize, Customer, Conversation, Service } = require("../models");
const { handle } = require("../services/conversationService");
const { knowledgeLines, services: KB_SERVICES } = require("../config/salonKnowledge");

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
    const phone = "9477000" + String(1000 + Math.floor(Math.random() * 8999));
    const customer = await Customer.findOne({ where: { phone } });
    if (customer) await Conversation.destroy({ where: { customerId: customer.id } });
    return phone;
}

async function run() {
    console.log("");
    console.log("=".repeat(92));
    console.log("KNOWLEDGE BASE + INTERCEPTOR CHECK (mocked transport, real prompt and routing)");
    console.log("=".repeat(92));

    const catalogue = await Service.findAll({ where: { isActive: true }, order: [["name", "ASC"]] });

    check(
        "every active service has knowledge base facts",
        catalogue.map((s) => s.name).filter((n) => !KB_SERVICES[n]).join(", ") || null,
    );

    check(
        "knowledge base durations are taken from the database",
        knowledgeLines(catalogue).includes("Facial costs 5,500 rupees and lasts 60 minutes")
            ? null
            : "duration not sourced from the catalogue",
    );

    mockModel("A facial with us takes about 60 minutes from start to finish.");

    let phone = await freshPhone();
    await handle(phone, "Facial");
    const answered = await handle(phone, "How long does a facial take?");

    check("the question is intercepted", answered.answered ? null : "not intercepted");
    check(
        "the model answer is prefaced onto the pending step",
        answered.reply.includes("60 minutes") && answered.reply.includes("Which day")
            ? null
            : "answer or pending question missing",
    );
    check("the draft survives the question", answered.draft.serviceId === 1 ? null : "draft lost its service");

    check("the prompt carries the salon address", lastPrompt.includes("Galle Road") ? null : "address missing");
    check("the prompt carries parking facts", lastPrompt.includes("parking") ? null : "parking missing");
    check("the prompt carries opening hours", lastPrompt.includes("Closed on Sundays") ? null : "hours missing");
    check("the prompt carries payment methods", lastPrompt.includes("Visa and Mastercard") ? null : "payment missing");
    check(
        "the prompt explains Cleanup versus Facial",
        lastPrompt.includes("lighter version of a Facial") ? null : "service comparison missing",
    );
    check("the prompt carries the cancellation policy", lastPrompt.includes("4 hours notice") ? null : "cancellation missing");
    check("the prompt carries the guest policy", lastPrompt.includes("one guest") ? null : "guest policy missing");

    check(
        "the prompt forbids anything outside the knowledge base",
        lastPrompt.includes("Use ONLY the facts listed above") ? null : "grounding instruction missing",
    );
    check(
        "the prompt forbids inventing availability",
        lastPrompt.includes("Never state or invent appointment availability") ? null : "availability guard missing",
    );
    check(
        "the prompt carries the real prices and forbids guessing them",
        lastPrompt.includes("5,500 rupees") && lastPrompt.includes("never round or guess")
            ? null
            : "price grounding missing",
    );
    check(
        "the prompt carries the Google Maps link",
        lastPrompt.includes("maps.google.com") ? null : "maps link missing",
    );
    check(
        "the prompt asks for one or two sentences",
        lastPrompt.includes("ONE or TWO short sentences") ? null : "brevity instruction missing",
    );

    phone = await freshPhone();
    await handle(phone, "Facial");
    await handle(phone, "tomorrow");
    const changed = await handle(phone, "then make it a cleanup instead");

    check("a change of mind still switches the service", changed.draft.serviceId === 3 ? null : "service did not change");
    check("the time is cleared on that change", changed.draft.startMin === null ? null : "time was not cleared");

    global.fetch = realFetch;

    console.log("=".repeat(92));
    console.log(failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED");
    console.log("=".repeat(92));
    console.log("");

    await sequelize.close();
    process.exit(failures === 0 ? 0 : 1);
}

run();
