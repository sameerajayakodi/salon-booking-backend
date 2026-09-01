const PLACEHOLDER = true;

const salon = {
    tagline: "A small ladies salon in Colombo 03, run by the same team since 2014.",
    address: "No. 42, Galle Road, Colombo 03, Sri Lanka",
    addressShort: "No. 42, Galle Road, Colombo 03",
    landmark: "on the first floor above the pharmacy, opposite the Liberty roundabout",
    mapsUrl: "https://maps.google.com/?q=No.+42,+Galle+Road,+Colombo+03,+Sri+Lanka",
    directions: "If you are coming down Galle Road from Kollupitiya, we are on the left just after the Liberty roundabout. Any 100, 101 or 102 bus stops at Liberty, and the salon is a two minute walk from there.",
    parking: "There is free customer parking for four cars in the lane behind the building, and metered street parking along Galle Road. If the rear spaces are full the Liberty car park is a minute away.",
    phone: "+94 11 234 5678",
    whatsapp: "+94 77 123 4567",
    email: "hello@nimalisalon.lk",
    hours: {
        weekdays: "Monday to Friday, 9:00 AM to 6:00 PM",
        saturday: "Saturday, 9:00 AM to 6:00 PM",
        sunday: "Closed on Sundays",
        lastBooking: "The last appointment of the day starts at 5:00 PM.",
    },
    payment: "Cash, Visa and Mastercard are all fine. We do not take cheques, and there is nothing to pay in advance.",
    languages: "Our team speaks Sinhala, Tamil and English.",
    amenities: "Air conditioned, free wifi, and tea or coffee while you wait.",
};

const services = {
    Facial: {
        price: 5500,
        priceNote: "5,500 rupees",
        summary: "A deep cleanse with steam, gentle extraction, a facial massage and a finishing mask.",
        summarySi: "වාෂ්ප, මෘදු පිරිසිදු කිරීම, මුහුණේ සම්බාහනය සහ අවසන් මාස්ක් එකක් සමඟ ගැඹුරු පිරිසිදු කිරීමක්.",
        summarySien: "Steam ekai, gentle cleaning ekai, mukhe massage ekai, awasanayata mask ekakui ekka deep clean ekak.",
        summaryTa: "நீராவி, மென்மையான சுத்திகரிப்பு, முக மசாஜ் மற்றும் இறுதி மாஸ்க் அடங்கிய ஆழமான சுத்திகரிப்பு.",
        goodFor: "Dullness, dryness and a general glow before an event.",
        aftercare: "Avoid direct sun and heavy makeup for about 24 hours, and keep the skin well moisturised.",
        prep: "Come with a clean face if you can, and let us know about any allergies.",
        notes: "The most complete of our skin treatments.",
    },
    Cleanup: {
        price: 3500,
        priceNote: "3,500 rupees",
        summary: "A shorter skin treatment: cleanse, exfoliate and extraction, without the massage or mask.",
        summarySi: "කෙටි සම ප්‍රතිකාරයක් — පිරිසිදු කිරීම, ලෙලි ඉවත් කිරීම සහ කුරුලෑ ඉවත් කිරීම. සම්බාහනය හෝ මාස්ක් නැත.",
        summarySien: "Kota skin treatment ekak — cleaning, scrub ekai, blackheads ain karanawa. Massage ekak, mask ekak na.",
        summaryTa: "குறுகிய சரும சிகிச்சை — சுத்தம், ஸ்க்ரப் மற்றும் கரும்புள்ளி நீக்கம். மசாஜ் அல்லது மாஸ்க் இல்லை.",
        goodFor: "Regular upkeep between facials, or clogged pores and blackheads.",
        aftercare: "Keep the skin moisturised and avoid scrubbing for a day.",
        prep: "Nothing special is needed.",
        notes: "A Cleanup is the quicker, lighter version of a Facial. A Facial adds a massage and a mask, so it takes longer and does more for tired or dry skin.",
    },
    "Hair Colouring": {
        price: 8500,
        priceNote: "from 8,500 rupees, depending on length and thickness",
        summary: "Full colour application with a wash and blow-dry finish.",
        summarySi: "සම්පූර්ණ වර්ණ ගැන්වීමක්, සේදීම සහ බ්ලෝ ඩ්‍රයි එකක් සමඟ.",
        summarySien: "Sampurna colour ekak, wash ekai blow dry ekai ekka.",
        summaryTa: "முழு வண்ணம் பூசுதல், கழுவல் மற்றும் ப்ளோ ட்ரை உடன்.",
        goodFor: "Grey coverage, a full change of shade, or refreshing faded colour.",
        aftercare: "Wait 48 hours before washing, and use a sulphate free shampoo afterwards.",
        prep: "If it is your first colour with us we recommend a patch test 48 hours beforehand.",
        notes: "Longer or thicker hair needs more product, so the final price is confirmed at the salon.",
    },
    Haircut: {
        price: 2500,
        priceNote: "2,500 rupees",
        summary: "A consultation, cut and blow-dry finish.",
        summarySi: "සාකච්ඡාවක්, කැපීමක් සහ බ්ලෝ ඩ්‍රයි එකක්.",
        summarySien: "Podi consultation ekak, cut ekai, blow dry ekai.",
        summaryTa: "ஆலோசனை, வெட்டு மற்றும் ப்ளோ ட்ரை.",
        goodFor: "A trim, a restyle, or tidying up layers and fringe.",
        aftercare: "No special aftercare needed.",
        prep: "Come with dry or damp hair, either is fine.",
        notes: "Wash and blow-dry are included in the price.",
    },
};

