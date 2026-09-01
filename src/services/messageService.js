const { LANGUAGES } = require("../constants/booking");
const { config } = require("../config/env");
const logger = require("../log/logger");

const TEMPLATES = {
    greeting: {
        en: "Hello and welcome to *{salon}*! ✨\n\nHere are our available services:\n{services}\n\nWhich service would you like to book? (Reply with the number)",
        si: "ආයුබෝවන්! *{salon}* වෙත සාදරයෙන් පිළිගනිමු! ✨\n\nඅපගේ සේවාවන්:\n{services}\n\nඔබට වෙන් කරගන්න ඕන සේවාව මොකක්ද? (අදාළ අංකය එවන්න)",
        ta: "வணக்கம்! *{salon}* உங்களை அன்புடன் வரவேற்கிறது! ✨\n\nஎங்கள் சேவைகள்:\n{services}\n\nஎந்த சேவையை முன்பதிவு செய்ய விரும்புகிறீர்கள்? (எண்ணை அனுப்பவும்)",
        sien: "Ayubowan! *{salon}* ekata welcome! ✨\n\nApe services:\n{services}\n\nOyata meken mokakda book karaganna ona? (Number eka danna puluwan)",
    },

    services_info: {
        en: "Here is our full service menu:\n{services}\n\nYour current booking details are saved. Would you like to switch to a different service, or continue where we stopped?",
        si: "අපගේ සේවා ලැයිස්තුව මෙන්න:\n{services}\n\nඔබ කලින් තෝරාගත් විස්තර එහෙමම තියෙනවා. වෙනත් සේවාවක් තෝරනවාද, නැත්නම් නැවැත්තූ තැනින්ම කරගෙන යමුද?",
        ta: "எங்கள் சேவைகளின் முழு விபரம்:\n{services}\n\nநீங்கள் தேர்வுசெய்த விபரங்கள் சேமிக்கப்பட்டுள்ளன. வேறு சேவைக்கு மாற விரும்புகிறீர்களா, அல்லது தொடரலாமா?",
        sien: "Ape service list eka mehema:\n{services}\n\nOya kalin thoraagaththa details ehemama thiyenawa. Wena service ekak balanawada, nathnam nawaththapu thanin yamuda?",
    },

    services_info_held: {
        en: "Here is our service menu:\n{services}\n\nYour appointment is still on hold. Reply *Confirm* to finalize it, or let me know if you want another service.",
        si: "අපගේ සේවාවන් මෙන්න:\n{services}\n\nඔබේ Appointment එක තවම hold කරලා තියෙන්නේ. Confirm කරන්න *Confirm* කියලා එවන්න, නැත්නම් වෙනත් සේවාවක් කියන්න.",
        ta: "எங்கள் சேவைகள்:\n{services}\n\nஉங்கள் முன்பதிவு நிறுத்தி வைக்கப்பட்டுள்ளது. உறுதிப்படுத்த *Confirm* என அனுப்பவும், அல்லது வேறு சேவையைச் சொல்லுங்கள்.",
        sien: "Ape services mehema:\n{services}\n\nOyage appointment eka thawama hold karala thiyenne. Confirm karanna *Confirm* kiyala danna, nathnam wena service ekak kiyanna.",
    },

    greeting_back: {
        en: "Hello again! How can I help you?",
        si: "ආයුබෝවන් නැවතත්! මම කොහොමද උදවු කරන්නේ?",
        ta: "மீண்டும் வணக்கம்! நான் எப்படி உதவ முடியும்?",
        sien: "Ayubowan aye! Mama kohomada udaw karanna ona?",
    },

    kb_answer: {
        en: "{answer}",
        si: "{answer}",
        ta: "{answer}",
        sien: "{answer}",
    },

    date_too_far: {
        en: "We can only take appointments up to *{days} days* in advance. Please pick a closer date for *{service}*.",
        si: "අපට Appointments වෙන් කරන්න පුළුවන් ඉදිරි *දින {days}ක්* දක්වා පමණි. කරුණාකර ළඟ දිනයක් තෝරන්න.",
        ta: "அடுத்த *{days} நாட்களுக்குள்* மட்டுமே முன்பதிவு செய்ய முடியும். தயவுசெய்து அருகிலுள்ள ஒரு தேதியைத் தேர்ந்தெடுக்கவும்.",
        sien: "Apita bookings danna puluwan issaraha *dawas {days}k* wenakan witharai. Karunakara laga date ekak thoranna puluwanda?",
    },

    ask_service: {
        en: "Here is what we offer:\n{services}\n\nWhich service would you like to book?",
        si: "අපගේ සේවාවන් මෙන්න:\n{services}\n\nඔබට අවශ්‍ය සේවාව මොකක්ද?",
        ta: "எங்கள் சேவைகள்:\n{services}\n\nஉங்களுக்கு எந்த சேவை வேண்டும்?",
        sien: "Ape services mehema:\n{services}\n\nOyata meken mokakda book karanna ona?",
    },

    ask_date: {
        en: "Great choice! Which day suits you best?\n{dates}\n\nJust reply with a number, or say a day like *tomorrow* or *23/09*.",
        si: "හොඳ තේරීමක්! ඔබට වඩාත්ම පහසු මොන දවසද?\n{dates}\n\nඅංකය එවන්න, නැත්නම් *හෙට*, *අනිද්දා*, හෝ දිනයක් (උදා: *23/09*) එවන්න.",
        ta: "சிறந்த தேர்வு! உங்களுக்கு எந்த நாள் வசதி?\n{dates}\n\nஎண்ணை அனுப்பலாம், அல்லது *நாளை* அல்லது *23/09* என குறிப்பிடலாம்.",
        sien: "Hoda choice ekak! Oyata pahasu mona dawasada?\n{dates}\n\nNumber ekak danna, nathnam *heta*, *anidda*, hari date ekak (eg: *23/09*) kiyanna.",
    },

    ask_date_open: {
        en: "Which day suits you best? (e.g., *tomorrow*, *this Friday*, or a date)",
        si: "ඔබට පහසු කුමන දිනයක්ද? (උදා: *හෙට*, *මේ සිකුරාදා*, හෝ දිනයක්)",
        ta: "உங்களுக்கு எந்த நாள் வசதி? (உதாரணம்: *நாளை*, *இந்த வெள்ளி*, அல்லது குறிப்பிட்ட தேதி)",
        sien: "Oyata pahasu mona dawasada? (eg: *heta*, *me Friday*, nathnam date ekak)",
    },

    ask_time: {
        en: "Available time slots on *{date}*:\n{times}\n\nWhich time works for you? (Reply with the number)",
        si: "*{date}* දිනට තියෙන වේලාවන් මෙන්න:\n{times}\n\nඔබට පහසු වෙලාව මොකක්ද? (අංකය එවන්න)",
        ta: "*{date}* அன்று கிடைக்கும் நேரங்கள்:\n{times}\n\nஎந்த நேரம் உங்களுக்கு வசதி? (எண்ணை அனுப்பவும்)",
        sien: "*{date}* ta thiyena open times:\n{times}\n\nOyata pahasu welawa mokakda? (Number eka danna puluwan)",
    },

    only_time: {
        en: "There is only one slot left on *{date}* at *{time}*.\n\nShall I hold it for you? (Reply *yes* or *ok*)",
        si: "*{date}* දිනට ඉතිරිව තියෙන්නේ *{time}* වේලාව විතරයි.\n\nමම ඒක ඔබට වෙන් කරන්නද? (*ඔව්* හෝ *හරි* කියලා එවන්න)",
        ta: "*{date}* அன்று *{time}* மணிக்கு ஒரே ஒரு நேரம் மட்டுமே உள்ளது.\n\nஅதை உங்களுக்கு பதிவு செய்யவா? (*சரி* என பதிலளிக்கவும்)",
        sien: "*{date}* ta ithuru wela thiyenne *{time}* slot eka witharai.\n\nEka oyata hold karannada? (*hari* hari *yes* kiyala danna)",
    },

    slot_taken: {
        en: "Sorry, *{time}* was just booked.\n\nThese slots are still open:\n{times}\n\nWould one of these work for you?",
        si: "සමාවන්න, *{time}* වේලාව දැන් වෙනත් අයෙක් වෙන් කරගත්තා.\n\nතවමත් විවෘතව ඇති වේලාවන්:\n{times}\n\nමෙහි ඇති වෙලාවක් ඔබට ගැළපෙනවාද?",
        ta: "மன்னிக்கவும், *{time}* நேரம் இப்போது பதிவாகிவிட்டது.\n\nகிடைக்கும் மாற்று நேரங்கள்:\n{times}\n\nஇவற்றில் ஒன்று வசதியாக இருக்குமா?",
        sien: "Sorry, *{time}* welawa dan book una.\n\nThawa open thiyena times mehema:\n{times}\n\nMeken welawak oyata hariyanawada?",
    },

    ask_name: {
        en: "Perfect. May I have your name for the booking?",
        si: "නියමයි. Booking එක දාන්න ඔබේ නම කියන්න පුළුවන්ද?",
        ta: "அருமை. முன்பதிவிற்காக உங்கள் பெயரைச் சொல்ல முடியுமா?",
        sien: "Niyamai. Booking ekata oyage nama kiyanna puluwanda?",
    },

    no_slots: {
        en: "Sorry, *{service}* is fully booked on *{date}*.\n\nThese upcoming dates have openings:\n{dates}\n\nWould one of these days suit you?",
        si: "සමාවන්න, *{date}* දිනට *{service}* සඳහා සියලු වේලාවන් පිරිලා.\n\nවේලාවන් තියෙන ළඟම දින මෙන්න:\n{dates}\n\nමේ දවසක් ඔබට ගැළපෙනවාද?",
        ta: "மன்னிக்கவும், *{date}* அன்று *{service}* முழுவதும் நிரம்பிவிட்டது.\n\nகிடைக்கும் அடுத்த நாட்கள்:\n{dates}\n\nஇதில் ஒரு நாள் உங்களுக்கு வசதியா?",
        sien: "Sorry, *{date}* dawase *{service}* okkoma full.\n\nFree thiyena lagama dates mehema:\n{dates}\n\nMeken dawasak oyata pahasuda?",
    },

    no_dates: {
        en: "I am sorry, *{service}* has no openings around *{date}*, and the next two weeks are fully booked.\n\nPlease call the salon directly and we will try to find a spot for you.",
        si: "සමාවන්න, *{date}* දිනට සහ ඉදිරි සති දෙකටම *{service}* සඳහා වේලාවන් පිරිලා.\n\nකරුණාකර සැලූන් එකට Call එකක් දෙන්න, අපි ඔබට වෙලාවක් හදලා දෙන්න උත්සාහ කරන්නම්.",
        ta: "மன்னிக்கவும், *{date}* மற்றும் அடுத்த இரண்டு வாரங்களுக்கு *{service}* முழுமையாக நிரம்பிவிட்டது.\n\nதயவுசெய்து சலூனை நேரடியாக அழையுங்கள், நாங்கள் நேரம் ஒதுக்க முயற்சிக்கிறோம்.",
        sien: "Sorry, *{date}* saha issaraha sathi dekatama *{service}* full.\n\nSalon ekata call ekak denna, api oyata slot ekak hadala denna try karannam.",
    },

    reject_options: {
        en: "No problem. Would you prefer a different time on *{date}*, or a different day?\n{times}\n\nReply with a number, or tell me another day/service.",
        si: "කිසි ප්‍රශ්නයක් නැහැ. ඔබට *{date}* දින වෙනත් වේලාවක් අවශ්‍යද, නැතිනම් වෙනත් දවසක්ද?\n{times}\n\nඅංකය එවන්න, නැතහොත් වෙනත් දිනයක් හෝ සේවාවක් කියන්න.",
        ta: "பரவாயில்லை. உங்களுக்கு *{date}* அன்று வேறு நேரமா, அல்லது வேறு நாளா?\n{times}\n\nஎண்ணை அனுப்பவும், அல்லது வேறு நாள்/சேவையை குறிப்பிடவும்.",
        sien: "Awlak na. Oyata *{date}* ta wena welawak onada, nathnam wena dawasakda?\n{times}\n\nNumber ekak danna, nathnam wena date ekak hari service ekak hari kiyanna.",
    },

    summary: {
        en: "Almost done! Here are your appointment details:\n\n👤 *Name:* {name}\n💇 *Service:* {service}\n📅 *Date:* {date}\n⏰ *Time:* {time}\n\nReply *Confirm* and I will book it for you.",
        si: "ඔන්න අවසන් පියවර! ඔබේ Booking විස්තර මෙන්න:\n\n👤 *නම:* {name}\n💇 *සේවාව:* {service}\n📅 *දිනය:* {date}\n⏰ *වේලාව:* {time}\n\n*Confirm* කියලා එවන්න, මම මේක Book කරලා දෙන්නම්.",
        ta: "கிட்டத்தட்ட முடிந்தது! உங்கள் முன்பதிவு விபரம்:\n\n👤 *பெயர்:* {name}\n💇 *சேவை:* {service}\n📅 *தேதி:* {date}\n⏰ *நேரம்:* {time}\n\nபதிவு செய்ய *Confirm* எனப் பதிலளிக்கவும்.",
        sien: "Thawa tikai me details harida balanna \n\n👤 *Nama:* {name}\n💇 *Service:* {service}\n📅 *Date:* {date}\n⏰ *Time:* {time}\n\n*Confirm* kiyala reply karanna, mama book karala dennam.",
    },

    booked: {
        en: "🎉 *All done, your appointment is confirmed!*\n\n💇 *Service:* {service}\n📅 *Date:* {date}\n⏰ *Time:* {time}\n\nWe look forward to seeing you at {salon}. Thank you!",
        si: "🎉 *ඔබේ Appointment එක සාර්ථකව වෙන් කරගත්තා!*\n\n💇 *සේවාව:* {service}\n📅 *දිනය:* {date}\n⏰ *වේලාව:* {time}\n\n{salon} වෙතින් ඔබව හමුවනතුරු බලා සිටිමු. ස්තූතියි! ✨",
        ta: "🎉 *உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது!*\n\n💇 *சேவை:* {service}\n📅 *தேதி:* {date}\n⏰ *நேரம்:* {time}\n\n{salon} இல் உங்களைச் சந்திக்க ஆவலுடன் காத்திருக்கிறோம். நன்றி! ✨",
        sien: "🎉 *Oyage appointment eka confirm una!*\n\n💇 *Service:* {service}\n📅 *Date:* {date}\n⏰ *Time:* {time}\n\n{salon} ekata oyawa sadarayen piligannawa. Bohoma sthuthiyi! ✨",
    },

    cancelled: {
        en: "Your appointment has been cancelled.\n\n💇 *Service:* {service}\n📅 *Date:* {date}\n⏰ *Time:* {time}\n\nMessage us anytime if you wish to book again!",
        si: "ඔබගේ Appointment එක අවලංගු කළා.\n\n💇 *සේවාව:* {service}\n📅 *දිනය:* {date}\n⏰ *වේලාව:* {time}\n\nනැවත Booking එකක් දාන්න ඕන නම් ඕනෑම වෙලාවක Message එකක් එවන්න!",
        ta: "உங்கள் முன்பதிவு ரத்து செய்யப்பட்டது.\n\n💇 *சேவை:* {service}\n📅 *தேதி:* {date}\n⏰ *நேரம்:* {time}\n\nமீண்டும் பதிவு செய்ய எப்போது வேண்டுமானாலும் மெசேஜ் அனுப்புங்கள்!",
        sien: "Oyage booking eka cancel kala.\n\n💇 *Service:* {service}\n📅 *Date:* {date}\n⏰ *Time:* {time}\n\nAyeth appointment ekak daaganna ona unama onama welawaka message ekak danna!",
    },

    restarted: {
        en: "No problem, let's start fresh!\n\nHere is what we offer:\n{services}\n\nWhich one would you like to book?",
        si: "කිසි ප්‍රශ්නයක් නෑ, අපි මුල ඉඳන්ම පටන් ගමු!\n\nඅපගේ සේවාවන්:\n{services}\n\nඔබට මොකක්ද කරගන්න ඕන?",
        ta: "பரவாயில்லை, புதிதாகத் தொடங்குவோம்!\n\nஎங்கள் சேவைகள்:\n{services}\n\nஉங்களுக்கு எது வேண்டும்?",
        sien: "Awlak na, api aluthenma patan gamu!\n\nApe services:\n{services}\n\nOyata meken mokakda book karaganna ona?",
    },

    unknown_service: {
        en: "I didn't quite catch that service. Here is what we offer:\n{services}\n\nPlease reply with the service name or number.",
        si: "ඔබ කිව්ව සේවාව හරියටම තේරුණේ නැහැ. අප සතු සේවාවන් මෙන්න:\n{services}\n\nකරුණාකර අදාළ සේවාවේ නම හෝ අංකය එවන්න.",
        ta: "நீங்கள் குறிப்பிட்ட சேவை சரியாகப் புரியவில்லை. எங்கள் சேவைகள்:\n{services}\n\nதயவுசெய்து சேவையின் பெயர் அல்லது எண்ணை அனுப்பவும்.",
        sien: "Oya kiyapu service eka hariyata therune na. Ape services mehema:\n{services}\n\nKarunakara service eke nama hari number eka hari danna.",
    },

    answer_unavailable: {
        en: "That's a good question! Our salon team will confirm that for you when you arrive.",
        si: "හොඳ ප්‍රශ්නයක්! ඔබ සැලූන් එකට පැමිණි විට අපගේ කාර්ය මණ්ඩලය ඒ ගැන ඔබට විස්තර ලබා දෙනු ඇත.",
        ta: "நல்ல கேள்வி! நீங்கள் சலூனுக்கு வரும்போது எங்கள் குழுவினர் இதை உறுதிப்படுத்துவார்கள்.",
        sien: "Hoda prashnayak! Oya salon ekata awama ape staff eken eka confirm karala dei.",
    },

    fallback: {
        en: "Sorry, I didn't understand that clearly.\n\nYou can tell me what service and date you need (e.g., *Facial tomorrow at 3 PM*), or pick an option above.",
        si: "සමාවන්න, මට ඒක පැහැදිලිව තේරුණේ නැහැ.\n\nඔබට අවශ්‍ය සේවාව සහ වෙලාව කෙලින්ම කියන්න පුළුවන් (උදා: *හෙට හවස 3ට Facial*).",
        ta: "மன்னிக்கவும், சரியாகப் புரியவில்லை.\n\nதேவையான சேவையையும் நேரத்தையும் நேரடியாகச் சொல்லலாம் (உதாரணம்: *நாளை மாலை 3 மணிக்கு Facial*).",
        sien: "Sorry, mata eka hariyata therune na.\n\nOyata ona service ekai welawai kiyanna puluwan (eg: *heta hawasa 3ta Facial*).",
    },

    ack_change: {
        en: "Sure, let's take another look.",
        si: "හරි, අපි නැවත බලමු.",
        ta: "சரி, மீண்டும் பார்க்கலாம்.",
        sien: "Hari, api ayeth balamu.",
    },

    ack_service: {
        en: "Certainly, I've updated your service to *{service}*.",
        si: "හරි, මම සේවාව *{service}* විදිහට වෙනස් කළා.",
        ta: "சரி, சேவையை *{service}* என மாற்றிவிட்டேன்.",
        sien: "Hari, mama service eka *{service}* ta change kala.",
    },

    ack_date: {
        en: "Certainly, I've moved your appointment to *{date}*.",
        si: "හරි, මම දිනය *{date}* වලට මාරු කළා.",
        ta: "சரி, தேதியை *{date}* க்கு மாற்றிவிட்டேன்.",
        sien: "Hari, mama date eka *{date}* ta maru kala.",
    },

    ack_time: {
        en: "Certainly, I've updated the time to *{time}*.",
        si: "හරි, මම වෙලාව *{time}* විදිහට දැම්මා.",
        ta: "சரி, நேரத்தை *{time}* என மாற்றிவிட்டேன்.",
        sien: "Hari, mama time eka *{time}* ta maru kala.",
    },

    ack_name: {
        en: "Got it, I've updated the name to *{name}*.",
        si: "හරි, මම නම *{name}* විදිහට සටහන් කරගත්තා.",
        ta: "சரி, பெயரை *{name}* என மாற்றியுள்ளேன்.",
        sien: "Hari, mama nama *{name}* kiyala update kala.",
    },
};
const ACK_KEYS = new Set(["ack_service", "ack_date", "ack_time", "ack_name"]);

function normalizeLang(lang) {
    return LANGUAGES.includes(lang) ? lang : "en";
}

function t(key, lang, params = {}) {
    const entry = TEMPLATES[key];
    if (!entry) return TEMPLATES.fallback.en;

    const template = entry[normalizeLang(lang)] || entry.en;

    const merged = { salon: config.salon.name, ...params };

    const rendered = Object.entries(merged).reduce(
        (text, [name, value]) => text.split("{" + name + "}").join(String(value)),
        template,
    );

    const leftover = rendered.match(/\{[a-zA-Z]+\}/g);
    if (leftover) {
        logger.warn("A template placeholder was never filled", {
            event: "message.placeholder",
            key,
            lang: normalizeLang(lang),
            missing: leftover.join(", "),
        });
    }

    return rendered;
}

function serviceMenu(services) {
    return services.map((s, i) => `${i + 1}. ${s.name} (${s.durationMin} min)`).join("\n");
}

module.exports = { t, normalizeLang, serviceMenu, TEMPLATES, ACK_KEYS };
