const logger = require("../log/logger");
const { Conversation } = require("../models");
const { config } = require("../config/env");
const { EMPTY_DRAFT } = require("../constants/booking");
const { knowledgeLines } = require("../config/salonKnowledge");
const { DECLARATIONS, execute, activeServices } = require("./agentTools");
const { upsertCustomer } = require("./bookingService");
const { detectLanguage } = require("./nluService");
const { normalizeLang } = require("./messageService");
const { todayISO, weekdayLabel } = require("../utils/time");

const MAX_TOOL_STEPS = 6;
const MAX_HISTORY_TURNS = 24;

const LANGUAGE_GUIDE = {
    en: "English",
    si: "Sinhala script",
    ta: "Tamil script",
    sien: "romanised Singlish, which is Sinhala written in Latin letters",
};

function systemInstruction(services, lang) {
    const today = todayISO();

    return [
        "You are the booking assistant for " + config.salon.name + ", a ladies salon in Sri Lanka.",
        "You speak with customers on WhatsApp. Be warm, brief and natural, like a friendly receptionist.",
        "",
        "TODAY IS " + today + " (" + weekdayLabel(today) + "). Timezone " + config.salon.timezone + ".",
        "Resolve relative dates such as tomorrow, next Friday, next month, heta, naalai yourself,",
        "and always pass tools an exact YYYY-MM-DD date.",
        "",
        "LANGUAGE",
        "Reply in the same language the customer writes in: English, Sinhala script, Tamil script,",
        "or romanised Singlish. The customer currently appears to be using " + (LANGUAGE_GUIDE[lang] || "English") + ".",
        "Keep times and dates in Latin digits and 12 hour format in every language.",
        "",
        "YOUR JOB",
        "Guide the customer to a confirmed appointment. You need four things: the service, the date,",
        "a time, and the customer's name. Collect whatever is missing, in whatever order suits the",
        "conversation. If the customer gives several at once, do not ask for them again.",
        "",
        "HARD RULES",
        "1. NEVER state, guess or imply an appointment time until check_availability has returned it.",
        "   Availability lives only in the salon database. Inventing a time is the worst thing you can do.",
        "2. NEVER say an appointment is booked until create_booking has returned booked: true.",
        "3. Call create_booking only after the customer has clearly confirmed the full details.",
        "4. Answer questions about the salon, services, aftercare or policies using get_salon_info only.",
        "   If a fact is not there, say warmly that the salon can confirm it. Never invent prices.",
        "5. If the customer changes the service or date, check availability again before offering times.",
        "",
        "STYLE",
        "Keep replies to one to three short sentences. When you offer times or dates, present them as a",
        "short numbered list so the customer can reply with a number. Do not use markdown or emoji.",
        "Do not repeat the whole summary every turn. Confirm details once, then ask for confirmation.",
        "",
        "SALON FACTS",
        knowledgeLines(services),
    ].join("\n");
}

function toGeminiContents(history) {
    return history.map((entry) => {
        if (entry.role === "user") return { role: "user", parts: [{ text: entry.text }] };
        if (entry.role === "model") return { role: "model", parts: [{ text: entry.text }] };
        if (entry.role === "call") {
            return { role: "model", parts: [{ functionCall: { name: entry.name, args: entry.args || {} } }] };
        }
        return { role: "user", parts: [{ functionResponse: { name: entry.name, response: entry.response || {} } }] };
    });
}

function trimHistory(history) {
    if (history.length <= MAX_HISTORY_TURNS) return history;
    return history.slice(history.length - MAX_HISTORY_TURNS);
}

async function callModel(contents, instruction) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/"
        + config.gemini.model + ":generateContent?key=" + config.gemini.apiKey;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.gemini.timeoutMs);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: instruction }] },
                contents,
                tools: [{ functionDeclarations: DECLARATIONS }],
                toolConfig: { functionCallingConfig: { mode: "AUTO" } },
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 600,
                    ...(config.gemini.thinkingLevel
                        ? { thinkingConfig: { thinkingLevel: config.gemini.thinkingLevel } }
                        : {}),
                },
            }),
        });

        if (!response.ok) {
            const detail = await response.text();
            const error = new Error("Gemini returned " + response.status);
            error.status = response.status;
            error.detail = detail.slice(0, 400);
            throw error;
        }

        return response.json();
    } finally {
        clearTimeout(timer);
    }
}