const policies = {
    cancellation: "Please give us at least 4 hours notice if you need to cancel or move an appointment.",
    lateness: "If you are more than 15 minutes late we may need to shorten the treatment or move you to another slot.",
    arrival: "Arriving 5 to 10 minutes early gives us time to settle you in.",
    guests: "You are welcome to bring one guest with you, though our waiting area is small.",
    children: "Children are welcome but we ask that they stay with an adult at all times.",
    deposits: "No deposit is needed. You pay at the salon after your treatment.",
    walkIns: "Walk-ins are welcome when we have a free slot, but booking ahead is safer.",
    hygiene: "Tools are sterilised between every client and towels are used once.",
    patchTest: "For a first colour we ask for a patch test 48 hours before the appointment.",
};

const TOPICS = ["location", "parking", "hours", "contact", "price", "aftercare", "cancellation", "payment", "walkin"];

function pick(map, lang) {
    return map[lang] || map.en;
}

function serviceSummary(name, lang) {
    const facts = services[name];
    if (!facts) return "";
    if (lang === "si" && facts.summarySi) return facts.summarySi;
    if (lang === "sien" && facts.summarySien) return facts.summarySien;
    if (lang === "ta" && facts.summaryTa) return facts.summaryTa;
    return facts.summary;
}

function priceLines(catalogue, lang) {
    return catalogue
        .map((service) => {
            const facts = services[service.name];
            if (!facts) return null;
            return service.name + " — " + facts.priceNote + ", " + service.durationMin + " min. "
                + serviceSummary(service.name, lang);
        })
        .filter(Boolean);
}

