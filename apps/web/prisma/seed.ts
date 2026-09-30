/* Deterministic seed: fixed faker seed, Indian names, real state/district names. Run: pnpm db:seed */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient, type Prisma, type TraineeCategory, type ProgrammeStatus, type ApplicationStatus, type JobType } from "@prisma/client";
import { fakerEN_IN as faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { dairy } from "./content-dairy";
import { pacs } from "./content-pacs";
import { shg } from "./content-shg";
import type { CourseSeed, QuestionSeed } from "./content-types";
import { GEO } from "../src/lib/geo";
import { grade, type Question } from "../src/lib/services/grading";
import { evaluateEligibility, formatCertNo } from "../src/lib/services/eligibility";
import { renderCertificatePdf, toSnapshot } from "../src/lib/pdf";
import { putObject, usingBlob } from "../src/lib/storage";

const db = new PrismaClient();
faker.seed(26087);

const NOW = new Date();
const DAY = 86_400_000;
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const DEMO_KIOSK_KEY = "ssd_demo_kiosk_key_vamnicom_2026";

let idn = 0;
const id = (p = "c") => `${p}${(++idn).toString(36).padStart(6, "0")}${faker.string.alphanumeric({ length: 12, casing: "lower" })}`;
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(faker.number.float({ min: 0, max: 0.99999 }) * xs.length)];
const chance = (p: number) => faker.number.float({ min: 0, max: 1 }) < p;
/** IST wall-clock time on a day offset from today. */
function istAt(dayOffset: number, hh: number, mm = 0) {
  const ist = new Date(NOW.getTime() + 5.5 * 3600_000);
  const d = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + dayOffset, hh, mm) - 5.5 * 3600_000;
  return new Date(d);
}

const CATS: TraineeCategory[] = ["COOP_EMPLOYEE", "PACS_MEMBER", "SHG_MEMBER", "DAIRY_COOP", "FARMER", "RURAL_YOUTH"];
const SKILLS: Record<TraineeCategory, string[]> = {
  COOP_EMPLOYEE: ["Accounting", "Tally", "Cooperative law", "MS Excel", "Audit", "Customer service"],
  PACS_MEMBER: ["Crop loans", "KCC processing", "PACS ERP", "Accounting", "Warehousing", "Fertiliser sales"],
  SHG_MEMBER: ["Bookkeeping", "Tailoring", "Food processing", "Digital payments", "Marketing", "Pickle making"],
  DAIRY_COOP: ["Milk testing", "Dairy management", "AMCU operation", "Cattle care", "BMC operation", "Accounting"],
  FARMER: ["Organic farming", "Drip irrigation", "Soil testing", "Tractor operation", "Horticulture", "Seed production"],
  RURAL_YOUTH: ["MS Excel", "Data entry", "Digital payments", "Customer service", "Two-wheeler driving", "Sales"],
};
const EDU = ["Class 8", "Class 10", "Class 12", "Diploma", "Graduate", "Postgraduate"];
const LANGS: Record<string, string[]> = {
  Maharashtra: ["Marathi", "Hindi"], "Uttar Pradesh": ["Hindi"], Bihar: ["Hindi", "Bhojpuri"], "West Bengal": ["Bengali", "Hindi"], Gujarat: ["Gujarati", "Hindi"],
  Rajasthan: ["Hindi", "Rajasthani"], "Madhya Pradesh": ["Hindi"], "Tamil Nadu": ["Tamil", "English"], Karnataka: ["Kannada", "English"], Kerala: ["Malayalam", "English"],
  Odisha: ["Odia", "Hindi"], Punjab: ["Punjabi", "Hindi"], Haryana: ["Hindi"], Assam: ["Assamese", "Hindi"], Telangana: ["Telugu", "Hindi"],
};

const INSTITUTIONS = [
  { code: "VAMN", type: "VAMNICOM", name: "Vaikunth Mehta National Institute of Cooperative Management", state: "Maharashtra", city: "Pune" },
  { code: "RBLR", type: "RICM", name: "Regional Institute of Cooperative Management, Bengaluru", state: "Karnataka", city: "Bengaluru" },
  { code: "RCHD", type: "RICM", name: "Regional Institute of Cooperative Management, Chandigarh", state: "Punjab", city: "Patiala" },
  { code: "RGNR", type: "RICM", name: "Regional Institute of Cooperative Management, Gandhinagar", state: "Gujarat", city: "Ahmedabad" },
  { code: "RKLY", type: "RICM", name: "Regional Institute of Cooperative Management, Kalyani", state: "West Bengal", city: "Nadia" },
  { code: "RPAT", type: "RICM", name: "Regional Institute of Cooperative Management, Patna", state: "Bihar", city: "Patna" },
  { code: "ILKO", type: "ICM", name: "Institute of Cooperative Management, Lucknow", state: "Uttar Pradesh", city: "Lucknow" },
  { code: "IBPL", type: "ICM", name: "Institute of Cooperative Management, Bhopal", state: "Madhya Pradesh", city: "Bhopal" },
  { code: "IJPR", type: "ICM", name: "Institute of Cooperative Management, Jaipur", state: "Rajasthan", city: "Jaipur" },
  { code: "ICHN", type: "ICM", name: "Institute of Cooperative Management, Chennai", state: "Tamil Nadu", city: "Chennai" },
  { code: "IHYD", type: "ICM", name: "Institute of Cooperative Management, Hyderabad", state: "Telangana", city: "Hyderabad" },
  { code: "IBBS", type: "ICM", name: "Institute of Cooperative Management, Bhubaneswar", state: "Odisha", city: "Bhubaneswar" },
  { code: "IGHY", type: "ICM", name: "Institute of Cooperative Management, Guwahati", state: "Assam", city: "Guwahati" },
  { code: "ITVM", type: "ICM", name: "Institute of Cooperative Management, Thiruvananthapuram", state: "Kerala", city: "Thiruvananthapuram" },
  { code: "INGP", type: "ICM", name: "Institute of Cooperative Management, Nagpur", state: "Maharashtra", city: "Nagpur" },
  { code: "IMDU", type: "ICM", name: "Institute of Cooperative Management, Madurai", state: "Tamil Nadu", city: "Madurai" },
  { code: "IDWD", type: "ICM", name: "Institute of Cooperative Management, Dharwad", state: "Karnataka", city: "Dharwad" },
  { code: "IHSR", type: "ICM", name: "Institute of Cooperative Management, Hisar", state: "Haryana", city: "Hisar" },
] as const;