function readCandidate(payload) {
    const candidate = payload && payload.candidates && payload.candidates[0];
    const parts = candidate && candidate.content && candidate.content.parts ? candidate.content.parts : [];

    const calls = [];
    let text = "";

    for (const part of parts) {
        if (part.functionCall) calls.push(part.functionCall);
        else if (part.text) text += part.text;
    }

    return { calls, text: text.trim(), usage: payload && payload.usageMetadata };
}

async function converse(phone, text) {
    const startedAt = Date.now();

    if (!config.gemini.apiKey) {
        const err = new Error("Gemini is not configured");
        err.code = "agent_unavailable";
        throw err;
    }

    const services = await activeServices();
    const customer = await upsertCustomer(phone);

    const [conversation] = await Conversation.findOrCreate({
        where: { customerId: customer.id },
        defaults: { customerId: customer.id, draft: { ...EMPTY_DRAFT }, history: [], lang: "en" },
    });

    const detected = detectLanguage(text);
    const lang = normalizeLang(detected || customer.lang);
    if (detected) await upsertCustomer(phone, { lang });

    const history = Array.isArray(conversation.history) ? [...conversation.history] : [];
    history.push({ role: "user", text });

    logger.info("Agent turn started", {
        event: "agent.inbound",
        phone,
        customerId: customer.id,
        text,
        language: lang,
        historyLength: history.length,
    });

    const instruction = systemInstruction(services, lang);
    const context = { phone, lang, customerId: customer.id, booking: null };
    const toolCalls = [];

    let reply = "";
    let modelCalls = 0;

    for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
        const payload = await callModel(toGeminiContents(history), instruction);
        modelCalls += 1;

        const { calls, text: answer, usage } = readCandidate(payload);

        logger.debug("Agent model step", {
            event: "agent.step",
            step,
            toolCalls: calls.map((c) => c.name),
            promptTokens: usage && usage.promptTokenCount,
            outputTokens: usage && usage.candidatesTokenCount,
        });

        if (!calls.length) {
            reply = answer;
            if (reply) history.push({ role: "model", text: reply });
            break;
        }

        for (const call of calls) {
            history.push({ role: "call", name: call.name, args: call.args || {} });
            const result = await execute(call.name, call.args, context);
            history.push({ role: "result", name: call.name, response: result });
            toolCalls.push({ name: call.name, args: call.args || {}, result });
        }
    }

    if (!reply) {
        reply = "Sorry, I lost my thread there. Could you tell me again what you would like to book?";
        history.push({ role: "model", text: reply });
        logger.warn("Agent produced no reply", { event: "agent.noreply", phone, steps: MAX_TOOL_STEPS });
    }

    if (context.booking) {
        await conversation.update({ history: [], lang });
    } else {
        await conversation.update({ history: trimHistory(history), lang });
    }

    logger.info("Agent replied", {
        event: "agent.reply",
        phone,
        customerId: customer.id,
        language: lang,
        modelCalls,
        tools: toolCalls.map((t) => t.name),
        bookingId: context.booking ? context.booking.id : undefined,
        durationMs: Date.now() - startedAt,
        reply: reply.replace(/\n/g, " | "),
    });

    return {
        reply,
        lang,
        engine: "agent",
        modelCalls,
        toolCalls,
        booking: context.booking || undefined,
        bookingId: context.booking ? context.booking.id : undefined,
    };
}

async function resetConversation(phone) {
    const customer = await upsertCustomer(phone);
    await Conversation.update(
        { history: [], draft: { ...EMPTY_DRAFT }, lastIntent: null },
        { where: { customerId: customer.id } },
    );
}

module.exports = { converse, resetConversation, systemInstruction };