const TEXT = {
    location: {
        en: "We are at {address}, {landmark}. Here is the map so you can find us easily: {maps}",
        si: "අපි {address} — {landmark}. පහසුවෙන් හොයාගන්න පුළුවන් සිතියම මෙන්න: {maps}",
        sien: "Api thiyenne {address}, {landmark}. Lesiyen hoyaganna map eka mehe: {maps}",
        ta: "நாங்கள் {address}, {landmark}. வரைபடம் இதோ: {maps}",
    },
    directions: {
        en: "{directions}",
        si: "{directions}",
        sien: "{directions}",
        ta: "{directions}",
    },
    parking: {
        en: "{parking}",
        si: "{parking}",
        sien: "{parking}",
        ta: "{parking}",
    },
    hours: {
        en: "We are open {weekdays}, and {saturday}. {sunday}. {lastBooking}",
        si: "අපි විවෘතයි: {weekdays}, {saturday}. {sunday}. {lastBooking}",
        sien: "Api open: {weekdays}, {saturday}. {sunday}. {lastBooking}",
        ta: "நாங்கள் திறந்திருக்கிறோம்: {weekdays}, {saturday}. {sunday}. {lastBooking}",
    },
    contact: {
        en: "You can call us on {phone}, or just keep chatting here on {whatsapp}. Email is {email} if that is easier.",
        si: "ඔබට {phone} අමතන්න පුළුවන්, නැත්නම් මෙතනම {whatsapp} හරහා කතා කරන්න. Email එක {email}.",
        sien: "Oyata {phone} ta call karanna puluwan, nathnam methanama {whatsapp} eken katha karanna. Email eka {email}.",
        ta: "{phone} என்ற எண்ணில் அழைக்கலாம், அல்லது இங்கேயே {whatsapp} இல் தொடரலாம். மின்னஞ்சல் {email}.",
    },
    priceIntro: {
        en: "Of course, here is what we charge:",
        si: "අනිවාර්යයෙන්ම, අපේ ගාස්තු මෙන්න:",
        sien: "Aniwaryen, ape gaana mehema:",
        ta: "நிச்சயமாக, எங்கள் கட்டணங்கள் இதோ:",
    },
    priceNote: {
        en: "Everything is paid at the salon after your treatment, and there is nothing to pay to reserve a time.",
        si: "සියල්ල ප්‍රතිකාරයෙන් පසු සැලූන් එකේදී ගෙවන්න පුළුවන්. වෙලාවක් වෙන් කරන්න කලින් ගෙවීමක් නෑ.",
        sien: "Hama dheyakma treatment eken passe salon eke gewanna puluwan. Welawak reserve karanna kalin gewanna one na.",
        ta: "அனைத்தும் சிகிச்சைக்குப் பிறகு சலூனில் செலுத்தலாம். முன்பணம் தேவையில்லை.",
    },
    aftercare: {
        en: "Here is what we usually suggest afterwards. {aftercare}",
        si: "ප්‍රතිකාරයෙන් පසු අපි සාමාන්‍යයෙන් නිර්දේශ කරන්නේ මෙයයි. {aftercare}",
        sien: "Treatment eken passe api samanyayen kiyanne mehemai. {aftercare}",
        ta: "சிகிச்சைக்குப் பிறகு நாங்கள் பரிந்துரைப்பது இதுதான். {aftercare}",
    },
    cancellation: {
        en: "That is no trouble at all. {cancellation} {lateness}",
        si: "ඒක කිසිම කරදරයක් නෑ. {cancellation} {lateness}",
        sien: "Eka kisima prashnayak na. {cancellation} {lateness}",
        ta: "அது எந்தப் பிரச்சினையும் இல்லை. {cancellation} {lateness}",
    },
    payment: {
        en: "{payment} {deposits}",
        si: "{payment} {deposits}",
        sien: "{payment} {deposits}",
        ta: "{payment} {deposits}",
    },
    walkin: {
        en: "{walkIns} {arrival}",
        si: "{walkIns} {arrival}",
        sien: "{walkIns} {arrival}",
        ta: "{walkIns} {arrival}",
    },
};

const OFFER = {
    withService: {
        en: "Would you like me to reserve a spot for your {service}? Today or tomorrow both have openings.",
        si: "ඔබට {service} සඳහා වෙලාවක් වෙන් කරන්නද? අද සහ හෙට දෙකේම වෙලාවන් තියෙනවා.",
        sien: "Oyata {service} ekakata welawak reserve karannada? Adath hetath dekema welawal thiyenawa.",
        ta: "உங்களுக்கு {service} க்கு ஒரு நேரத்தை பதிவு செய்யட்டுமா? இன்றும் நாளையும் இடம் உள்ளது.",
    },
    withoutService: {
        en: "Would you like me to book something in for you? Just tell me which treatment and I will find you a time.",
        si: "ඔබට යමක් වෙන් කරන්නද? මොන ප්‍රතිකාරයද කියන්න, මම වෙලාවක් හොයන්නම්.",
        sien: "Oyata mokak hari book karannada? Mona treatment ekada kiyanna, mama welawak hoyannam.",
        ta: "உங்களுக்கு ஏதாவது பதிவு செய்யட்டுமா? எந்த சிகிச்சை என்று சொல்லுங்கள், நேரம் பார்க்கிறேன்.",
    },
    midFlow: {
        en: "Shall we carry on with your booking?",
        si: "අපි ඔබේ වෙන් කිරීම දිගටම කරගෙන යමුද?",
        sien: "Api oyage booking eka digatama karamuda?",
        ta: "உங்கள் பதிவைத் தொடரலாமா?",
    },
};

function fill(template, values) {
    let out = template;
    for (const [key, value] of Object.entries(values)) {
        out = out.split("{" + key + "}").join(value);
    }
    return out;
}

