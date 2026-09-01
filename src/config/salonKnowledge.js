const PLACEHOLDER = true;

const NEWLINE = String.fromCharCode(10);

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
    "Hair Treatment": {
        price: 6500,
        priceNote: "from 6,500 rupees, depending on length",
        summary: "A deep conditioning hair spa with a scalp massage, steam and a rinse out treatment.",
        summarySi: "හිසේ සම්බාහනය, වාෂ්ප සහ ගැඹුරු කන්ඩිෂනිං ප්‍රතිකාරයක් සහිත හෙයාර් ස්පා එකක්.",
        summarySien: "Hise massage ekai, steam ekai, deep conditioning ekai ekka hair spa ekak.",
        summaryTa: "தலை மசாஜ், நீராவி மற்றும் ஆழமான கண்டிஷனிங் அடங்கிய ஹேர் ஸ்பா.",
        goodFor: "Dry, frizzy or chemically treated hair, and an itchy scalp.",
        aftercare: "Leave the hair to settle for a day and use a mild shampoo at the next wash.",
        prep: "Come with your usual hair, washed or unwashed is fine.",
        notes: "Often booked together with a Haircut.",
    },
    Threading: {
        price: 800,
        priceNote: "800 rupees for eyebrows, 1,200 rupees for eyebrows and upper lip",
        summary: "Precise eyebrow shaping with cotton thread, plus upper lip or chin if you like.",
        summarySi: "නූල් භාවිතයෙන් ඇහි බැම හැඩගැන්වීම, අවශ්‍ය නම් උඩු තොල හෝ නිකට ද.",
        summarySien: "Nool eken eyebrow shape karanawa, ona nam udu thola, nikatath karanawa.",
        summaryTa: "நூல் மூலம் புருவ வடிவமைப்பு, தேவைப்பட்டால் மேல் உதடும்.",
        goodFor: "A quick tidy up before an event, or regular upkeep every few weeks.",
        aftercare: "Avoid makeup on the area for a few hours; a little redness is normal.",
        prep: "Let the hair grow out a little so we have something to shape.",
        notes: "Our quickest service at 15 minutes.",
    },
    Manicure: {
        price: 2800,
        priceNote: "2,800 rupees, or 3,500 rupees with gel polish",
        summary: "Nail shaping, cuticle care, a hand massage and polish of your choice.",
        summarySi: "නියපොතු හැඩගැන්වීම, කියුටිකල් සත්කාරය, අත් සම්බාහනය සහ ඔබ කැමති තීන්තයක්.",
        summarySien: "Niyapothu shape karanawa, cuticle care ekai, athe massage ekai, oyata ona polish ekai.",
        summaryTa: "நக வடிவமைப்பு, க்யூட்டிகிள் பராமரிப்பு, கை மசாஜ் மற்றும் பாலிஷ்.",
        goodFor: "Brittle nails, dry hands, or getting ready for an occasion.",
        aftercare: "Give the polish an hour to harden fully before washing up.",
        prep: "Come with bare nails if you can, or we will remove the old polish for you.",
        notes: "Gel polish adds about fifteen minutes.",
    },
    Pedicure: {
        price: 3800,
        priceNote: "3,800 rupees, or 4,500 rupees with gel polish",
        summary: "A soak, heel and callus care, nail shaping, a foot massage and polish.",
        summarySi: "පාද පොඟවා ගැනීම, විලුඹ සත්කාරය, නියපොතු හැඩගැන්වීම, පාද සම්බාහනය සහ තීන්ත.",
        summarySien: "Kakul soak karanawa, wilumba care ekai, niyapothu shape ekai, massage ekai, polish ekai.",
        summaryTa: "கால் ஊறவைத்தல், குதிகால் பராமரிப்பு, நக வடிவமைப்பு, மசாஜ் மற்றும் பாலிஷ்.",
        goodFor: "Cracked heels, tired feet, or before a wedding or trip.",
        aftercare: "Wear open shoes for the rest of the day if you have had polish.",
        prep: "Nothing special is needed.",
        notes: "Booked together with a Manicure by most of our clients.",
    },
    Waxing: {
        price: 4000,
        priceNote: "from 4,000 rupees for full arms, 5,500 rupees for full legs",
        summary: "Warm wax hair removal for arms, legs or underarms.",
        summarySi: "අත්, කකුල් හෝ කිහිලි සඳහා උණුසුම් වැක්ස් රෝම ඉවත් කිරීම.",
        summarySien: "Ath, kakul, nathnam kihili walata warm wax eken roma ain karanawa.",
        summaryTa: "கை, கால் அல்லது அக்குள் பகுதிக்கு வெதுவெதுப்பான மெழுகு முடி நீக்கம்.",
        goodFor: "Smooth skin that lasts a few weeks, rather than shaving.",
        aftercare: "Avoid hot showers, swimming and sun for 24 hours, and moisturise gently.",
        prep: "Let the hair grow to about a quarter inch so the wax can grip.",
        notes: "The final price depends on the areas you choose, and we confirm it before we start.",
    },
    "Bridal Makeup": {
        price: 25000,
        priceNote: "from 25,000 rupees, confirmed after a trial",
        summary: "Full bridal makeup with skin prep, hair styling and draping, done at the salon.",
        summarySi: "සම සූදානම, කොණ්ඩා මෝස්තරය සහ සාරි ඇඳීම සමඟ සම්පූර්ණ මනාලි සැරසීම.",
        summarySien: "Skin prep ekai, konde style ekai, saree draping ekai ekka sampurna bridal makeup ekak.",
        summaryTa: "சரும தயாரிப்பு, தலைமுடி அலங்காரம் மற்றும் சேலை கட்டுதலுடன் முழு மணப்பெண் ஒப்பனை.",
        goodFor: "Your wedding day, or a homecoming.",
        aftercare: "We will send you home with a small touch up kit for the evening.",
        prep: "We strongly recommend a trial two to three weeks before the day.",
        notes: "This takes about three hours, so we book it first thing in the morning or early afternoon.",
    },
    "Party Makeup": {
        price: 6000,
        priceNote: "6,000 rupees",
        summary: "Occasion makeup with a light hair set, finished to last the evening.",
        summarySi: "සැහැල්ලු කොණ්ඩා සැකසුමක් සමඟ සන්ධ්‍යාව පුරා පවතින සාද මේකප්.",
        summarySien: "Podi hair set ekak ekka, hawasa purama thiyena party makeup ekak.",
        summaryTa: "இலகுவான தலைமுடி அமைப்புடன், மாலை முழுவதும் நிலைக்கும் ஒப்பனை.",
        goodFor: "Weddings you are attending, birthdays and office parties.",
        aftercare: "Use a proper makeup remover the same night rather than soap.",
        prep: "Come with a clean, moisturised face.",
        notes: "Tell us the outfit colour and we will match the look.",
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
        en: "We are located at *{address}*, {landmark}. 📍\n\nGoogle Maps link: {maps}",
        si: "අපගේ සැලූන් එක පිහිටා තියෙන්නේ *{address}* — {landmark}. 📍\n\nGoogle Maps සබැඳිය මෙන්න: {maps}",
        sien: "Api inne *{address}* — {landmark}. 📍\n\nGoogle Maps link eka mehemai: {maps}",
        ta: "நாங்கள் *{address}*, {landmark} இல் உள்ளோம். 📍\n\nவரைபட இணைப்பு: {maps}",
    },
    directions: {
        en: "{directions}",
        si: "{directions}",
        sien: "{directions}",
        ta: "{directions}",
    },
    parking: {
        en: "🚗 *Parking:* {parking}",
        si: "🚗 *Parking:* ගොඩනැගිල්ල පිටුපස නොමිලේ වාහන 4ක් නැවැත්වීමට පහසුකම් ඇත. ගාලු පාරේ Meter Parking ද තියෙනවා. පිටුපස පිරී ඇත්නම්, විනාඩියක දුරින් Liberty Car Park එක තියෙනවා.",
        sien: "🚗 *Parking:* Godanagilla pitipasse lane eke cars 4kata free park karanna puluwan. Galle Road eketh meter parking thiyenawa. Pitipasse full unoth, minithuwaka durin Liberty car park eka thiyenawa.",
        ta: "🚗 *வாகன நிறுத்துமிடம்:* கட்டிடத்தின் பின்புறம் 4 கார்களை இலவசமாக நிறுத்தலாம். காலி வீதியிலும் பார்க்கிங் உள்ளது.",
    },
    hours: {
        en: "🕒 *Opening Hours:*\n{weekdays}\n{saturday}\n{sunday}\n{lastBooking}",
        si: "🕒 *විවෘත වේලාවන්:*\n{weekdays}\n{saturday}\n{sunday}\n{lastBooking}",
        sien: "🕒 *Ape open welawan:*\n{weekdays}\n{saturday}\n{sunday}\n{lastBooking}",
        ta: "🕒 *திறந்திருக்கும் நேரங்கள்:*\n{weekdays}\n{saturday}\n{sunday}\n{lastBooking}",
    },
    contact: {
        en: "📞 You can call us on *{phone}*, or chat with us right here on WhatsApp. Email: *{email}*",
        si: "📞 ඔබට *{phone}* අංකයට කතා කරන්න පුළුවන්, නැත්නම් මෙතැනම WhatsApp හරහා කතා කරන්න. Email: *{email}*",
        sien: "📞 Oyata *{phone}* ekata call karanna puluwan, nathnam methanama WhatsApp eken chat karanna. Email eka *{email}*",
        ta: "📞 எங்களை *{phone}* என்ற எண்ணில் அழைக்கலாம், அல்லது இங்கேயே WhatsApp இல் தொடர்புகொள்ளலாம். மின்னஞ்சல்: *{email}*",
    },
    priceIntro: {
        en: "Of course! Here are our rates: 💳",
        si: "අනිවාර්යයෙන්ම! අපගේ ගාස්තු මෙන්න: 💳",
        sien: "Aniwaryenma! Ape rates mehemai: 💳",
        ta: "நிச்சயமாக! எங்கள் கட்டண விபரம்: 💳",
    },
    priceNote: {
        en: "✨ *Note:* All payments are made at the salon after your treatment. No advance payment is needed to book a slot.",
        si: "✨ *සැලකිය යුතුයි:* සියලුම ගෙවීම් ප්‍රතිකාරයෙන් පසුව සැලූන් එකේදීම සිදු කළ හැක. Booking එකක් දාන්න කලින් මුදල් ගෙවීමක් අවශ්‍ය නැත.",
        sien: "✨ *Note:* Payment okkoma treatment eken passe salon ekedi karanna puluwan. Booking ekak danna advance gewanna one na.",
        ta: "✨ *குறிப்பு:* சிகிச்சைக்குப் பிறகே கட்டணம் செலுத்த வேண்டும். முன்பணம் எதுவும் தேவையில்லை.",
    },
    aftercare: {
        en: "Here is what we recommend after your treatment:\n{aftercare} 🌿",
        si: "හොඳම ප්‍රතිඵල සඳහා ප්‍රතිකාරයෙන් පසු අප නිර්දේශ කරන්නේ මේවායි:\n{aftercare} 🌿",
        sien: "Treatment eken passe hondama results ganna api recommend karanne mehema:\n{aftercare} 🌿",
        ta: "சிகிச்சைக்குப் பிறகு நாங்கள் பரிந்துரைப்பது:\n{aftercare} 🌿",
    },
    cancellation: {
        en: "That is completely fine. ✨\n\n{cancellation} {lateness}",
        si: "කිසි ප්‍රශ්නයක් නැහැ. ✨\n\nBooking එකක් Cancel කරන්න හෝ දිනය වෙනස් කරන්න අවශ්‍ය නම්, කරුණාකර අවම වශයෙන් පැය 4කට පෙර අපට දන්වන්න. විනාඩි 15කට වඩා ප්‍රමාද වුවහොත්, ප්‍රතිකාරය කෙටි කිරීමට හෝ වෙනත් වෙලාවකට මාරු කිරීමට සිදු විය හැක.",
        sien: "Kisima awlak na. ✨\n\nBooking ekak cancel karanna hari date eka wenas karanna hari ona nam, aduma paya 4kata kalinwath kiyanna. Miniththu 15kata wada parakku unoth, treatment eka keti karanna hari wena welawakata daanna hari wenna puluwan.",
        ta: "எந்தப் பிரச்சினையும் இல்லை. ✨\n\nமுன்பதிவை ரத்து செய்ய அல்லது மாற்ற குறைந்தது 4 மணி நேரத்திற்கு முன் தெரிவிக்கவும். 15 நிமிடங்களுக்கு மேல் தாமதமானால் நேரத்தை மாற்ற வேண்டியிருக்கலாம்.",
    },
    payment: {
        en: "💳 *Payments:* {payment} {deposits}",
        si: "💳 *ගෙවීම් ක්‍රම:* Cash, Visa සහ Mastercard මඟින් ගෙවිය හැක. කලින් Advance ගෙවීම් අවශ්‍ය නැත — ප්‍රතිකාරයෙන් පසුව සැලූන් එකේදීම ගෙවිය හැක.",
        sien: "💳 *Payments:* Cash, Visa, saha Mastercard puluwan. Advance gewanna ona na — treatment eken passe salon ekedima gewanna puluwan.",
        ta: "💳 *கட்டண முறைகள்:* பணம், Visa மற்றும் Mastercard ஏற்கப்படும். முன்பணம் தேவையில்லை — சிகிச்சைக்குப் பின் செலுத்தலாம்.",
    },
    walkin: {
        en: "{walkIns} {arrival}",
        si: "වෙලාවක් නිදහස්ව තිබුණොත් කෙලින්ම ඇවිත් කරගන්නත් පුළුවන්, නමුත් කලින් Appointment එකක් දාගෙන පැමිණීම වඩාත් පහසුයි. ඔබගේ වෙලාවට විනාඩි 5-10කට පෙර එන්න පුළුවන් නම් වඩාත් හොඳයි. ⏳",
        sien: "Welawak free thibunoth kelinma awith karaganna puluwan, eth kalin book karagena ena eka godak lesiyi. Oyage welawata miniththu 5-10kata kalin awoth hondatama athi. ⏳",
        ta: "இடம் இருந்தால் நேரடியாக வரலாம், ஆனால் முன்பதிவு செய்வது நல்லது. நேரத்திற்கு 5-10 நிமிடங்கள் முன்னதாக வரவும். ⏳",
    },
};