const PROGRAMME_TEMPLATES: { title: string; course: "DAIRY" | "PACS" | "SHG" | null; cats: TraineeCategory[]; short: string }[] = [
  { title: "Dairy Cooperative Management", course: "DAIRY", cats: ["DAIRY_COOP", "FARMER", "COOP_EMPLOYEE"], short: "DCM" },
  { title: "Clean Milk Production and Quality Testing", course: "DAIRY", cats: ["DAIRY_COOP", "RURAL_YOUTH"], short: "CMP" },
  { title: "PACS Computerisation and ERP", course: "PACS", cats: ["PACS_MEMBER", "COOP_EMPLOYEE"], short: "ERP" },
  { title: "Cooperative Credit Management for PACS", course: "PACS", cats: ["PACS_MEMBER", "COOP_EMPLOYEE", "FARMER"], short: "CCM" },
  { title: "SHG Enterprise Development", course: "SHG", cats: ["SHG_MEMBER", "RURAL_YOUTH"], short: "SED" },
  { title: "Financial Literacy for Women Collectives", course: "SHG", cats: ["SHG_MEMBER"], short: "FLW" },
  { title: "Leadership for Cooperative Board Members", course: null, cats: ["COOP_EMPLOYEE", "PACS_MEMBER", "DAIRY_COOP"], short: "LDR" },
  { title: "FPO Business Planning", course: null, cats: ["FARMER", "RURAL_YOUTH"], short: "FPO" },
];

const FAQS: { q: Record<string, string>; a: Record<string, string> }[] = [
  {
    q: { en: "How do I get a certificate?", hi: "मुझे प्रमाणपत्र कैसे मिलेगा?", mr: "मला प्रमाणपत्र कसे मिळेल?" },
    a: {
      en: "Attend at least 75% of sessions and pass the course test (60% or more). Your institute then issues the certificate and it appears in your Wallet.",
      hi: "कम से कम 75% सत्रों में उपस्थित रहें और कोर्स टेस्ट पास करें (60% या अधिक)। फिर संस्थान प्रमाणपत्र जारी करता है और यह आपके वॉलेट में दिखता है।",
      mr: "किमान 75% सत्रांना उपस्थित राहा आणि अभ्यासक्रम चाचणी उत्तीर्ण व्हा (60% किंवा अधिक). मग संस्था प्रमाणपत्र देते आणि ते तुमच्या वॉलेटमध्ये दिसते.",
    },
  },
  {
    q: { en: "How do I apply for a job?", hi: "नौकरी के लिए आवेदन कैसे करूँ?", mr: "नोकरीसाठी अर्ज कसा करू?" },
    a: {
      en: "Open Jobs, look at 'Jobs matching you' and tap Apply. Turn on 'Open to work' in your profile so employers can find you.",
      hi: "नौकरियाँ खोलें, 'आपके लिए नौकरियाँ' देखें और आवेदन पर टैप करें। प्रोफ़ाइल में 'काम के लिए उपलब्ध' चालू करें ताकि नियोक्ता आपको ढूँढ सकें।",
      mr: "नोकऱ्या उघडा, 'तुमच्यासाठी नोकऱ्या' पहा आणि अर्ज करा वर टॅप करा. प्रोफाइलमध्ये 'कामासाठी उपलब्ध' चालू करा म्हणजे नियोक्ते तुम्हाला शोधू शकतील.",
    },
  },
  {
    q: { en: "How do I start a dairy cooperative?", hi: "डेयरी सहकारी समिति कैसे शुरू करें?", mr: "दुग्ध सहकारी संस्था कशी सुरू करावी?" },
    a: {
      en: "Gather milk producers in your village, hold a meeting, and contact the district cooperative office or the nearest dairy union to register a society under your state's cooperative law. The Dairy Cooperative Management course explains each step.",
      hi: "अपने गाँव के दूध उत्पादकों को इकट्ठा करें, बैठक करें, और राज्य के सहकारी कानून के तहत समिति पंजीकृत कराने के लिए ज़िला सहकारी कार्यालय या नज़दीकी दुग्ध संघ से संपर्क करें। डेयरी सहकारी प्रबंधन कोर्स हर कदम समझाता है।",
      mr: "तुमच्या गावातील दूध उत्पादकांना एकत्र करा, बैठक घ्या, आणि राज्याच्या सहकार कायद्याखाली संस्था नोंदवण्यासाठी जिल्हा सहकार कार्यालय किंवा जवळच्या दूध संघाशी संपर्क करा. दुग्ध सहकारी व्यवस्थापन अभ्यासक्रम प्रत्येक पायरी समजावतो.",
    },
  },
  {
    q: { en: "Can I learn without internet?", hi: "क्या मैं बिना इंटरनेट के सीख सकता हूँ?", mr: "मी इंटरनेटशिवाय शिकू शकतो का?" },
    a: {
      en: "Yes. Open a course and tap 'Download for offline'. Lessons and the quiz then work in airplane mode, and your progress syncs when you are back online.",
      hi: "हाँ। कोर्स खोलें और 'ऑफ़लाइन के लिए डाउनलोड' दबाएँ। फिर पाठ और क्विज़ बिना नेटवर्क के चलते हैं, और ऑनलाइन होने पर आपकी प्रगति सिंक हो जाती है।",
      mr: "होय. अभ्यासक्रम उघडा आणि 'ऑफलाइनसाठी डाउनलोड' दाबा. मग धडे आणि प्रश्नमंजुषा नेटवर्कशिवाय चालतात, आणि ऑनलाइन आल्यावर तुमची प्रगती सिंक होते.",
    },
  },
  {
    q: { en: "How do I get a loan or subsidy?", hi: "ऋण या सब्सिडी कैसे मिलेगी?", mr: "कर्ज किंवा अनुदान कसे मिळेल?" },
    a: {
      en: "Sahakar Setu cannot promise loans or subsidies. Please check official sources: your bank branch, the district cooperative office, cooperation.gov.in or nabard.org.",
      hi: "सहकार सेतु ऋण या सब्सिडी का वादा नहीं कर सकता। कृपया आधिकारिक स्रोत देखें: अपनी बैंक शाखा, ज़िला सहकारी कार्यालय, cooperation.gov.in या nabard.org।",
      mr: "सहकार सेतू कर्ज किंवा अनुदानाचे आश्वासन देऊ शकत नाही. कृपया अधिकृत स्रोत पहा: तुमची बँक शाखा, जिल्हा सहकार कार्यालय, cooperation.gov.in किंवा nabard.org.",
    },
  },
  {
    q: { en: "How do I mark attendance?", hi: "हाज़िरी कैसे लगाऊँ?", mr: "हजेरी कशी लावू?" },
    a: {
      en: "Open Scan in the app and point your camera at the QR code on the trainer's screen. You can also show your personal QR to the trainer, or use the face kiosk at the hall door.",
      hi: "ऐप में स्कैन खोलें और कैमरा प्रशिक्षक की स्क्रीन के QR कोड पर रखें। आप अपना निजी QR प्रशिक्षक को दिखा सकते हैं, या हॉल के दरवाज़े पर फ़ेस कियोस्क का उपयोग कर सकते हैं।",
      mr: "ॲपमध्ये स्कॅन उघडा आणि कॅमेरा प्रशिक्षकाच्या स्क्रीनवरील QR कोडवर धरा. तुम्ही तुमचा वैयक्तिक QR प्रशिक्षकाला दाखवू शकता, किंवा हॉलच्या दारावरील फेस कियोस्क वापरू शकता.",
    },
  },
  {
    q: { en: "Which course should I take next?", hi: "मुझे आगे कौन-सा कोर्स करना चाहिए?", mr: "मी पुढे कोणता अभ्यासक्रम करावा?" },
    a: {
      en: "Look at upcoming programmes for your category in the catalogue. Dairy members often continue with Clean Milk Production; PACS staff with PACS Computerisation; SHG members with SHG Enterprise Development.",
      hi: "कैटलॉग में अपनी श्रेणी के आगामी कार्यक्रम देखें। डेयरी सदस्य अक्सर स्वच्छ दुग्ध उत्पादन, PACS कर्मचारी PACS कंप्यूटरीकरण और SHG सदस्य SHG उद्यम विकास करते हैं।",
      mr: "कॅटलॉगमध्ये तुमच्या वर्गासाठी आगामी कार्यक्रम पहा. दुग्ध सदस्य सहसा स्वच्छ दूध उत्पादन, PACS कर्मचारी PACS संगणकीकरण आणि बचत गट सदस्य बचत गट उद्योग विकास करतात.",
    },
  },
  {
    q: { en: "How can an employer check my certificate?", hi: "नियोक्ता मेरा प्रमाणपत्र कैसे जाँचेगा?", mr: "नियोक्ता माझे प्रमाणपत्र कसे तपासेल?" },
    a: {
      en: "Every certificate has a QR code. Anyone can scan it or open the verify page and enter the certificate number to see if it is valid.",
      hi: "हर प्रमाणपत्र पर QR कोड होता है। कोई भी उसे स्कैन करके या सत्यापन पेज पर प्रमाणपत्र संख्या डालकर देख सकता है कि वह मान्य है।",
      mr: "प्रत्येक प्रमाणपत्रावर QR कोड असतो. कोणीही तो स्कॅन करून किंवा पडताळणी पानावर प्रमाणपत्र क्रमांक टाकून ते वैध आहे का ते पाहू शकतो.",
    },
  },
];

