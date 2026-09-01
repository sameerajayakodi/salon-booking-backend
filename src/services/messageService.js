const { LANGUAGES } = require("../constants/booking");

const TEMPLATES = {
    greeting: {
        en: "Hello and welcome to {salon}.\n\nHere is what we offer:\n{services}\n\nWhich one can I book for you?",
        si: "ආයුබෝවන්, {salon} වෙත සාදරයෙන් පිළිගනිමු.\n\nඅපගේ සේවාවන්:\n{services}\n\nඔබට කුමන සේවාව වෙන් කර දෙන්නද?",
        ta: "வணக்கம், {salon} உங்களை வரவேற்கிறது.\n\nஎங்கள் சேவைகள்:\n{services}\n\nஉங்களுக்கு எந்த சேவையைப் பதிவு செய்யட்டும்?",
        sien: "Ayubowan, {salon} ta welcome.\n\nApe services:\n{services}\n\nMokak ekakda book karanna one?",
    },

    services_info: {
        en: "Of course, here is what we offer:\n{services}\n\nI have kept your place, so just carry on where we left off, or name a different service if you would rather change.",
        si: "නිසැකවම, අපගේ සේවාවන්:\n{services}\n\nඔබේ තැන රඳවා තිබේ, එබැවින් අප නැවැත්වූ තැනින් ඉදිරියට යන්න, නැතිනම් වෙනස් සේවාවක් කියන්න.",
        ta: "நிச்சயமாக, எங்கள் சேவைகள்:\n{services}\n\nஉங்கள் இடத்தை வைத்திருக்கிறேன், நிறுத்திய இடத்திலிருந்து தொடருங்கள், அல்லது வேறு சேவை வேண்டுமானால் சொல்லுங்கள்.",
        sien: "Hari, ape services:\n{services}\n\nOyage thena hoyala thiyenawa, ehenam nawaththapu thanin idiriyata yanna, nathnam wenas service ekak kiyanna.",
    },

    services_info_held: {
        en: "Of course. Here is what we offer:\n{services}\n\nYour appointment is still held. Reply Confirm to book it, or tell me a different service if you would rather change.",
        si: "නිසැකවම. අපගේ සේවාවන්:\n{services}\n\nඔබේ වේලාව තවම රඳවා තිබේ. වෙන් කිරීමට Confirm කියන්න, නැතිනම් වෙනස් සේවාවක් කියන්න.",
        ta: "நிச்சயமாக. எங்கள் சேவைகள்:\n{services}\n\nஉங்கள் நேரம் இன்னும் வைத்திருக்கிறோம். பதிவு செய்ய Confirm எனச் சொல்லுங்கள், அல்லது வேறு சேவை வேண்டுமானால் சொல்லுங்கள்.",
        sien: "Hari. Ape services:\n{services}\n\nOyage booking eka thawama hold karala thiyenawa. Book karanna Confirm kiyanna, nathnam wenas service ekak kiyanna.",
    },

    greeting_back: {
        en: "Hello again.",
        si: "ආයුබෝවන් නැවතත්.",
        ta: "மீண்டும் வணக்கம்.",
        sien: "Ayubowan aye.",
    },

    kb_answer: {
        en: "{answer}",
        si: "{answer}",
        ta: "{answer}",
        sien: "{answer}",
    },

    date_too_far: {
        en: "{date} is further ahead than we can book right now. We take appointments up to {days} days in advance, so please pick a nearer day and I will show you what is open.",
        si: "{date} අපට දැන් වෙන් කළ හැකි කාලයට වඩා ඉදිරියෙන් ය. අපි දින {days}ක් දක්වා වෙන් කිරීම් ගනිමු. කරුණාකර ළඟ දිනයක් තෝරන්න.",
        ta: "{date} நாங்கள் இப்போது பதிவு செய்யக்கூடிய காலத்திற்கு அப்பால் உள்ளது. {days} நாட்கள் வரை மட்டுமே பதிவு செய்கிறோம். தயவுசெய்து அருகிலுள்ள நாளைத் தேர்வுசெய்யுங்கள்.",
        sien: "{date} kiyanne api dan book karanna puluwan kaalayata wada issarahata. Api dawas {days}k wenakan book karanawa. Karunakara laga dawasak thoranna.",
    },

    ask_service: {
        en: "Of course. Here is what we offer:\n{services}\n\nWhich one would you like?",
        si: "නිසැකවම. අපගේ සේවාවන් මෙන්න:\n{services}\n\nඔබට අවශ්‍ය කුමක්ද?",
        ta: "நிச்சயமாக. எங்கள் சேவைகள்:\n{services}\n\nஉங்களுக்கு எது வேண்டும்?",
        sien: "Hari. Ape services mehema:\n{services}\n\nMokakda one?",
    },

    ask_date: {
        en: "Lovely choice. Which day suits you best?\n{dates}\n\nJust reply with a number, or tell me a day like tomorrow or 23/09.",
        si: "හොඳ තේරීමක්. ඔබට කුමන දිනය සුදුසුද?\n{dates}\n\nඅංකයක් එවන්න, නැතිනම් හෙට හෝ 23/09 වැනි දිනයක් කියන්න.",
        ta: "நல்ல தேர்வு. உங்களுக்கு எந்த நாள் வசதி?\n{dates}\n\nஎண் ஒன்றை அனுப்புங்கள், அல்லது நாளை அல்லது 23/09 எனச் சொல்லுங்கள்.",
        sien: "Hoda choice ekak. Mona dawasada oyata hari?\n{dates}\n\nNumber ekak danna, nathnam heta wagey dawasak kiyanna.",
    },

    ask_date_open: {
        en: "Lovely choice. Which day would suit you?",
        si: "හොඳ තේරීමක්. ඔබට කුමන දිනය සුදුසුද?",
        ta: "நல்ல தேர்வு. எந்த நாள் உங்களுக்கு வசதி?",
        sien: "Hoda choice ekak. Mona dawasada oyata hari?",
    },

    ask_time: {
        en: "Here is what is open on {date}:\n{times}\n\nWhich time works for you? A number is fine.",
        si: "{date} දින විවෘතව ඇති වේලාවන්:\n{times}\n\nඔබට කුමන වේලාව සුදුසුද? අංකයක් එවුවත් හරි.",
        ta: "{date} அன்று கிடைக்கும் நேரங்கள்:\n{times}\n\nஉங்களுக்கு எந்த நேரம் வசதி? எண் அனுப்பினாலும் சரி.",
        sien: "{date} ta open thiyena times:\n{times}\n\nMona welawada oyata hari? Number ekak danna puluwan.",
    },

    only_time: {
        en: "There is just one slot left on {date}, at {time}.\n\nShall I hold it for you? Reply ok and it is yours.",
        si: "{date} දින ඉතිරිව ඇත්තේ එක් වේලාවක් පමණයි, {time}ට.\n\nඑය ඔබට වෙන් කරන්නද? හරි කියා පිළිතුරු දෙන්න.",
        ta: "{date} அன்று ஒரே ஒரு நேரம் மட்டுமே மீதம், {time}.\n\nஅதை உங்களுக்கு வைக்கவா? சரி என பதிலளியுங்கள்.",
        sien: "{date} ta ithiri wela thiyenne {time} witharai.\n\nEka oyata hoyala dennada? Hari kiyala reply karanna.",
    },

    slot_taken: {
        en: "Sorry, {time} has just been taken.\n\nThese are still open:\n{times}\n\nWould one of these suit you?",
        si: "සමාවන්න, {time} දැන් වෙන් වී ඇත.\n\nතවම විවෘතව ඇති වේලාවන්:\n{times}\n\nමේවායින් එකක් සුදුසුද?",
        ta: "மன்னிக்கவும், {time} இப்போது பதிவாகிவிட்டது.\n\nஇன்னும் கிடைக்கும் நேரங்கள்:\n{times}\n\nஇவற்றில் ஒன்று வசதியாக இருக்குமா?",
        sien: "Sorry, {time} dan aran gihin.\n\nThawama open thiyena times:\n{times}\n\nMeken ekak hariyanawada?",
    },

    ask_name: {
        en: "Perfect. And may I have your name for the booking?",
        si: "නියමයි. වෙන් කිරීම සඳහා ඔබේ නම කියන්න පුළුවන්ද?",
        ta: "அருமை. பதிவுக்காக உங்கள் பெயரைச் சொல்ல முடியுமா?",
        sien: "Niyamai. Booking ekata oyage nama kiyanna puluwanda?",
    },

    no_slots: {
        en: "I am sorry, {service} is fully booked on {date}.\n\nThese days are still open:\n{dates}\n\nWould any of these suit you?",
        si: "සමාවන්න, {date} දින {service} සම්පූර්ණයෙන්ම වෙන් වී ඇත.\n\nතවම විවෘතව ඇති දින:\n{dates}\n\nමේවායින් එකක් සුදුසුද?",
        ta: "மன்னிக்கவும், {date} அன்று {service} முழுவதும் பதிவாகிவிட்டது.\n\nஇன்னும் கிடைக்கும் நாட்கள்:\n{dates}\n\nஇவற்றில் ஒன்று வசதியா?",
        sien: "Sorry, {date} ta {service} full wela.\n\nThawama open thiyena dates:\n{dates}\n\nMeken ekak hariyanawada?",
    },

    no_dates: {
        en: "I am sorry, {service} has nothing open on {date}, and the next two weeks are full as well.\n\nPlease give the salon a call and we will find a time for you.",
        si: "සමාවන්න, {date} දින {service} සඳහා වේලාවන් නොමැති අතර ඉදිරි සති දෙකද පිරී ඇත.\n\nකරුණාකර සැලූන් අමතන්න, අපි ඔබට වේලාවක් සොයා දෙන්නම්.",
        ta: "மன்னிக்கவும், {date} அன்று {service} கிடைக்கவில்லை, அடுத்த இரு வாரங்களும் நிரம்பிவிட்டன.\n\nதயவுசெய்து சலூனை அழையுங்கள், நாங்கள் நேரம் ஒதுக்குகிறோம்.",
        sien: "Sorry, {date} ta {service} na, idiri sathi dekath full.\n\nSalon ekata call ekak denna, api welawak hoyala denawa.",
    },

    reject_options: {
        en: "No problem at all. Would you like a different time on {date}, or a different day?\n{times}\n\nReply with a number for one of these times, or just tell me another day or service.",
        si: "කිසිම කමක් නැහැ. {date} දින වෙනත් වේලාවක්ද, නැතිනම් වෙනත් දිනයක්ද?\n{times}\n\nවේලාවක් සඳහා අංකයක් එවන්න, නැතිනම් වෙනත් දිනයක් හෝ සේවාවක් කියන්න.",
        ta: "பரவாயில்லை. {date} அன்று வேறு நேரமா, அல்லது வேறு நாளா?\n{times}\n\nநேரத்திற்கு எண் ஒன்றை அனுப்புங்கள், அல்லது வேறு நாள் அல்லது சேவையைச் சொல்லுங்கள்.",
        sien: "Kamak na. {date} ta wenas welawakda, nathnam wenas dawasakda?\n{times}\n\nWelawakata number ekak danna, nathnam wenas dawasak hari service ekak hari kiyanna.",
    },

    summary: {
        en: "Almost done. Here is your appointment:\n\nName: {name}\nService: {service}\nDate: {date}\nTime: {time}\n\nReply Confirm and I will book it for you.",
        si: "අවසන් පියවර. ඔබේ වේලාව මෙන්න:\n\nනම: {name}\nසේවාව: {service}\nදිනය: {date}\nවේලාව: {time}\n\nConfirm කියා පිළිතුරු දෙන්න, මම එය වෙන් කරන්නම්.",
        ta: "கிட்டத்தட்ட முடிந்தது. உங்கள் நேரம்:\n\nபெயர்: {name}\nசேவை: {service}\nதேதி: {date}\nநேரம்: {time}\n\nConfirm என பதிலளியுங்கள், நான் பதிவு செய்கிறேன்.",
        sien: "Tikak thawa. Oyage booking eka mehema:\n\nNama: {name}\nService: {service}\nDate: {date}\nTime: {time}\n\nConfirm kiyala reply karanna, mama book karannam.",
    },

    booked: {
        en: "All done, your appointment is confirmed.\n\nService: {service}\nDate: {date}\nTime: {time}\n\nWe look forward to seeing you. Thank you.",
        si: "සියල්ල සම්පූර්ණයි, ඔබේ වේලාව තහවුරු කර ඇත.\n\nසේවාව: {service}\nදිනය: {date}\nවේලාව: {time}\n\nඔබව හමුවීමට බලා සිටිමු. ස්තූතියි.",
        ta: "முடிந்தது, உங்கள் நேரம் உறுதி செய்யப்பட்டது.\n\nசேவை: {service}\nதேதி: {date}\nநேரம்: {time}\n\nஉங்களைச் சந்திக்க ஆவலுடன் உள்ளோம். நன்றி.",
        sien: "Ehenam hari, oyage booking eka confirm wela.\n\nService: {service}\nDate: {date}\nTime: {time}\n\nOyawa hamu wenna balagena innawa. Istuti.",
    },

    cancelled: {
        en: "Your appointment has been cancelled.\n\nService: {service}\nDate: {date}\nTime: {time}\n\nDo message us any time and we will find you another slot.",
        si: "ඔබේ වේලාව අවලංගු කර ඇත.\n\nසේවාව: {service}\nදිනය: {date}\nවේලාව: {time}\n\nඕනෑම වේලාවක අපට පණිවිඩයක් එවන්න, අපි වෙනත් වේලාවක් සොයා දෙන්නම්.",
        ta: "உங்கள் நேரம் ரத்து செய்யப்பட்டது.\n\nசேவை: {service}\nதேதி: {date}\nநேரம்: {time}\n\nஎப்போது வேண்டுமானாலும் செய்தி அனுப்புங்கள், வேறு நேரம் ஒதுக்குகிறோம்.",
        sien: "Oyage booking eka cancel wela.\n\nService: {service}\nDate: {date}\nTime: {time}\n\nOnama welawaka message ekak danna, api thawa welawak hoyala denawa.",
    },

    restarted: {
        en: "No problem at all, let us start fresh.\n\nHere is what we offer:\n{services}\n\nWhich one would you like?",
        si: "කිසිම කමක් නැහැ, අලුතින් පටන් ගනිමු.\n\nඅපගේ සේවාවන්:\n{services}\n\nඔබට අවශ්‍ය කුමක්ද?",
        ta: "பரவாயில்லை, மீண்டும் தொடங்குவோம்.\n\nஎங்கள் சேவைகள்:\n{services}\n\nஉங்களுக்கு எது வேண்டும்?",
        sien: "Kamak na, aye aluthen patan gamu.\n\nApe services:\n{services}\n\nMokakda one?",
    },

    unknown_service: {
        en: "I am not quite sure which service you mean.\n\nHere is what we offer:\n{services}\n\nWhich one would you like?",
        si: "ඔබ අදහස් කරන සේවාව මට හරියටම තේරුණේ නැහැ.\n\nඅපගේ සේවාවන්:\n{services}\n\nඔබට අවශ්‍ය කුමක්ද?",
        ta: "நீங்கள் குறிப்பிடும் சேவை எனக்குச் சரியாகப் புரியவில்லை.\n\nஎங்கள் சேவைகள்:\n{services}\n\nஉங்களுக்கு எது வேண்டும்?",
        sien: "Oya kiyana service eka mata hariyata therune na.\n\nApe services:\n{services}\n\nMokakda one?",
    },

    answer_unavailable: {
        en: "That is a good question. The salon can confirm that for you when you arrive.",
        si: "හොඳ ප්‍රශ්නයක්. ඔබ පැමිණි විට සැලූන් එය තහවුරු කර දෙනු ඇත.",
        ta: "நல்ல கேள்வி. நீங்கள் வரும்போது சலூன் அதை உறுதிப்படுத்தும்.",
        sien: "Hoda prashnayak. Oya awoth salon eken eka confirm karala denawa.",
    },

    fallback: {
        en: "Sorry, I did not quite catch that.\n\nYou can tell me the service and when you would like to come, for example: Facial tomorrow at 3 PM.",
        si: "සමාවන්න, එය මට හරියටම තේරුණේ නැහැ.\n\nඔබට අවශ්‍ය සේවාව සහ වේලාව කියන්න පුළුවන්. උදාහරණයක්: හෙට හවස 3ට Facial.",
        ta: "மன்னிக்கவும், அது சரியாகப் புரியவில்லை.\n\nசேவையையும் நேரத்தையும் சொல்லலாம். உதாரணம்: நாளை மாலை 3 மணிக்கு Facial.",
        sien: "Sorry, eka mata hariyata therune na.\n\nService ekai welawai kiyanna puluwan. Udaharanayak: heta hawasa 3 ta Facial.",
    },

    ack_change: {
        en: "Of course, let us look again.",
        si: "හරි, අපි රැබිතත් බලමු.",
        ta: "கட்டாயமாக, மீண்டும் பார்க்கலாம்.",
        sien: "Hari, apita ayeth balamu.",
    },

    ack_service: {
        en: "Certainly, I have changed that to {service}.",
        si: "හරි, මම එය {service} ලෙස වෙනස් කළා.",
        ta: "சரி, அதை {service} ஆக மாற்றிவிட்டேன்.",
        sien: "Hari, mama eka {service} ta change kala.",
    },

    ack_date: {
        en: "Certainly, I have moved that to {date}.",
        si: "හරි, මම එය {date} දිනට වෙනස් කළා.",
        ta: "சரி, அதை {date} க்கு மாற்றிவிட்டேன்.",
        sien: "Hari, mama eka {date} ta maru kala.",
    },

    ack_time: {
        en: "Certainly, I have changed the time to {time}.",
        si: "හරි, මම වේලාව {time} ලෙස වෙනස් කළා.",
        ta: "சரி, நேரத்தை {time} ஆக மாற்றிவிட்டேன்.",
        sien: "Hari, mama welawa {time} ta change kala.",
    },

    ack_name: {
        en: "Certainly, I have changed the name to {name}.",
        si: "හරි, මම නම {name} ලෙස වෙනස් කළා.",
        ta: "சரி, பெயரை {name} ஆக மாற்றிவிட்டேன்.",
        sien: "Hari, mama nama {name} ta change kala.",
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

    return Object.entries(params).reduce(
        (text, [name, value]) => text.split("{" + name + "}").join(String(value)),
        template,
    );
}

function serviceMenu(services) {
    return services.map((s, i) => `${i + 1}. ${s.name} (${s.durationMin} min)`).join("\n");
}

module.exports = { t, normalizeLang, serviceMenu, TEMPLATES, ACK_KEYS };