const OFFER = {
    withService: {
        en: "Would you like me to reserve a spot for your *{service}*? Today or tomorrow both have openings. 📅",
        si: "මම ඔබට *{service}* සඳහා වෙලාවක් වෙන් කරන්නද? අද සහ හෙට දෙකේම slots තියෙනවා. 📅",
        sien: "Mama oyata *{service}* ekata welawak reserve karala dennada? Adath hetath dekema slots thiyenawa. 📅",
        ta: "உங்களுக்கு *{service}* க்கு நேரம் பதிவு செய்யட்டுமா? இன்றும் நாளையும் இடங்கள் உள்ளன. 📅",
    },
    withoutService: {
        en: "Would you like to book an appointment? Just let me know which treatment, and I'll find a time for you. ✨",
        si: "ඔබට Appointment එකක් දාගන්න අවශ්‍යද? මොන සේවාවද කියලා කිව්වොත් මම හොඳ වෙලාවක් බලලා දෙන්නම්. ✨",
        sien: "Oyata appointment ekak daaganna onada? Mona service ekada kiyanna, mama free welawak balala dennam. ✨",
        ta: "முன்பதிவு செய்ய விரும்புகிறீர்களா? எந்த சிகிச்சை என்று சொல்லுங்கள், நேரம் பார்க்கிறேன். ✨",
    },
    midFlow: {
        en: "Shall we carry on with your booking? 💇‍♀️",
        si: "අපි ඔබේ Booking එක දිගටම කරගෙන යමුද? 💇‍♀️",
        sien: "Api oyage booking eka digatama karagena yamuda? 💇‍♀️",
        ta: "முன்பதிவைத் தொடரலாமா? 💇‍♀️",
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
        const filled = fill(pick(TEXT.location, lang), {
            address: salon.address,
            landmark: salon.landmark,
            maps: salon.mapsUrl,
        });

        const blank = NEWLINE + NEWLINE;
        const split = filled.indexOf(blank);
        if (split === -1) return filled;

        const intro = filled.slice(0, split);
        const mapsLine = filled.slice(split + blank.length);
        const spoken = lang === "en" || lang === "sien" ? intro + " " + salon.directions : intro;

        return spoken + blank + mapsLine;
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