function questionsJson(c: CourseSeed): Question[] {
  return c.questions.map((q: QuestionSeed, i) => ({
    id: `q${i + 1}`,
    type: q.type,
    prompt: q.prompt.en,
    options: q.type === "TF" ? [] : q.options.en,
    translations:
      q.type === "TF"
        ? { hi: { prompt: q.prompt.hi }, mr: { prompt: q.prompt.mr } }
        : { hi: { prompt: q.prompt.hi, options: q.options.hi }, mr: { prompt: q.prompt.mr, options: q.options.mr } },
    answer: q.answer,
    marks: 1,
  }));
}

/** Answers that hit roughly `skill` probability of each question being right. */
function simulateAnswers(qs: Question[], skill: number) {
  const out: Record<string, number | number[] | boolean> = {};
  for (const q of qs) {
    const right = chance(skill);
    if (q.type === "TF") out[q.id] = right ? (q.answer as boolean) : !(q.answer as boolean);
    else if (q.type === "MCQ") out[q.id] = right ? (q.answer as number) : ((q.answer as number) + 1 + faker.number.int({ min: 0, max: q.options.length - 2 })) % q.options.length;
    else out[q.id] = right ? (q.answer as number[]) : (q.answer as number[]).slice(0, 1);
  }
  return out;
}

async function reset() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
}

