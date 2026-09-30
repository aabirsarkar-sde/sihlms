import type { CourseSeed } from "./content-types";

export const shg: CourseSeed = {
  code: "SHG",
  title: "SHG Enterprise and Financial Literacy",
  description: "For self-help group members and rural youth: saving, bank linkage, safe digital payments and starting a small business together.",
  modules: [
    {
      title: { en: "SHG Basics", hi: "SHG की मूल बातें", mr: "बचत गटाची मूलतत्त्वे" },
      lessons: [
        {
          title: { en: "How a self-help group works", hi: "स्वयं सहायता समूह कैसे काम करता है", mr: "बचत गट कसा काम करतो" },
          body: {
            en: "A self-help group (SHG) is 10–20 people, usually women from similar backgrounds, who save small amounts regularly and lend to each other.\n\n- Everyone saves the same amount each week or month.\n- The group decides together who gets a loan.\n- Interest earned stays in the group.\n\nThe group becomes a source of credit, confidence and support.",
            hi: "स्वयं सहायता समूह (SHG) 10–20 लोगों का समूह होता है, आमतौर पर समान पृष्ठभूमि की महिलाएँ, जो नियमित रूप से थोड़ी बचत करती हैं और एक-दूसरे को उधार देती हैं।\n\n- सब हर हफ़्ते या महीने बराबर राशि बचाते हैं।\n- समूह मिलकर तय करता है कि ऋण किसे मिलेगा।\n- कमाया गया ब्याज समूह में ही रहता है।\n\nसमूह ऋण, आत्मविश्वास और सहारे का स्रोत बन जाता है।",
            mr: "बचत गट (SHG) म्हणजे 10–20 लोकांचा गट, साधारणपणे सारख्या पार्श्वभूमीच्या महिला, ज्या नियमितपणे थोडी बचत करतात आणि एकमेकींना कर्ज देतात.\n\n- सर्वजण दर आठवड्याला किंवा महिन्याला समान रक्कम बचत करतात.\n- कर्ज कोणाला द्यायचे हे गट मिळून ठरवतो.\n- मिळालेले व्याज गटातच राहते.\n\nगट कर्ज, आत्मविश्वास आणि आधाराचा स्रोत बनतो.",
          },
        },
        {
          title: { en: "The Panchasutra — five rules", hi: "पंचसूत्र — पाँच नियम", mr: "पंचसूत्री — पाच नियम" },
          body: {
            en: "Strong SHGs follow five simple rules, called the Panchasutra.\n\n- Regular meetings.\n- Regular savings.\n- Regular internal lending.\n- Timely repayment.\n- Up-to-date books of accounts.\n\nBanks look at these five rules when deciding to lend to a group.",
            hi: "मज़बूत SHG पाँच सरल नियमों का पालन करते हैं, जिन्हें पंचसूत्र कहते हैं।\n\n- नियमित बैठकें।\n- नियमित बचत।\n- नियमित आंतरिक ऋण।\n- समय पर चुकौती।\n- अद्यतन खाता-बही।\n\nबैंक समूह को ऋण देने से पहले इन्हीं पाँच नियमों को देखते हैं।",
            mr: "मजबूत बचत गट पंचसूत्री नावाचे पाच सोपे नियम पाळतात.\n\n- नियमित बैठका.\n- नियमित बचत.\n- नियमित अंतर्गत कर्जवाटप.\n- वेळेवर परतफेड.\n- अद्ययावत हिशोब वह्या.\n\nगटाला कर्ज देताना बँका हेच पाच नियम पाहतात.",
          },
        },
        {
          title: { en: "Meetings and records", hi: "बैठकें और रिकॉर्ड", mr: "बैठका आणि नोंदी" },
          body: {
            en: "Every meeting should be written down.\n\n- Attendance register.\n- Savings and loan ledger for each member.\n- Minutes book with decisions.\n\nRotate the leader and bookkeeper roles so that everyone learns.",
            hi: "हर बैठक लिखित में दर्ज होनी चाहिए।\n\n- हाज़िरी रजिस्टर।\n- हर सदस्य की बचत और ऋण बही।\n- निर्णयों के साथ कार्यवाही पुस्तिका।\n\nनेता और लेखाकार की भूमिका बारी-बारी से बदलें ताकि सब सीखें।",
            mr: "प्रत्येक बैठकीची लेखी नोंद झाली पाहिजे.\n\n- हजेरी रजिस्टर.\n- प्रत्येक सदस्याची बचत आणि कर्ज खातेवही.\n- निर्णयांसह इतिवृत्त वही.\n\nसर्वांनी शिकावे म्हणून प्रमुख आणि हिशोबनीसाची जबाबदारी आळीपाळीने बदला.",
          },
        },
      ],
    },
    {
      title: { en: "Money Matters", hi: "पैसे की बातें", mr: "पैशाच्या गोष्टी" },
      lessons: [
        {
          title: { en: "Saving and budgeting", hi: "बचत और बजट", mr: "बचत आणि अंदाजपत्रक" },
          body: {
            en: "A budget is a plan for your money.\n\n- Write down all income for the month.\n- List needs first: food, school, health, loan repayment.\n- Save a fixed amount before spending on wants.\n\nEven ₹10 a day becomes over ₹3,600 in a year.",
            hi: "बजट आपके पैसे की योजना है।\n\n- महीने की सारी आमदनी लिखें।\n- पहले ज़रूरतें लिखें: भोजन, स्कूल, स्वास्थ्य, ऋण चुकौती।\n- इच्छाओं पर खर्च से पहले एक तय राशि बचाएँ।\n\nरोज़ ₹10 भी साल में ₹3,600 से ज़्यादा हो जाते हैं।",
            mr: "अंदाजपत्रक म्हणजे तुमच्या पैशाची योजना.\n\n- महिन्याचे सर्व उत्पन्न लिहा.\n- आधी गरजा लिहा: अन्न, शाळा, आरोग्य, कर्जफेड.\n- इच्छांवर खर्च करण्यापूर्वी ठराविक रक्कम बचत करा.\n\nरोज ₹10 सुद्धा वर्षात ₹3,600 पेक्षा जास्त होतात.",
          },
        },
        {
          title: { en: "Bank linkage", hi: "बैंक लिंकेज", mr: "बँक जोडणी" },
          body: {
            en: "After regular saving for some months, an SHG can open a savings account and get a bank loan.\n\n- The group's grading depends on the Panchasutra.\n- The first loan is usually a multiple of the group's savings.\n- Repaying on time makes the next loan bigger.\n\nFor current rules and interest benefits, ask your bank branch or check official sites.",
            hi: "कुछ महीनों की नियमित बचत के बाद SHG बचत खाता खोल सकता है और बैंक ऋण ले सकता है।\n\n- समूह की ग्रेडिंग पंचसूत्र पर निर्भर करती है।\n- पहला ऋण आमतौर पर समूह की बचत का कुछ गुना होता है।\n- समय पर चुकाने से अगला ऋण बड़ा मिलता है।\n\nवर्तमान नियमों और ब्याज लाभ के लिए अपनी बैंक शाखा से पूछें या आधिकारिक साइट देखें।",
            mr: "काही महिने नियमित बचत केल्यानंतर बचत गट बचत खाते उघडू शकतो आणि बँक कर्ज घेऊ शकतो.\n\n- गटाचे मूल्यांकन पंचसूत्रीवर अवलंबून असते.\n- पहिले कर्ज साधारणपणे गटाच्या बचतीच्या काही पट असते.\n- वेळेवर परतफेड केल्यास पुढचे कर्ज मोठे मिळते.\n\nसध्याचे नियम आणि व्याज सवलतीसाठी तुमच्या बँक शाखेत विचारा किंवा अधिकृत संकेतस्थळ पहा.",
          },
        },
        {
          title: { en: "Safe digital payments", hi: "सुरक्षित डिजिटल भुगतान", mr: "सुरक्षित डिजिटल पेमेंट" },
          body: {
            en: "UPI makes payments fast, but fraudsters are active.\n\n- You never need to enter your UPI PIN to receive money.\n- Never share OTP, PIN or card details on a call.\n- Check the name before paying by QR code.\n\nIf cheated, call the national cyber-crime helpline 1930 immediately.",
            hi: "UPI से भुगतान तेज़ होता है, पर धोखेबाज़ सक्रिय हैं।\n\n- पैसे पाने के लिए कभी UPI PIN डालने की ज़रूरत नहीं होती।\n- फ़ोन पर कभी OTP, PIN या कार्ड की जानकारी न दें।\n- QR कोड से भुगतान से पहले नाम जाँचें।\n\nधोखा होने पर तुरंत राष्ट्रीय साइबर अपराध हेल्पलाइन 1930 पर कॉल करें।",
            mr: "UPI मुळे पेमेंट जलद होते, पण फसवणूक करणारे सक्रिय आहेत.\n\n- पैसे मिळवण्यासाठी UPI PIN टाकण्याची कधीच गरज नसते.\n- फोनवर कधीही OTP, PIN किंवा कार्डची माहिती देऊ नका.\n- QR कोडने पैसे देण्यापूर्वी नाव तपासा.\n\nफसवणूक झाल्यास लगेच राष्ट्रीय सायबर गुन्हे हेल्पलाइन 1930 वर कॉल करा.",
          },
        },
      ],
    },
    {
      title: { en: "Starting an Enterprise", hi: "उद्यम शुरू करना", mr: "उद्योग सुरू करणे" },
      lessons: [
        {
          title: { en: "Choosing a business", hi: "व्यवसाय चुनना", mr: "व्यवसाय निवडणे" },
          body: {
            en: "Pick a business that uses skills and materials you already have.\n\n- Is there local demand? Who will buy, and how often?\n- What raw material is available nearby?\n- Can the group manage it along with home and farm work?\n\nStart small, test the market, then grow.",
            hi: "ऐसा व्यवसाय चुनें जिसमें आपके पास पहले से मौजूद हुनर और सामग्री काम आए।\n\n- क्या स्थानीय माँग है? कौन और कितनी बार खरीदेगा?\n- पास में कौन-सा कच्चा माल मिलता है?\n- क्या समूह घर और खेती के साथ इसे संभाल सकता है?\n\nछोटे से शुरू करें, बाज़ार परखें, फिर बढ़ाएँ।",
            mr: "तुमच्याकडे आधीच असलेली कौशल्ये आणि साहित्य वापरता येईल असा व्यवसाय निवडा.\n\n- स्थानिक मागणी आहे का? कोण आणि किती वेळा खरेदी करेल?\n- जवळ कोणता कच्चा माल मिळतो?\n- घर आणि शेतीसोबत गट हे सांभाळू शकेल का?\n\nलहान सुरुवात करा, बाजार तपासा, मग वाढवा.",
          },
        },
        {
          title: { en: "Costing and pricing", hi: "लागत और मूल्य निर्धारण", mr: "खर्च आणि किंमत ठरवणे" },
          body: {
            en: "Know your full cost before fixing a price.\n\n- Raw material + packaging + transport + electricity.\n- Include the value of your own labour.\n- Price = full cost + a fair margin, checked against the market.\n\nSelling below cost is not business; it is a loss.",
            hi: "दाम तय करने से पहले पूरी लागत जानें।\n\n- कच्चा माल + पैकिंग + ढुलाई + बिजली।\n- अपनी मेहनत का मूल्य भी जोड़ें।\n- दाम = पूरी लागत + उचित मुनाफ़ा, बाज़ार से मिलाकर।\n\nलागत से कम में बेचना व्यवसाय नहीं, घाटा है।",
            mr: "किंमत ठरवण्यापूर्वी पूर्ण खर्च जाणून घ्या.\n\n- कच्चा माल + पॅकिंग + वाहतूक + वीज.\n- स्वतःच्या श्रमाचे मूल्यही जोडा.\n- किंमत = पूर्ण खर्च + योग्य नफा, बाजाराशी तुलना करून.\n\nखर्चापेक्षा कमी किमतीत विकणे हा व्यवसाय नाही, तोटा आहे.",
          },
        },
        {
          title: { en: "Selling and marketing", hi: "बिक्री और विपणन", mr: "विक्री आणि विपणन" },
          body: {
            en: "Good products still need buyers.\n\n- Use a simple brand name and clean packaging.\n- Sell at weekly markets, fairs and through WhatsApp groups.\n- Government e-marketplaces may be open to SHG products.\n\nAsk customers for feedback and improve every month.",
            hi: "अच्छे उत्पाद को भी ख़रीदार चाहिए।\n\n- सरल ब्रांड नाम और साफ़ पैकिंग रखें।\n- साप्ताहिक हाट, मेलों और WhatsApp समूहों से बेचें।\n- सरकारी ई-मार्केटप्लेस SHG उत्पादों के लिए खुले हो सकते हैं।\n\nग्राहकों से राय लें और हर महीने सुधार करें।",
            mr: "चांगल्या उत्पादनालाही ग्राहक लागतात.\n\n- सोपे ब्रँड नाव आणि स्वच्छ पॅकिंग ठेवा.\n- आठवडी बाजार, जत्रा आणि WhatsApp गटांतून विका.\n- शासकीय ई-मार्केटप्लेस बचत गटांच्या उत्पादनांसाठी खुले असू शकतात.\n\nग्राहकांचे मत घ्या आणि दर महिन्याला सुधारणा करा.",
          },
        },
      ],
    },
    {
      title: { en: "Growing Together", hi: "मिलकर आगे बढ़ना", mr: "एकत्र प्रगती" },
      lessons: [
        {
          title: { en: "From SHG to cooperative or FPO", hi: "SHG से सहकारी समिति या FPO तक", mr: "बचत गटापासून सहकारी संस्था किंवा FPO पर्यंत" },
          body: {
            en: "When several SHGs do the same business, they can form a bigger body.\n\n- A cooperative society registered under the state or multi-state law.\n- A Farmer Producer Organisation (FPO) for farm produce.\n\nA bigger body can buy in bulk, get better prices and access larger loans.",
            hi: "जब कई SHG एक ही व्यवसाय करते हैं, तो वे बड़ा संगठन बना सकते हैं।\n\n- राज्य या बहु-राज्य कानून के तहत पंजीकृत सहकारी समिति।\n- खेती की उपज के लिए किसान उत्पादक संगठन (FPO)।\n\nबड़ा संगठन थोक में ख़रीद सकता है, बेहतर दाम पा सकता है और बड़े ऋण ले सकता है।",
            mr: "अनेक बचत गट एकच व्यवसाय करत असतील तर ते मोठी संस्था बनवू शकतात.\n\n- राज्य किंवा बहुराज्य कायद्याखाली नोंदणीकृत सहकारी संस्था.\n- शेतमालासाठी शेतकरी उत्पादक संस्था (FPO).\n\nमोठी संस्था घाऊक खरेदी करू शकते, चांगला भाव मिळवू शकते आणि मोठी कर्जे मिळवू शकते.",
          },
        },
        {
          title: { en: "Finding government support", hi: "सरकारी सहायता ढूँढना", mr: "शासकीय मदत शोधणे" },
          body: {
            en: "Many schemes support SHGs, cooperatives and rural enterprises, and rules change often.\n\n- Ask your block office, bank branch or district cooperative office.\n- Check official websites such as cooperation.gov.in and nabard.org.\n- Never pay an agent to 'guarantee' a loan or subsidy.\n\nSahakar Setu does not promise loans or subsidies.",
            hi: "कई योजनाएँ SHG, सहकारी समितियों और ग्रामीण उद्यमों की मदद करती हैं, और नियम अक्सर बदलते हैं।\n\n- अपने ब्लॉक कार्यालय, बैंक शाखा या ज़िला सहकारी कार्यालय से पूछें।\n- cooperation.gov.in और nabard.org जैसी आधिकारिक वेबसाइट देखें।\n- ऋण या सब्सिडी की 'गारंटी' के लिए किसी एजेंट को पैसे न दें।\n\nसहकार सेतु ऋण या सब्सिडी का वादा नहीं करता।",
            mr: "अनेक योजना बचत गट, सहकारी संस्था आणि ग्रामीण उद्योगांना मदत करतात, आणि नियम वारंवार बदलतात.\n\n- तुमच्या तालुका कार्यालयात, बँक शाखेत किंवा जिल्हा सहकार कार्यालयात विचारा.\n- cooperation.gov.in आणि nabard.org सारखी अधिकृत संकेतस्थळे पहा.\n- कर्ज किंवा अनुदानाची 'हमी' देणाऱ्या एजंटला पैसे देऊ नका.\n\nसहकार सेतू कर्ज किंवा अनुदानाचे आश्वासन देत नाही.",
          },
        },
        {
          title: { en: "Leadership in the group", hi: "समूह में नेतृत्व", mr: "गटातील नेतृत्व" },
          body: {
            en: "A good leader listens more than she speaks.\n\n- Make sure every member speaks in meetings.\n- Solve conflicts early and fairly.\n- Keep the group's money and records transparent.\n\nLeaders trained through NCCT programmes often go on to lead cooperatives and federations.",
            hi: "अच्छी नेता बोलने से ज़्यादा सुनती है।\n\n- बैठकों में हर सदस्य को बोलने का मौका दें।\n- विवाद जल्दी और निष्पक्ष रूप से सुलझाएँ।\n- समूह का पैसा और रिकॉर्ड पारदर्शी रखें।\n\nNCCT कार्यक्रमों से प्रशिक्षित नेता अक्सर सहकारी समितियों और महासंघों का नेतृत्व करते हैं।",
            mr: "चांगली नेता बोलण्यापेक्षा जास्त ऐकते.\n\n- बैठकीत प्रत्येक सदस्याला बोलण्याची संधी द्या.\n- वाद लवकर आणि निःपक्षपणे सोडवा.\n- गटाचे पैसे आणि नोंदी पारदर्शक ठेवा.\n\nNCCT कार्यक्रमांतून प्रशिक्षित नेते अनेकदा सहकारी संस्था आणि महासंघांचे नेतृत्व करतात.",
          },
        },
      ],
    },
  ],
  questions: [
    { type: "MCQ", prompt: { en: "How many members does an SHG usually have?", hi: "SHG में आमतौर पर कितने सदस्य होते हैं?", mr: "बचत गटात साधारणपणे किती सदस्य असतात?" }, options: { en: ["10–20", "2–3", "100–200", "Only 1"], hi: ["10–20", "2–3", "100–200", "केवल 1"], mr: ["10–20", "2–3", "100–200", "फक्त 1"] }, answer: 0 },
    { type: "MSQ", prompt: { en: "Which are part of the Panchasutra? (Choose all that apply)", hi: "पंचसूत्र में कौन-से नियम हैं? (सभी सही चुनें)", mr: "पंचसूत्रीत कोणते नियम आहेत? (सर्व योग्य निवडा)" }, options: { en: ["Regular meetings", "Regular savings", "Timely repayment", "Buying gold every month"], hi: ["नियमित बैठकें", "नियमित बचत", "समय पर चुकौती", "हर महीने सोना ख़रीदना"], mr: ["नियमित बैठका", "नियमित बचत", "वेळेवर परतफेड", "दर महिन्याला सोने खरेदी"] }, answer: [0, 1, 2] },
    { type: "TF", prompt: { en: "Interest earned on internal loans stays within the group.", hi: "आंतरिक ऋण पर कमाया ब्याज समूह में ही रहता है।", mr: "अंतर्गत कर्जावर मिळालेले व्याज गटातच राहते." }, answer: true },
    { type: "MCQ", prompt: { en: "Which record lists decisions taken in meetings?", hi: "कौन-सा रिकॉर्ड बैठक के निर्णय दर्ज करता है?", mr: "कोणत्या नोंदीत बैठकीतील निर्णय लिहिले जातात?" }, options: { en: ["Minutes book", "Ration card", "Voter list", "Electricity bill"], hi: ["कार्यवाही पुस्तिका", "राशन कार्ड", "मतदाता सूची", "बिजली बिल"], mr: ["इतिवृत्त वही", "रेशन कार्ड", "मतदार यादी", "वीज बिल"] }, answer: 0 },
    { type: "MCQ", prompt: { en: "In a budget, what should come first?", hi: "बजट में सबसे पहले क्या आना चाहिए?", mr: "अंदाजपत्रकात सर्वात आधी काय यावे?" }, options: { en: ["Needs such as food, school and health", "New clothes", "Mobile recharge offers", "Festivals"], hi: ["भोजन, स्कूल, स्वास्थ्य जैसी ज़रूरतें", "नए कपड़े", "मोबाइल रिचार्ज ऑफ़र", "त्योहार"], mr: ["अन्न, शाळा, आरोग्य यासारख्या गरजा", "नवीन कपडे", "मोबाइल रिचार्ज ऑफर", "सण"] }, answer: 0 },
    { type: "TF", prompt: { en: "You must enter your UPI PIN to receive money.", hi: "पैसे पाने के लिए UPI PIN डालना ज़रूरी है।", mr: "पैसे मिळवण्यासाठी UPI PIN टाकणे आवश्यक आहे." }, answer: false },
    { type: "MCQ", prompt: { en: "Which number should you call if you are cheated online?", hi: "ऑनलाइन धोखा होने पर किस नंबर पर कॉल करें?", mr: "ऑनलाइन फसवणूक झाल्यास कोणत्या क्रमांकावर कॉल करावा?" }, options: { en: ["1930", "100100", "1234", "999"], hi: ["1930", "100100", "1234", "999"], mr: ["1930", "100100", "1234", "999"] }, answer: 0 },
    { type: "MCQ", prompt: { en: "What decides an SHG's grading for bank linkage?", hi: "बैंक लिंकेज के लिए SHG की ग्रेडिंग किससे तय होती है?", mr: "बँक जोडणीसाठी बचत गटाचे मूल्यांकन कशावरून ठरते?" }, options: { en: ["How well it follows the Panchasutra", "The leader's caste", "The village population", "The group's name"], hi: ["पंचसूत्र का पालन कितना अच्छा है", "नेता की जाति", "गाँव की आबादी", "समूह का नाम"], mr: ["पंचसूत्री किती चांगली पाळली जाते", "प्रमुखाची जात", "गावाची लोकसंख्या", "गटाचे नाव"] }, answer: 0 },
    { type: "MSQ", prompt: { en: "Which costs should be included in full cost? (Choose all that apply)", hi: "पूरी लागत में कौन-से ख़र्च शामिल हों? (सभी सही चुनें)", mr: "पूर्ण खर्चात कोणते खर्च धरावेत? (सर्व योग्य निवडा)" }, options: { en: ["Raw material", "Packaging", "Your own labour", "A neighbour's wedding"], hi: ["कच्चा माल", "पैकिंग", "अपनी मेहनत", "पड़ोसी की शादी"], mr: ["कच्चा माल", "पॅकिंग", "स्वतःचे श्रम", "शेजाऱ्याचे लग्न"] }, answer: [0, 1, 2] },
    { type: "TF", prompt: { en: "Selling below cost is a good long-term strategy.", hi: "लागत से कम में बेचना लंबे समय के लिए अच्छी रणनीति है।", mr: "खर्चापेक्षा कमी किमतीत विकणे दीर्घकाळासाठी चांगली रणनीती आहे." }, answer: false },
    { type: "MCQ", prompt: { en: "What is a good first step when choosing a business?", hi: "व्यवसाय चुनते समय अच्छा पहला कदम क्या है?", mr: "व्यवसाय निवडताना चांगली पहिली पायरी कोणती?" }, options: { en: ["Check local demand", "Take the biggest loan possible", "Copy a city business", "Wait for a subsidy"], hi: ["स्थानीय माँग जाँचें", "सबसे बड़ा ऋण लें", "शहर का व्यवसाय नकल करें", "सब्सिडी का इंतज़ार करें"], mr: ["स्थानिक मागणी तपासा", "शक्य तितके मोठे कर्ज घ्या", "शहरातील व्यवसायाची नक्कल करा", "अनुदानाची वाट पहा"] }, answer: 0 },
    { type: "MCQ", prompt: { en: "What does FPO stand for?", hi: "FPO का पूरा नाम क्या है?", mr: "FPO चे पूर्ण रूप काय?" }, options: { en: ["Farmer Producer Organisation", "Food Price Office", "Free Product Offer", "Farm Police Officer"], hi: ["किसान उत्पादक संगठन", "खाद्य मूल्य कार्यालय", "मुफ़्त उत्पाद ऑफ़र", "कृषि पुलिस अधिकारी"], mr: ["शेतकरी उत्पादक संस्था", "अन्न किंमत कार्यालय", "मोफत उत्पादन ऑफर", "शेती पोलीस अधिकारी"] }, answer: 0 },
    { type: "TF", prompt: { en: "You should pay an agent who guarantees a subsidy.", hi: "सब्सिडी की गारंटी देने वाले एजेंट को पैसे देने चाहिए।", mr: "अनुदानाची हमी देणाऱ्या एजंटला पैसे द्यावेत." }, answer: false },
    { type: "MSQ", prompt: { en: "Where can SHG products be sold? (Choose all that apply)", hi: "SHG उत्पाद कहाँ बेचे जा सकते हैं? (सभी सही चुनें)", mr: "बचत गटाची उत्पादने कुठे विकता येतात? (सर्व योग्य निवडा)" }, options: { en: ["Weekly markets", "Fairs", "WhatsApp groups", "Nowhere"], hi: ["साप्ताहिक हाट", "मेले", "WhatsApp समूह", "कहीं नहीं"], mr: ["आठवडी बाजार", "जत्रा", "WhatsApp गट", "कुठेही नाही"] }, answer: [0, 1, 2] },
    { type: "MCQ", prompt: { en: "What should a good group leader do?", hi: "अच्छी समूह नेता को क्या करना चाहिए?", mr: "चांगल्या गटप्रमुखाने काय करावे?" }, options: { en: ["Let every member speak", "Decide everything alone", "Keep records secret", "Skip meetings"], hi: ["हर सदस्य को बोलने दें", "सब अकेले तय करें", "रिकॉर्ड गुप्त रखें", "बैठकें छोड़ें"], mr: ["प्रत्येक सदस्याला बोलू द्या", "सर्व एकटीने ठरवा", "नोंदी गुप्त ठेवा", "बैठका टाळा"] }, answer: 0 },
  ],
};