function topicAnswer(topic, lang, catalogue, about) {
    if (topic === "location") {
        const base = fill(pick(TEXT.location, lang), {
            address: salon.address,
            landmark: salon.landmark,
            maps: salon.mapsUrl,
        });
        return base + " " + salon.directions;
    }

    if (topic === "parking") return fill(pick(TEXT.parking, lang), { parking: salon.parking });

    if (topic === "hours") {
        return fill(pick(TEXT.hours, lang), {
            weekdays: salon.hours.weekdays,
            saturday: salon.hours.saturday,
            sunday: salon.hours.sunday,
            lastBooking: salon.hours.lastBooking,
        });
    }

    if (topic === "contact") {
        return fill(pick(TEXT.contact, lang), {
            phone: salon.phone,
            whatsapp: salon.whatsapp,
            email: salon.email,
        });
    }

    if (topic === "price") {
        const only = about ? catalogue.filter((s) => s.id === about.id) : catalogue;
        const lines = priceLines(only, lang);
        return pick(TEXT.priceIntro, lang) + "\n" + lines.map((l) => "- " + l).join("\n")
            + "\n" + pick(TEXT.priceNote, lang);
    }

    if (topic === "aftercare") {
        const facts = about ? services[about.name] : null;
        const advice = facts
            ? facts.aftercare
            : Object.values(services).map((s) => s.aftercare).join(" ");
        return fill(pick(TEXT.aftercare, lang), { aftercare: advice });
    }

    if (topic === "cancellation") {
        return fill(pick(TEXT.cancellation, lang), {
            cancellation: policies.cancellation,
            lateness: policies.lateness,
        });
    }

    if (topic === "payment") {
        return fill(pick(TEXT.payment, lang), { payment: salon.payment, deposits: policies.deposits });
    }

    if (topic === "walkin") {
        return fill(pick(TEXT.walkin, lang), { walkIns: policies.walkIns, arrival: policies.arrival });
    }

    return null;
}

function bookingOffer(lang, about, midFlow) {
    if (midFlow) return pick(OFFER.midFlow, lang);
    if (about) return fill(pick(OFFER.withService, lang), { service: about.name });
    return pick(OFFER.withoutService, lang);
}

function serviceFacts(name) {
    return services[name] || null;
}

function knowledgeLines(catalogue) {
    const lines = [];

    lines.push("SALON");
    lines.push("- Name: " + salon.tagline);
    lines.push("- Address: " + salon.address + " (" + salon.landmark + ")");
    lines.push("- Google Maps link: " + salon.mapsUrl);
    lines.push("- Directions: " + salon.directions);
    lines.push("- Parking: " + salon.parking);
    lines.push("- Hours: " + salon.hours.weekdays + ". " + salon.hours.saturday + ". " + salon.hours.sunday + ". " + salon.hours.lastBooking);
    lines.push("- Phone: " + salon.phone + ". WhatsApp: " + salon.whatsapp + ". Email: " + salon.email);
    lines.push("- Payment: " + salon.payment);
    lines.push("- Languages: " + salon.languages);
    lines.push("- Comfort: " + salon.amenities);

    lines.push("");
    lines.push("SERVICES AND PRICES");
    for (const service of catalogue) {
        const facts = serviceFacts(service.name);
        const parts = [service.name + " costs " + (facts ? facts.priceNote : "a price we confirm at the salon")
            + " and lasts " + service.durationMin + " minutes."];
        if (facts) {
            parts.push(facts.summary);
            parts.push("Good for: " + facts.goodFor);
            parts.push("Before: " + facts.prep);
            parts.push("Aftercare: " + facts.aftercare);
            if (facts.notes) parts.push(facts.notes);
        }
        lines.push("- " + parts.join(" "));
    }

    lines.push("");
    lines.push("POLICIES");
    lines.push("- Cancellations: " + policies.cancellation);
    lines.push("- Running late: " + policies.lateness);
    lines.push("- Arrival: " + policies.arrival);
    lines.push("- Guests: " + policies.guests);
    lines.push("- Children: " + policies.children);
    lines.push("- Payment timing: " + policies.deposits);
    lines.push("- Walk-ins: " + policies.walkIns);
    lines.push("- Hygiene: " + policies.hygiene);
    lines.push("- Patch test: " + policies.patchTest);

    return lines.join("\n");
}

module.exports = {
    PLACEHOLDER,
    salon,
    services,
    policies,
    TOPICS,
    serviceFacts,
    serviceSummary,
    priceLines,
    topicAnswer,
    bookingOffer,
    knowledgeLines,
};