async function main() {
  const t0 = Date.now();
  console.log("Resetting database…");
  await reset();
  const pw = await hash("Sahakar@2026");

  // ---------- Institutions ----------
  const institutions = INSTITUTIONS.map((i) => {
    const [lat, lng] = GEO[i.state]?.[i.city] ?? [20, 78];
    return { id: id("i"), ...i, address: `${faker.location.buildingNumber()}, ${faker.location.street()}, ${i.city}`, lat, lng };
  });
  await db.institution.createMany({ data: institutions.map(({ city, ...i }) => ({ ...i, city })) });
  const vamn = institutions[0];

  // ---------- Staff ----------
  let phoneSeq = 9100000000;
  const users: Prisma.UserCreateManyInput[] = [];
  const superAdmin = { id: id("u"), phone: "9000000001", name: "Anita Deshmukh", role: "SUPER_ADMIN" as const, passwordHash: pw, email: "hq@ncct.example.in" };
  users.push(superAdmin);
  const staff: Record<string, { admin: string; faculty: string[] }> = {};
  for (const inst of institutions) {
    const adminId = id("u");
    const isV = inst.code === "VAMN";
    users.push({ id: adminId, phone: isV ? "9000000002" : String(phoneSeq++), name: isV ? "Rajesh Kulkarni" : `${faker.person.firstName()} ${faker.person.lastName()}`, role: "INSTITUTE_ADMIN", institutionId: inst.id, passwordHash: isV ? pw : null });
    const fac: string[] = [];
    for (let f = 0; f < 3; f++) {
      const fid = id("u");
      const demo = isV && f === 0;
      users.push({ id: fid, phone: demo ? "9000000003" : String(phoneSeq++), name: demo ? "Dr. Meera Iyer" : `${pick(["Dr.", "Prof."])} ${faker.person.firstName()} ${faker.person.lastName()}`, role: "FACULTY", institutionId: inst.id, passwordHash: demo ? pw : null });
      fac.push(fid);
    }
    staff[inst.id] = { admin: adminId, faculty: fac };
  }

  // ---------- Nominators ----------
  const nominators = [
    { id: id("u"), phone: "9000000005", name: "Suresh Patil (Pune District Coop. Union)", role: "NOMINATOR" as const, passwordHash: pw },
    ...Array.from({ length: 4 }, () => ({ id: id("u"), phone: String(phoneSeq++), name: `${faker.person.firstName()} ${faker.person.lastName()} (${pick(["District Registrar Office", "State Coop. Union", "DCCB"])})`, role: "NOMINATOR" as const })),
  ];
  users.push(...nominators);

  // ---------- Employers ----------
  const ORG_PREFIX = ["Krishna Valley", "Sahyadri Hills", "Narmada", "Godavari", "Kaveri Delta", "Ganga Plains", "Brahmaputra", "Thar", "Malabar", "Vindhya", "Deccan", "Satpura", "Aravali", "Konkan", "Mahanadi", "Tapi", "Doaba", "Bundelkhand", "Terai", "Nilgiri", "Chambal", "Sundarban", "Marwar", "Kutch", "Mewar"];
  const ORG_KIND = [
    { suffix: "Dairy Cooperative Ltd", type: "Dairy cooperative" },
    { suffix: "District Central Cooperative Bank", type: "Cooperative bank" },
    { suffix: "Farmer Producer Company", type: "FPO" },
    { suffix: "Agri Inputs Pvt Ltd", type: "Agri company" },
    { suffix: "Multi-State Credit Cooperative", type: "Credit cooperative" },
  ];
  const employers: { id: string; state: string; district: string; orgName: string; orgType: string }[] = [];
  const employerProfiles: Prisma.EmployerProfileCreateManyInput[] = [];
  for (let e = 0; e < 27; e++) {
    const uid = id("u");
    const kind = ORG_KIND[e % ORG_KIND.length];
    const state = e === 0 ? "Maharashtra" : pick(Object.keys(GEO));
    const district = e === 0 ? "Pune" : pick(Object.keys(GEO[state]));
    const orgName = e === 0 ? "Krishna Valley Dairy Cooperative Ltd" : `${ORG_PREFIX[e % ORG_PREFIX.length]} ${kind.suffix}`;
    const pending = e >= 25;
    users.push({ id: uid, phone: e === 0 ? "9000000006" : String(phoneSeq++), name: e === 0 ? "Kavita Joshi" : `${faker.person.firstName()} ${faker.person.lastName()}`, role: "EMPLOYER", status: pending ? "PENDING" : "ACTIVE", passwordHash: e === 0 ? pw : null });
    employerProfiles.push({ userId: uid, orgName, orgType: e === 0 ? "Dairy cooperative" : kind.type, state, district, gstin: null, verifiedAt: pending ? null : new Date(NOW.getTime() - faker.number.int({ min: 30, max: 300 }) * DAY) });
    if (!pending) employers.push({ id: uid, state, district, orgName, orgType: kind.type });
  }

  // ---------- Trainees ----------
  const stateNames = Object.keys(GEO);
  type T = { id: string; name: string; category: TraineeCategory; gender: string; state: string; district: string; skills: string[]; good: boolean };
  const trainees: T[] = [];
  const profiles: Prisma.TraineeProfileCreateManyInput[] = [];
  const mkTrainee = (o: Partial<T> & { phone?: string; openToWork?: boolean; cooperativeName?: string; diet?: string } = {}) => {
    const gender = o.gender ?? (chance(0.52) ? "F" : "M");
    const category = o.category ?? CATS[trainees.length % CATS.length];
    const state = o.state ?? stateNames[trainees.length % stateNames.length];
    const district = o.district ?? pick(Object.keys(GEO[state]));
    const sex = gender === "F" ? "female" : "male";
    const name = o.name ?? `${faker.person.firstName(sex)} ${faker.person.lastName(sex)}`;
    const skills = o.skills ?? faker.helpers.arrayElements(SKILLS[category], { min: 2, max: 4 });
    const t: T = { id: id("u"), name, category, gender, state, district, skills, good: o.good ?? chance(0.93) };
    trainees.push(t);
    users.push({ id: t.id, phone: o.phone ?? String(phoneSeq++), name, role: "TRAINEE", locale: pick(["en", "hi", "hi", "mr"]) });
    const [lat, lng] = GEO[state][district];
    profiles.push({
      userId: t.id,
      category,
      gender,
      dob: new Date(Date.UTC(faker.number.int({ min: 1968, max: 2005 }), faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 }))),
      state,
      district,
      village: faker.location.city(),
      cooperativeName: o.cooperativeName ?? (category === "RURAL_YOUTH" ? null : `${district} ${pick(["Milk Producers", "PACS", "Mahila SHG", "Multipurpose Coop.", "Farmers Coop."])} Society`),
      education: pick(EDU),
      languages: LANGS[state] ?? ["Hindi"],
      skills,
      aadhaarLast4: chance(0.7) ? String(faker.number.int({ min: 1000, max: 9999 })) : null,
      openToWork: o.openToWork ?? chance(0.55),
      diet: o.diet ?? (chance(0.3) ? "NON_VEG" : "VEG"),
      lat,
      lng,
    });
    return t;
  };
  const demoTrainee = mkTrainee({ phone: "9000000004", name: "Sunita Pawar", gender: "F", category: "DAIRY_COOP", state: "Maharashtra", district: "Pune", skills: ["Milk testing", "Dairy management", "AMCU operation", "Accounting"], good: true, openToWork: true, cooperativeName: "Khed Taluka Milk Producers Society", diet: "VEG" });
  const kioskTrainee = mkTrainee({ phone: "9000000007", name: "Ramesh Jadhav", gender: "M", category: "DAIRY_COOP", state: "Maharashtra", district: "Pune", good: true, openToWork: true });
  while (trainees.length < 2000) mkTrainee();

  console.log(`Users: ${users.length}`);
  for (let i = 0; i < users.length; i += 1000) await db.user.createMany({ data: users.slice(i, i + 1000) });
  await db.traineeProfile.createMany({ data: profiles });
  await db.employerProfile.createMany({ data: employerProfiles });

  // ---------- Hostels ----------
  const rooms: { id: string; hostelId: string; beds: number; gender: string; inst: string }[] = [];
  for (const inst of institutions) {
    const big = inst.code === "VAMN" ? 16 : 10;
    for (const [name, gender] of [["Sahyadri Hostel (Men)", "M"], ["Kaveri Hostel (Women)", "F"]] as const) {
      const hid = id("h");
      await db.hostel.create({ data: { id: hid, institutionId: inst.id, name, gender } });
      for (let r = 1; r <= big; r++) rooms.push({ id: id("r"), hostelId: hid, beds: r % 4 === 0 ? 2 : 3, gender, inst: inst.id });
    }
  }
  await db.room.createMany({ data: rooms.map((r) => ({ id: r.id, hostelId: r.hostelId, number: `${r.gender === "M" ? "A" : "B"}-${String(rooms.filter((x) => x.hostelId === r.hostelId && x.id <= r.id).length).padStart(2, "0")}`, beds: r.beds })) });

  // ---------- Courses ----------
  const courseIds: Record<string, string> = {};
  const assessmentIds: Record<string, string> = {};
  const courseQuestions: Record<string, Question[]> = {};
  const courseLessons: Record<string, string[]> = {};
  const vamnFac = staff[vamn.id].faculty[0];
  for (const c of [dairy, pacs, shg]) {
    const cid = id("k");
    courseIds[c.code] = cid;
    await db.course.create({ data: { id: cid, title: c.title, description: c.description, language: "en", ownerId: c.code === "DAIRY" ? vamnFac : staff[institutions[c.code === "PACS" ? 1 : 3].id].faculty[0], published: true } });
    courseLessons[c.code] = [];
    for (const [mi, m] of c.modules.entries()) {
      const mid = id("m");
      await db.module.create({ data: { id: mid, courseId: cid, order: mi + 1, title: m.title.en } });
      for (const [li, l] of m.lessons.entries()) {
        const lid = id("l");
        courseLessons[c.code].push(lid);
        const words = l.body.en.split(/\s+/).length;
        await db.lesson.create({
          data: {
            id: lid,
            moduleId: mid,
            order: li + 1,
            title: l.title.en,
            kind: "TEXT",
            body: l.body.en,
            translations: { hi: { title: l.title.hi, body: l.body.hi }, mr: { title: l.title.mr, body: l.body.mr }, _module: { hi: m.title.hi, mr: m.title.mr } },
            durationMin: Math.max(3, Math.round(words / 40)),
            offlineSizeKb: Math.ceil(Buffer.byteLength(l.body.en + l.body.hi + l.body.mr) / 1024) + 2,
          },
        });
      }
    }
    const qs = questionsJson(c);
    courseQuestions[c.code] = qs;
    const aid = id("a");
    assessmentIds[c.code] = aid;
    await db.assessment.create({ data: { id: aid, courseId: cid, title: `${c.title} — Final test`, timeLimitMin: 20, questions: qs as unknown as Prisma.InputJsonValue } });
  }

  // ---------- Programmes ----------
  type P = { id: string; code: string; title: string; inst: (typeof institutions)[number]; course: "DAIRY" | "PACS" | "SHG" | null; cats: TraineeCategory[]; status: ProgrammeStatus; start: Date; end: Date; capacity: number; coordinator: string; mode: "IN_PERSON" | "ONLINE" | "BLENDED"; demo?: "ongoing" | "upcoming" };
  const programmes: P[] = [];
  const codeCount: Record<string, number> = {};
  const mkCode = (inst: string, short: string, d: Date) => {
    const base = `${inst}-${short}-${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    codeCount[base] = (codeCount[base] ?? 0) + 1;
    return codeCount[base] > 1 ? `${base}-${codeCount[base]}` : base;
  };
  // Demo: ongoing VAMNICOM dairy batch (started 2 days ago) and an upcoming PACS batch open for nominations.
  const demoStart = istAt(-2, 9, 30);
  programmes.push({ id: id("p"), code: "VAMN-DCM-DEMO", title: "Dairy Cooperative Management — Batch 12", inst: vamn, course: "DAIRY", cats: ["DAIRY_COOP", "FARMER", "COOP_EMPLOYEE"], status: "ONGOING", start: demoStart, end: istAt(2, 17, 30), capacity: 40, coordinator: vamnFac, mode: "IN_PERSON", demo: "ongoing" });
  programmes.push({ id: id("p"), code: "VAMN-ERP-DEMO", title: "PACS Computerisation and ERP — Batch 5", inst: vamn, course: "PACS", cats: ["PACS_MEMBER", "COOP_EMPLOYEE"], status: "PUBLISHED", start: istAt(10, 9, 30), end: istAt(14, 17, 30), capacity: 30, coordinator: staff[vamn.id].faculty[1], mode: "IN_PERSON", demo: "upcoming" });
  for (let n = 0; n < 38; n++) {
    const tpl = PROGRAMME_TEMPLATES[n % PROGRAMME_TEMPLATES.length];
    const inst = institutions[(n * 7 + 1) % institutions.length];
    // Spread over 12 months: ~9 months back to ~3 months ahead
    const offsetDays = Math.round(-335 + (n / 37) * 400) + faker.number.int({ min: -5, max: 5 });
    const start = istAt(offsetDays, 9, 30);
    const end = new Date(start.getTime() + 4 * DAY + 8 * 3600_000);
    const status: ProgrammeStatus = end < NOW ? "COMPLETED" : start <= NOW ? "ONGOING" : n % 9 === 0 ? "DRAFT" : "PUBLISHED";
    programmes.push({ id: id("p"), code: mkCode(inst.code, tpl.short, start), title: tpl.title, inst, course: tpl.course, cats: tpl.cats, status, start, end, capacity: faker.number.int({ min: 40, max: 60 }), coordinator: staff[inst.id].faculty[n % 3], mode: n % 5 === 0 ? "BLENDED" : n % 11 === 0 ? "ONLINE" : "IN_PERSON" });
  }
  await db.programme.createMany({
    data: programmes.map((p) => ({
      id: p.id,
      institutionId: p.inst.id,
      code: p.code,
      title: p.title,
      description: `${p.title} is a residential ${p.mode === "ONLINE" ? "online" : "5-day"} programme run by ${p.inst.name} for ${p.cats.map((c) => c.toLowerCase().replace(/_/g, " ")).join(", ")}. Sessions combine classroom learning, field practice and a final test; trainees who attend at least 75% and pass get a verifiable NCCT certificate.`,
      targetCategories: p.cats,
      mode: p.mode,
      status: p.status,
      startDate: p.start,
      endDate: p.end,
      capacity: p.capacity,
      nominationDeadline: new Date(p.start.getTime() - 3 * DAY),
      courseId: p.course ? courseIds[p.course] : null,
      coordinatorId: p.coordinator,
    })),
  });

  // ---------- Sessions ----------
  const SESSION_TITLES = ["Orientation and ice-breaker", "Cooperative principles", "Field visit", "Accounts workshop", "Case studies", "Group project", "Assessment and feedback"];
  const sessions: { id: string; programmeId: string; startsAt: Date; endsAt: Date; facultyId: string }[] = [];
  for (const p of programmes) {
    if (p.status === "DRAFT") continue;
    const fac = staff[p.inst.id].faculty;
    for (let d = 0; d < 5; d++) {
      const dayStart = new Date(p.start.getTime() + d * DAY);
      let startsAt = new Date(dayStart.getTime() + 30 * 60_000); // 10:00 IST
      let endsAt = new Date(startsAt.getTime() + 3 * 3600_000);
      if (p.demo === "ongoing" && d === 2) {
        // Today's demo session is live now for 6 hours so the demo works at any time of day.
        startsAt = new Date(Math.min(NOW.getTime() - 60 * 60_000, istAt(0, 7, 0).getTime()));
        endsAt = new Date(Math.max(NOW.getTime() + 5 * 3600_000, istAt(0, 21, 0).getTime()));
      }
      sessions.push({ id: id("s"), programmeId: p.id, startsAt, endsAt, facultyId: p.demo === "ongoing" ? vamnFac : fac[d % 3] });
    }
  }
  await db.session.createMany({
    data: sessions.map((s, i) => {
      const p = programmes.find((x) => x.id === s.programmeId)!;
      const title = p.demo === "ongoing" ? ["Orientation: the dairy cooperative model", "Milk collection and AMCU practice", "Milk quality testing — practical", "Accounts and payments", "Assessment and valedictory"][i % 5] : SESSION_TITLES[i % SESSION_TITLES.length];
      return { id: s.id, programmeId: s.programmeId, title, facultyId: s.facultyId, room: p.mode === "ONLINE" ? "Online" : `Hall ${String.fromCharCode(65 + (i % 4))}`, startsAt: s.startsAt, endsAt: s.endsAt, qrSecret: randomBytes(24).toString("hex") };
    }),
  });

  // ---------- Nominations, enrollments, attendance, attempts ----------
  const byCat = new Map<TraineeCategory, T[]>();
  for (const t of trainees.slice(2)) byCat.set(t.category, [...(byCat.get(t.category) ?? []), t]);
  const cursor = new Map<TraineeCategory, number>();
  const takeTrainees = (cats: TraineeCategory[], n: number, exclude: Set<string>) => {
    const out: T[] = [];
    let guard = 0;
    while (out.length < n && guard++ < n * 20) {
      const cat = cats[out.length % cats.length];
      const pool = byCat.get(cat)!;
      const i = cursor.get(cat) ?? 0;
      cursor.set(cat, (i + 1) % pool.length);
      const t = pool[i];
      if (!exclude.has(t.id)) {
        exclude.add(t.id);
        out.push(t);
      }
    }
    return out;
  };

  const completed = programmes.filter((p) => p.status === "COMPLETED");
  const perCompleted = Math.ceil(1375 / Math.max(1, completed.length));
  const nominations: Prisma.NominationCreateManyInput[] = [];
  const enrollments: Prisma.EnrollmentCreateManyInput[] = [];
  const attendance: Prisma.AttendanceCreateManyInput[] = [];
  const attempts: Prisma.AttemptCreateManyInput[] = [];
  const allocations: Prisma.RoomAllocationCreateManyInput[] = [];
  const toCertify: { p: P; t: T; issuedAt: Date }[] = [];
  const enrolledBy = new Map<string, T[]>();

  for (const p of programmes) {
    if (p.status === "DRAFT") continue;
    const ex = new Set<string>();
    let enrolled: T[] = [];
    let pendingNoms: T[] = [];
    if (p.status === "COMPLETED") enrolled = takeTrainees(p.cats, Math.min(p.capacity, perCompleted), ex);
    else if (p.status === "ONGOING") {
      enrolled = p.demo ? [demoTrainee, kioskTrainee, ...takeTrainees(p.cats, 24, new Set([demoTrainee.id, kioskTrainee.id]))] : takeTrainees(p.cats, 30, ex);
    } else {
      enrolled = takeTrainees(p.cats, p.demo ? 12 : faker.number.int({ min: 5, max: 20 }), ex);
      pendingNoms = takeTrainees(p.cats, p.demo ? 6 : faker.number.int({ min: 3, max: 12 }), ex);
    }
    enrolledBy.set(p.id, enrolled);
    const nominator = pick(nominators).id;
    for (const t of enrolled) {
      const nid = id("n");
      const created = new Date(p.start.getTime() - faker.number.int({ min: 8, max: 30 }) * DAY);
      nominations.push({ id: nid, programmeId: p.id, traineeId: t.id, nominatedById: chance(0.8) ? nominator : t.id, status: "APPROVED", decidedById: staff[p.inst.id].admin, decidedAt: new Date(created.getTime() + 2 * DAY), createdAt: created });
      enrollments.push({ id: id("e"), programmeId: p.id, traineeId: t.id, nominationId: nid, createdAt: new Date(created.getTime() + 2 * DAY) });
    }
    for (const t of pendingNoms) {
      nominations.push({ id: id("n"), programmeId: p.id, traineeId: t.id, nominatedById: p.demo ? nominators[0].id : nominator, status: chance(0.15) ? "WAITLISTED" : "SUBMITTED", createdAt: new Date(NOW.getTime() - faker.number.int({ min: 1, max: 6 }) * DAY) });
    }

    // Attendance for sessions that have happened
    const ps = sessions.filter((s) => s.programmeId === p.id && s.startsAt <= NOW);
    const isDemo = p.demo === "ongoing";
    for (const s of ps) {
      const isToday = isDemo && s.endsAt > NOW;
      if (isToday) continue; // today's demo session starts empty
      for (const t of enrolled) {
        const present = t.id === demoTrainee.id || t.id === kioskTrainee.id ? true : t.good ? chance(0.96) : chance(0.45);
        if (!present) continue;
        attendance.push({ id: id("t"), sessionId: s.id, traineeId: t.id, method: pick(["QR", "QR", "QR", "FACE", "MANUAL"] as const), markedAt: new Date(s.startsAt.getTime() + faker.number.int({ min: 1, max: 20 }) * 60_000), clientId: crypto.randomUUID(), present: true });
      }
    }
    // Attempts
    if (p.course && (p.status === "COMPLETED" || (isDemo && true))) {
      const qs = courseQuestions[p.course];
      for (const t of enrolled) {
        if (t.id === demoTrainee.id || t.id === kioskTrainee.id) continue; // demo trainees take the test live
        if (isDemo && !chance(0.6)) continue;
        const tries = t.good ? 1 : faker.number.int({ min: 1, max: 2 });
        for (let k = 0; k < tries; k++) {
          const answers = simulateAnswers(qs, t.good ? faker.number.float({ min: 0.66, max: 0.98 }) : faker.number.float({ min: 0.3, max: 0.6 }));
          const g = grade(qs, answers);
          attempts.push({ id: id("x"), assessmentId: assessmentIds[p.course], traineeId: t.id, answers, scorePct: g.scorePct, submittedAt: new Date(Math.min(p.end.getTime() - 2 * 3600_000, NOW.getTime() - 3600_000) - k * 3600_000), clientId: crypto.randomUUID() });
        }
      }
    }
    // Lesson progress for course programmes (sampled)
    // Room allocations for ongoing in-person programmes
    if (p.status === "ONGOING" && p.mode !== "ONLINE") {
      const instRooms = rooms.filter((r) => r.inst === p.inst.id).map((r) => ({ ...r, used: 0 }));
      for (const t of enrolled) {
        const g = profiles.find((x) => x.userId === t.id)!.gender;
        const room = instRooms.find((r) => r.gender === g && r.used < r.beds);
        if (!room) continue;
        room.used++;
        allocations.push({ id: id("o"), roomId: room.id, traineeId: t.id, programmeId: p.id, checkIn: p.start });
      }
    }
  }
  await db.nomination.createMany({ data: nominations });
  await db.enrollment.createMany({ data: enrollments });
  for (let i = 0; i < attendance.length; i += 5000) await db.attendance.createMany({ data: attendance.slice(i, i + 5000) });
  for (let i = 0; i < attempts.length; i += 2000) await db.attempt.createMany({ data: attempts.slice(i, i + 2000) });
  await db.roomAllocation.createMany({ data: allocations });
  console.log(`Nominations ${nominations.length}, enrollments ${enrollments.length}, attendance ${attendance.length}, attempts ${attempts.length}`);

  // Demo trainee: some lesson progress on the demo course so "continue learning" has something to show
  const dairyLessons = courseLessons.DAIRY;
  await db.lessonProgress.createMany({
    data: dairyLessons.slice(0, 7).map((lessonId, i) => ({ lessonId, traineeId: demoTrainee.id, secondsSpent: 240 + i * 30, completedAt: i < 6 ? new Date(NOW.getTime() - (7 - i) * 3600_000) : null })),
  });
  // Bulk progress for completed programmes' trainees
  const lp: Prisma.LessonProgressCreateManyInput[] = [];
  for (const p of programmes.filter((x) => x.course && x.status === "COMPLETED")) {
    const lessons = courseLessons[p.course!];
    for (const t of (enrolledBy.get(p.id) ?? []).slice(0, 30)) {
      const done = t.good ? lessons.length : faker.number.int({ min: 3, max: lessons.length - 1 });
      for (const [i, l] of lessons.entries()) if (i < done) lp.push({ lessonId: l, traineeId: t.id, secondsSpent: faker.number.int({ min: 120, max: 600 }), completedAt: p.end });
    }
  }
  const seenLp = new Set<string>();
  const lpUnique = lp.filter((x) => (seenLp.has(`${x.lessonId}:${x.traineeId}`) ? false : (seenLp.add(`${x.lessonId}:${x.traineeId}`), true)));
  for (let i = 0; i < lpUnique.length; i += 5000) await db.lessonProgress.createMany({ data: lpUnique.slice(i, i + 5000), skipDuplicates: true });

  // ---------- Certificates (eligibility, PDFs) ----------
  const attByTrainee = new Map<string, number>();
  const sessionProg = new Map(sessions.map((s) => [s.id, s.programmeId]));
  for (const a of attendance) {
    const key = `${sessionProg.get(a.sessionId)}:${a.traineeId}`;
    attByTrainee.set(key, (attByTrainee.get(key) ?? 0) + 1);
  }
  const bestScore = new Map<string, number>();
  for (const a of attempts) {
    const key = `${a.assessmentId}:${a.traineeId}`;
    bestScore.set(key, Math.max(bestScore.get(key) ?? 0, a.scorePct));
  }
  for (const p of completed) {
    const total = sessions.filter((s) => s.programmeId === p.id).length;
    for (const t of enrolledBy.get(p.id) ?? []) {
      const e = evaluateEligibility({
        attendedSessions: attByTrainee.get(`${p.id}:${t.id}`) ?? 0,
        totalSessions: total,
        bestScorePct: p.course ? bestScore.get(`${assessmentIds[p.course]}:${t.id}`) ?? null : null,
        minAttendancePct: 75,
        passMarkPct: 60,
        requiresAssessment: !!p.course,
      });
      if (e.eligible) toCertify.push({ p, t, issuedAt: new Date(p.end.getTime() + 2 * DAY) });
    }
  }
  // With Vercel Blob the PDFs are not uploaded (Hobby plans have a small monthly upload quota): each certificate keeps
  // its render snapshot, and downloads rebuild the identical file and check it against the stored SHA-256.
  const storePdfs = !usingBlob();
  console.log(`Generating ${toCertify.length} certificate PDFs${storePdfs ? "" : " (hash + snapshot only; not uploaded to Blob)"}…`);
  const seq: Record<string, number> = {};
  const certRows: Prisma.CertificateCreateManyInput[] = [];
  const jobsQ = toCertify.map((c) => {
    const y = c.issuedAt.getFullYear();
    const k = `cert:${c.p.inst.code}:${y}`;
    seq[k] = (seq[k] ?? 0) + 1;
    return { ...c, certNo: formatCertNo(c.p.inst.code, y, seq[k]) };
  });
  const CONC = 24;
  for (let i = 0; i < jobsQ.length; i += CONC) {
    await Promise.all(
      jobsQ.slice(i, i + CONC).map(async (c) => {
        const input = { certNo: c.certNo, traineeName: c.t.name, programmeTitle: c.p.title, programmeCode: c.p.code, institutionName: c.p.inst.name, startDate: c.p.start, endDate: c.p.end, issuedAt: c.issuedAt, verifyUrl: `${APP_URL}/verify/${c.certNo}` };
        const pdf = await renderCertificatePdf(input);
        const key = `certificates/${c.certNo}.pdf`;
        if (storePdfs) await putObject(key, pdf, "application/pdf");
        certRows.push({ id: id("z"), certNo: c.certNo, traineeId: c.t.id, programmeId: c.p.id, issuedAt: c.issuedAt, pdfUrl: key, sha256: createHash("sha256").update(pdf).digest("hex"), renderInput: toSnapshot(input, null) as unknown as Prisma.InputJsonValue });
      }),
    );
    if (i % 240 === 0) process.stdout.write(`  ${i}/${jobsQ.length}\r`);
  }
  // One revoked certificate for the demo of revocation
  certRows[5] = { ...certRows[5], revokedAt: new Date(NOW.getTime() - 20 * DAY), revokeReason: "Issued in error: attendance record corrected after audit" };
  await db.certificate.createMany({ data: certRows });
  await db.enrollment.updateMany({ where: { programmeId: { in: completed.map((p) => p.id) }, traineeId: { in: certRows.map((c) => c.traineeId) } }, data: { completedAt: NOW } });
  await db.counter.createMany({ data: Object.entries(seq).map(([key, value]) => ({ key, value })) });
  console.log(`Certificates: ${certRows.length}`);

  // ---------- Jobs & applications ----------
  const JOB_TITLES: { title: string; skills: string[]; type: JobType; min: number; max: number; prog?: string }[] = [
    { title: "Milk Quality Supervisor", skills: ["Milk testing", "Dairy management", "AMCU operation"], type: "FULL_TIME", min: 16000, max: 24000, prog: "DCM" },
    { title: "Society Secretary (Dairy)", skills: ["Dairy management", "Accounting"], type: "FULL_TIME", min: 14000, max: 20000, prog: "DCM" },
    { title: "BMC Operator", skills: ["BMC operation", "Milk testing"], type: "FULL_TIME", min: 12000, max: 16000 },
    { title: "PACS Accountant", skills: ["Accounting", "Tally", "PACS ERP"], type: "FULL_TIME", min: 15000, max: 22000, prog: "ERP" },
    { title: "Loan Officer (Agri)", skills: ["Crop loans", "KCC processing", "Customer service"], type: "FULL_TIME", min: 18000, max: 28000, prog: "CCM" },
    { title: "Field Coordinator — FPO", skills: ["Organic farming", "Sales", "Data entry"], type: "CONTRACT", min: 14000, max: 20000 },
    { title: "Data Entry Operator", skills: ["Data entry", "MS Excel"], type: "PART_TIME", min: 8000, max: 12000 },
    { title: "SHG Community Mobiliser", skills: ["Bookkeeping", "Digital payments", "Marketing"], type: "CONTRACT", min: 10000, max: 15000, prog: "SED" },
    { title: "Warehouse Assistant", skills: ["Warehousing", "Data entry"], type: "FULL_TIME", min: 11000, max: 15000 },
    { title: "Agri Input Sales Executive", skills: ["Fertiliser sales", "Sales", "Customer service"], type: "FULL_TIME", min: 13000, max: 20000 },
    { title: "Apprentice — Dairy Plant", skills: ["Cattle care", "BMC operation"], type: "APPRENTICESHIP", min: 7000, max: 9000 },
    { title: "Cooperative Audit Assistant", skills: ["Audit", "Accounting", "MS Excel"], type: "FULL_TIME", min: 16000, max: 25000 },
  ];
  const completedCodes = (short: string) => completed.filter((p) => p.code.includes(`-${short}-`)).map((p) => p.code);
  const jobs: Prisma.JobCreateManyInput[] = [];
  const demoJob = id("j");
  jobs.push({ id: demoJob, employerId: employers[0].id, title: "Milk Quality Supervisor", description: "Supervise milk collection and quality testing across 12 village societies in Khed and Junnar talukas. Train society staff on AMCU use and hygiene. Two-wheeler preferred.", jobType: "FULL_TIME", state: "Maharashtra", district: "Pune", salaryMin: 18000, salaryMax: 26000, requiredSkills: ["Milk testing", "Dairy management", "AMCU operation"], requiredProgrammeCodes: ["VAMN-DCM-DEMO", ...completedCodes("DCM").slice(0, 2)], closesAt: new Date(NOW.getTime() + 30 * DAY), lat: 18.52, lng: 73.86 });
  for (let j = 1; j < 60; j++) {
    const emp = employers[j % employers.length];
    const tpl = JOB_TITLES[j % JOB_TITLES.length];
    const state = chance(0.6) ? emp.state : pick(Object.keys(GEO));
    const district = state === emp.state ? emp.district : pick(Object.keys(GEO[state]));
    const [lat, lng] = GEO[state][district];
    jobs.push({
      id: id("j"),
      employerId: emp.id,
      title: tpl.title,
      description: `${emp.orgName} is hiring a ${tpl.title.toLowerCase()} for its ${district} operations. You will work with cooperative members and staff every day. NCCT-certified candidates preferred; training provided on joining.`,
      jobType: tpl.type,
      state,
      district,
      salaryMin: tpl.min,
      salaryMax: tpl.max,
      requiredSkills: tpl.skills,
      requiredProgrammeCodes: tpl.prog && chance(0.6) ? completedCodes(tpl.prog).slice(0, 2) : [],
      closesAt: new Date(NOW.getTime() + faker.number.int({ min: -20, max: 60 }) * DAY),
      createdAt: new Date(NOW.getTime() - faker.number.int({ min: 1, max: 90 }) * DAY),
      lat,
      lng,
    });
  }
  await db.job.createMany({ data: jobs });
  const certHolders = [...new Set(certRows.filter((c) => !c.revokedAt).map((c) => c.traineeId))];
  const openHolders = certHolders.filter((tid) => profiles.find((p) => p.userId === tid)?.openToWork);
  const STAGES: ApplicationStatus[] = [...Array(120).fill("APPLIED"), ...Array(60).fill("SHORTLISTED"), ...Array(40).fill("INTERVIEW"), ...Array(20).fill("OFFERED"), ...Array(40).fill("HIRED"), ...Array(20).fill("REJECTED")];
  const applications: Prisma.ApplicationCreateManyInput[] = [];
  const seenApp = new Set<string>();
  let a = 0;
  while (applications.length < 300 && a < 5000) {
    const job = jobs[1 + (a % (jobs.length - 1))];
    const tid = openHolders[(a * 7) % openHolders.length];
    a++;
    if (!tid || seenApp.has(`${job.id}:${tid}`)) continue;
    seenApp.add(`${job.id}:${tid}`);
    applications.push({ id: id("y"), jobId: job.id!, traineeId: tid, status: STAGES[applications.length], coverNote: chance(0.4) ? "I have completed NCCT training and live nearby. I can join immediately." : null, createdAt: new Date(NOW.getTime() - faker.number.int({ min: 1, max: 60 }) * DAY) });
  }
  await db.application.createMany({ data: applications });
  console.log(`Jobs ${jobs.length}, applications ${applications.length}`);

  // ---------- Logistics for demo programmes ----------
  for (const p of programmes.filter((x) => x.demo)) {
    await db.logisticsItem.createMany({
      data: [
        { programmeId: p.id, kind: "TRAVEL", details: { items: [{ label: "Pick-up from Pune railway station", done: p.demo === "ongoing" }, { label: "Travel reimbursement forms", done: false }] } },
        { programmeId: p.id, kind: "MEALS", details: { items: [{ label: "Breakfast, lunch and dinner arranged with mess", done: p.demo === "ongoing" }, { label: "Tea breaks (2 per day)", done: true }] } },
        { programmeId: p.id, kind: "KITS", details: { items: [{ label: "Training kit: bag, notebook, pen", done: p.demo === "ongoing" }, { label: "Printed course handbook", done: false }, { label: "ID cards with personal QR", done: p.demo === "ongoing" }] } },
      ],
    });
  }

  // ---------- Content chunks for the chatbot ----------
  const chunks: { sourceType: string; sourceId: string; text: string }[] = [];
  for (const c of [dairy, pacs, shg]) {
    chunks.push({ sourceType: "COURSE", sourceId: courseIds[c.code], text: `Course: ${c.title}. ${c.description} Modules: ${c.modules.map((m) => m.title.en).join(", ")}.` });
    for (const m of c.modules) for (const l of m.lessons) {
      chunks.push({ sourceType: "LESSON", sourceId: courseIds[c.code], text: `${c.title} — ${l.title.en}: ${l.body.en.replace(/\n+/g, " ")}` });
      chunks.push({ sourceType: "LESSON", sourceId: courseIds[c.code], text: `${l.title.hi}: ${l.body.hi.replace(/\n+/g, " ")}` });
    }
  }
  for (const p of programmes.filter((x) => x.status === "PUBLISHED")) chunks.push({ sourceType: "PROGRAMME", sourceId: p.id, text: `Programme: ${p.title} (${p.code}) at ${p.inst.name}, ${p.inst.city}. Starts ${p.start.toDateString()}. For ${p.cats.join(", ")}.` });
  for (const j of jobs) chunks.push({ sourceType: "JOB", sourceId: j.id!, text: `Job: ${j.title} in ${j.district}, ${j.state}. Skills: ${(j.requiredSkills as string[]).join(", ")}. Salary ₹${j.salaryMin}–₹${j.salaryMax} per month.` });
  FAQS.forEach((f, i) => {
    for (const loc of ["en", "hi", "mr"]) chunks.push({ sourceType: "FAQ", sourceId: `faq${i + 1}:${loc}`, text: `Q: ${f.q[loc]}\nA: ${f.a[loc]}` });
  });
  await db.contentChunk.createMany({ data: chunks });

  // ---------- Devices ----------
  await db.device.create({ data: { institutionId: vamn.id, name: "Hall A door kiosk", kind: "KIOSK", apiKeyHash: createHash("sha256").update(DEMO_KIOSK_KEY).digest("hex"), lastSeenAt: new Date(NOW.getTime() - 40_000) } });
  await db.device.create({ data: { institutionId: vamn.id, name: "Khed PACS learning hub", kind: "HUB", apiKeyHash: createHash("sha256").update(randomBytes(16)).digest("hex"), lastSeenAt: new Date(NOW.getTime() - 3 * DAY) } });

  // ---------- Notifications & audit ----------
  await db.notification.createMany({
    data: [
      { userId: demoTrainee.id, channel: "APP", title: "Welcome to Batch 12", body: "Your hostel room is allocated. Today's session: Milk quality testing — practical." },
      { userId: employers[0].id, channel: "APP", title: "New candidates", body: "3 certified candidates near Pune match your Milk Quality Supervisor job." },
    ],
  });
  await db.auditLog.create({ data: { actorId: superAdmin.id, action: "seed.run", entity: "System", entityId: "seed", diff: { at: NOW.toISOString(), trainees: trainees.length, certificates: certRows.length } } });

  console.log(`Seed finished in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log("Demo logins (OTP 123456): 9000000001 SA · 9000000002 IA · 9000000003 FA · 9000000004 TR · 9000000005 NO · 9000000006 EM");
  console.log(`Demo kiosk key: ${DEMO_KIOSK_KEY}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
