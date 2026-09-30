import type { CourseSeed } from "./content-types";

export const pacs: CourseSeed = {
  code: "PACS",
  title: "PACS Management and Digital Accounting",
  description: "For PACS secretaries, staff and board members: governance, crop loans, computerised accounts and new business lines.",
  modules: [
    {
      title: { en: "The Role of PACS", hi: "PACS की भूमिका", mr: "PACS ची भूमिका" },
      lessons: [
        {
          title: { en: "What is a PACS?", hi: "PACS क्या है?", mr: "PACS म्हणजे काय?" },
          body: {
            en: "A Primary Agricultural Credit Society (PACS) is the village-level cooperative that gives short-term crop loans and farm inputs to its farmer members.\n\n- It is the base of the rural cooperative credit system.\n- It borrows from the District Central Cooperative Bank (DCCB).\n- Members are mostly small and marginal farmers.\n\nA strong PACS keeps credit close to the farmer's field.",
            hi: "प्राथमिक कृषि ऋण समिति (PACS) गाँव स्तर की सहकारी संस्था है जो अपने किसान सदस्यों को अल्पकालिक फ़सल ऋण और खेती का सामान देती है।\n\n- यह ग्रामीण सहकारी ऋण व्यवस्था की नींव है।\n- यह ज़िला केंद्रीय सहकारी बैंक (DCCB) से उधार लेती है।\n- ज़्यादातर सदस्य छोटे और सीमांत किसान होते हैं।\n\nमज़बूत PACS ऋण को किसान के खेत के पास रखती है।",
            mr: "प्राथमिक कृषी पतपुरवठा संस्था (PACS) ही गाव पातळीवरील सहकारी संस्था आहे जी आपल्या शेतकरी सदस्यांना अल्पमुदतीचे पीक कर्ज आणि शेती साहित्य देते.\n\n- ही ग्रामीण सहकारी पतव्यवस्थेचा पाया आहे.\n- ती जिल्हा मध्यवर्ती सहकारी बँकेकडून (DCCB) कर्ज घेते.\n- बहुतेक सदस्य लहान आणि अल्पभूधारक शेतकरी असतात.\n\nमजबूत PACS पतपुरवठा शेतकऱ्याच्या शेताजवळ ठेवते.",
          },
        },
        {
          title: { en: "Model bye-laws and multi-service PACS", hi: "मॉडल उपनियम और बहुउद्देशीय PACS", mr: "आदर्श उपविधी आणि बहुउद्देशीय PACS" },
          body: {
            en: "Model bye-laws allow a PACS to do much more than lending.\n\n- Dairy, fisheries and storage activities.\n- Fertiliser and seed sales, and fair price shops.\n- Common Service Centre (CSC) services for villagers.\n\nMore services mean more income for the society and more reasons for members to stay active.",
            hi: "मॉडल उपनियम PACS को ऋण देने से कहीं ज़्यादा काम करने की अनुमति देते हैं।\n\n- डेयरी, मत्स्य पालन और भंडारण गतिविधियाँ।\n- खाद और बीज की बिक्री, और उचित मूल्य की दुकानें।\n- गाँव वालों के लिए कॉमन सर्विस सेंटर (CSC) सेवाएँ।\n\nज़्यादा सेवाओं का मतलब है समिति की ज़्यादा आय और सदस्यों के सक्रिय रहने के ज़्यादा कारण।",
            mr: "आदर्श उपविधीमुळे PACS ला कर्जापेक्षा बरेच जास्त काम करता येते.\n\n- दुग्ध, मत्स्यव्यवसाय आणि साठवणूक उपक्रम.\n- खते आणि बियाणे विक्री, आणि रास्त भाव दुकाने.\n- गावकऱ्यांसाठी कॉमन सर्व्हिस सेंटर (CSC) सेवा.\n\nजास्त सेवा म्हणजे संस्थेचे जास्त उत्पन्न आणि सदस्य सक्रिय राहण्याची जास्त कारणे.",
          },
        },
        {
          title: { en: "Governance and the general body", hi: "शासन और आम सभा", mr: "प्रशासन आणि सर्वसाधारण सभा" },
          body: {
            en: "Good governance protects members' money.\n\n- Hold the annual general meeting on time.\n- Conduct board elections as per the cooperative law.\n- Record every board decision in the minutes book.\n\nConflicts of interest must be declared; a board member should not approve their own loan.",
            hi: "अच्छा शासन सदस्यों के पैसे की रक्षा करता है।\n\n- वार्षिक आम सभा समय पर करें।\n- सहकारी कानून के अनुसार बोर्ड चुनाव कराएँ।\n- बोर्ड का हर निर्णय कार्यवाही रजिस्टर में लिखें।\n\nहितों का टकराव बताना ज़रूरी है; बोर्ड सदस्य अपना ही ऋण मंज़ूर न करे।",
            mr: "चांगले प्रशासन सदस्यांच्या पैशांचे संरक्षण करते.\n\n- वार्षिक सर्वसाधारण सभा वेळेवर घ्या.\n- सहकार कायद्यानुसार संचालक मंडळाच्या निवडणुका घ्या.\n- मंडळाचा प्रत्येक निर्णय इतिवृत्त वहीत लिहा.\n\nहितसंबंधांचा संघर्ष जाहीर केला पाहिजे; संचालकाने स्वतःचे कर्ज मंजूर करू नये.",
          },
        },
      ],
    },
    {
      title: { en: "Credit Operations", hi: "ऋण संचालन", mr: "कर्ज व्यवहार" },
      lessons: [
        {
          title: { en: "Short-term crop loans", hi: "अल्पकालिक फ़सल ऋण", mr: "अल्पमुदतीचे पीक कर्ज" },
          body: {
            en: "Crop loans pay for seeds, fertiliser and labour for one season.\n\n- The amount is based on the scale of finance per acre for each crop.\n- Part may be given in kind (fertiliser) and part in cash.\n- Repayment is due after harvest.\n\nCheck land records and existing dues before sanctioning a loan.",
            hi: "फ़सल ऋण एक मौसम के बीज, खाद और मज़दूरी का खर्च उठाता है।\n\n- राशि हर फ़सल के प्रति एकड़ वित्त मान (scale of finance) पर आधारित होती है।\n- कुछ हिस्सा सामान (खाद) के रूप में और कुछ नकद दिया जा सकता है।\n- चुकौती फ़सल कटने के बाद होती है।\n\nऋण मंज़ूर करने से पहले भूमि रिकॉर्ड और बकाया जाँचें।",
            mr: "पीक कर्ज एका हंगामासाठी बियाणे, खते आणि मजुरीचा खर्च भागवते.\n\n- रक्कम प्रत्येक पिकाच्या प्रति एकर कर्जमर्यादेवर (scale of finance) आधारित असते.\n- काही भाग वस्तूरूपात (खते) आणि काही रोख दिला जाऊ शकतो.\n- परतफेड कापणीनंतर करायची असते.\n\nकर्ज मंजूर करण्यापूर्वी जमिनीचे उतारे आणि थकबाकी तपासा.",
          },
        },
        {
          title: { en: "Kisan Credit Card basics", hi: "किसान क्रेडिट कार्ड की मूल बातें", mr: "किसान क्रेडिट कार्डची मूलतत्त्वे" },
          body: {
            en: "The Kisan Credit Card (KCC) gives farmers a revolving credit limit for crop and allied needs.\n\n- Withdraw when needed, repay after harvest, and withdraw again.\n- Interest is charged only on the amount used.\n- Timely repayment may qualify for interest benefits under government schemes.\n\nFor current scheme rules, always check official sources such as your DCCB or NABARD.",
            hi: "किसान क्रेडिट कार्ड (KCC) किसानों को फ़सल और संबंधित ज़रूरतों के लिए घूमती ऋण सीमा देता है।\n\n- ज़रूरत पर निकालें, फ़सल के बाद चुकाएँ, फिर से निकालें।\n- ब्याज केवल इस्तेमाल की गई राशि पर लगता है।\n- समय पर चुकौती पर सरकारी योजनाओं में ब्याज लाभ मिल सकता है।\n\nवर्तमान योजना नियमों के लिए हमेशा अपने DCCB या NABARD जैसे आधिकारिक स्रोत देखें।",
            mr: "किसान क्रेडिट कार्ड (KCC) शेतकऱ्यांना पीक आणि संलग्न गरजांसाठी फिरती कर्जमर्यादा देते.\n\n- गरज असेल तेव्हा काढा, कापणीनंतर परत करा, पुन्हा काढा.\n- व्याज फक्त वापरलेल्या रकमेवर लागते.\n- वेळेवर परतफेड केल्यास शासकीय योजनांमध्ये व्याज सवलत मिळू शकते.\n\nसध्याच्या योजनेच्या नियमांसाठी नेहमी तुमची DCCB किंवा NABARD सारखे अधिकृत स्रोत पहा.",
          },
        },
        {
          title: { en: "Recovery and overdue loans", hi: "वसूली और बकाया ऋण", mr: "वसुली आणि थकीत कर्जे" },
          body: {
            en: "Recovery keeps the PACS alive. Money that is not repaid cannot be lent again.\n\n- Send reminders before the due date.\n- Visit defaulters with a board member and understand the reason.\n- Classify overdue loans honestly as per the rules.\n\nHigh overdues reduce the PACS's own borrowing power from the DCCB.",
            hi: "वसूली से PACS चलती है। जो पैसा वापस नहीं आता, वह दोबारा उधार नहीं दिया जा सकता।\n\n- नियत तारीख़ से पहले याद दिलाएँ।\n- बोर्ड सदस्य के साथ चूककर्ताओं से मिलें और कारण समझें।\n- नियमों के अनुसार बकाया ऋणों का ईमानदारी से वर्गीकरण करें।\n\nज़्यादा बकाया होने पर DCCB से PACS की अपनी उधार क्षमता घटती है।",
            mr: "वसुलीमुळे PACS टिकते. जे पैसे परत येत नाहीत ते पुन्हा कर्जाने देता येत नाहीत.\n\n- देय तारखेपूर्वी आठवण करून द्या.\n- संचालकासोबत थकबाकीदारांना भेटा आणि कारण समजून घ्या.\n- नियमांनुसार थकीत कर्जांचे प्रामाणिक वर्गीकरण करा.\n\nजास्त थकबाकीमुळे DCCB कडून PACS ची स्वतःची कर्ज घेण्याची क्षमता कमी होते.",
          },
        },
      ],
    },
    {
      title: { en: "Computerised PACS", hi: "कंप्यूटरीकृत PACS", mr: "संगणकीकृत PACS" },
      lessons: [
        {
          title: { en: "Why computerise PACS?", hi: "PACS का कंप्यूटरीकरण क्यों?", mr: "PACS चे संगणकीकरण का?" },
          body: {
            en: "A national project is bringing functional PACS onto a common ERP software linked with DCCBs and NABARD.\n\n- Faster loan processing and fewer errors.\n- Accounts updated daily, not at year end.\n- Transparent records that members and auditors can trust.\n\nStaff training is the key to making computerisation work.",
            hi: "एक राष्ट्रीय परियोजना कार्यरत PACS को DCCB और NABARD से जुड़े एक साझा ERP सॉफ़्टवेयर पर ला रही है।\n\n- तेज़ ऋण प्रक्रिया और कम गलतियाँ।\n- खाते साल के अंत में नहीं, रोज़ अपडेट।\n- पारदर्शी रिकॉर्ड जिन पर सदस्य और ऑडिटर भरोसा कर सकें।\n\nकर्मचारियों का प्रशिक्षण कंप्यूटरीकरण की सफलता की कुंजी है।",
            mr: "एक राष्ट्रीय प्रकल्प कार्यरत PACS ना DCCB आणि NABARD शी जोडलेल्या समान ERP सॉफ्टवेअरवर आणत आहे.\n\n- जलद कर्ज प्रक्रिया आणि कमी चुका.\n- हिशोब वर्षाअखेरीस नाही तर रोज अद्ययावत.\n- सदस्य आणि लेखापरीक्षक विश्वास ठेवू शकतील अशा पारदर्शक नोंदी.\n\nकर्मचाऱ्यांचे प्रशिक्षण हे संगणकीकरण यशस्वी करण्याची गुरुकिल्ली आहे.",
          },
        },
        {
          title: { en: "Daily transactions in the ERP", hi: "ERP में रोज़ के लेन-देन", mr: "ERP मधील रोजचे व्यवहार" },
          body: {
            en: "Every transaction is entered once and flows to all books automatically.\n\n- Open the day, then enter deposits, loan disbursals and repayments.\n- Print or SMS receipts to members.\n- Close the day only after cash matches the system balance.\n\nNever share login IDs. Each user's actions are logged.",
            hi: "हर लेन-देन एक बार दर्ज होता है और अपने-आप सभी बही-खातों में पहुँचता है।\n\n- दिन खोलें, फिर जमा, ऋण वितरण और चुकौती दर्ज करें।\n- सदस्यों को रसीद प्रिंट या SMS करें।\n- नकदी सिस्टम शेष से मिलने के बाद ही दिन बंद करें।\n\nलॉगिन ID कभी साझा न करें। हर उपयोगकर्ता का काम दर्ज होता है।",
            mr: "प्रत्येक व्यवहार एकदाच नोंदवला जातो आणि आपोआप सर्व वह्यांमध्ये जातो.\n\n- दिवस उघडा, मग ठेवी, कर्ज वाटप आणि परतफेड नोंदवा.\n- सदस्यांना पावती छापा किंवा SMS करा.\n- रोकड प्रणालीतील शिलकीशी जुळल्यानंतरच दिवस बंद करा.\n\nलॉगिन ID कधीही शेअर करू नका. प्रत्येक वापरकर्त्याच्या कृतीची नोंद होते.",
          },
        },
        {
          title: { en: "Records and reports", hi: "रिकॉर्ड और रिपोर्ट", mr: "नोंदी आणि अहवाल" },
          body: {
            en: "The ERP produces reports that used to take days.\n\n- Trial balance and balance sheet.\n- Demand, collection and balance (DCB) of loans.\n- Member-wise ledgers and statements.\n\nReview the overdue report every week in the board meeting.",
            hi: "ERP वे रिपोर्ट बनाता है जिनमें पहले कई दिन लगते थे।\n\n- ट्रायल बैलेंस और बैलेंस शीट।\n- ऋणों की माँग, वसूली और शेष (DCB)।\n- सदस्यवार खाते और विवरण।\n\nबोर्ड बैठक में हर हफ़्ते बकाया रिपोर्ट की समीक्षा करें।",
            mr: "ERP असे अहवाल तयार करते ज्यांना पूर्वी अनेक दिवस लागत.\n\n- तेरीज पत्रक आणि ताळेबंद.\n- कर्जांची मागणी, वसुली आणि शिल्लक (DCB).\n- सदस्यनिहाय खाती आणि विवरणपत्रे.\n\nमंडळाच्या बैठकीत दर आठवड्याला थकबाकी अहवालाचा आढावा घ्या.",
          },
        },
      ],
    },
    {
      title: { en: "New Business Lines", hi: "नए व्यवसाय", mr: "नवीन व्यवसाय" },
      lessons: [
        {
          title: { en: "PACS as a Common Service Centre", hi: "कॉमन सर्विस सेंटर के रूप में PACS", mr: "कॉमन सर्व्हिस सेंटर म्हणून PACS" },
          body: {
            en: "A PACS can run a Common Service Centre and earn fees for digital services.\n\n- Certificates, bill payments and form filling.\n- Banking correspondent services.\n- Insurance and pension enrolment help.\n\nVillagers save a trip to town, and the PACS earns steady income.",
            hi: "PACS कॉमन सर्विस सेंटर चला सकती है और डिजिटल सेवाओं से शुल्क कमा सकती है।\n\n- प्रमाणपत्र, बिल भुगतान और फ़ॉर्म भरना।\n- बैंकिंग कॉरेस्पोंडेंट सेवाएँ।\n- बीमा और पेंशन नामांकन में मदद।\n\nगाँव वालों का शहर जाना बचता है और PACS को स्थिर आय मिलती है।",
            mr: "PACS कॉमन सर्व्हिस सेंटर चालवून डिजिटल सेवांमधून शुल्क मिळवू शकते.\n\n- दाखले, बिल भरणा आणि अर्ज भरणे.\n- बँकिंग प्रतिनिधी सेवा.\n- विमा आणि निवृत्तीवेतन नोंदणीसाठी मदत.\n\nगावकऱ्यांची शहरात जाण्याची फेरी वाचते आणि PACS ला नियमित उत्पन्न मिळते.",
          },
        },
        {
          title: { en: "Fertiliser and fair price outlets", hi: "खाद और उचित मूल्य की दुकानें", mr: "खते आणि रास्त भाव दुकाने" },
          body: {
            en: "Selling inputs and ration through the PACS builds footfall.\n\n- Keep stock registers updated daily.\n- Display prices and stock on the board.\n- Sell only against proper bills.\n\nHonest weighing and billing build the society's reputation.",
            hi: "PACS के ज़रिए खाद-बीज और राशन बेचने से लोग आते हैं।\n\n- स्टॉक रजिस्टर रोज़ अपडेट रखें।\n- दाम और स्टॉक बोर्ड पर लगाएँ।\n- केवल सही बिल पर ही बिक्री करें।\n\nईमानदार तौल और बिलिंग से समिति की साख बनती है।",
            mr: "PACS मार्फत खते-बियाणे आणि रेशन विकल्याने लोकांची वर्दळ वाढते.\n\n- साठा रजिस्टर रोज अद्ययावत ठेवा.\n- दर आणि साठा फलकावर लावा.\n- फक्त योग्य बिलावरच विक्री करा.\n\nप्रामाणिक वजन आणि बिलिंगमुळे संस्थेची पत वाढते.",
          },
        },
        {
          title: { en: "Storage and warehousing", hi: "भंडारण और गोदाम", mr: "साठवणूक आणि गोदाम" },
          body: {
            en: "Village-level godowns let farmers store grain and sell when prices are better.\n\n- Keep stock dry, off the floor and pest-free.\n- Issue a receipt for every deposit.\n- Warehouse receipts may be used to take loans against stored produce.\n\nStorage reduces distress sales right after harvest.",
            hi: "गाँव स्तर के गोदाम किसानों को अनाज रखकर अच्छे दाम पर बेचने देते हैं।\n\n- माल सूखा, फ़र्श से ऊपर और कीट-मुक्त रखें।\n- हर जमा की रसीद दें।\n- गोदाम रसीद पर रखी उपज के बदले ऋण लिया जा सकता है।\n\nभंडारण से फ़सल के तुरंत बाद मजबूरी की बिक्री कम होती है।",
            mr: "गाव पातळीवरील गोदामांमुळे शेतकरी धान्य साठवून चांगल्या भावात विकू शकतात.\n\n- माल कोरडा, जमिनीपासून वर आणि कीडमुक्त ठेवा.\n- प्रत्येक ठेवीची पावती द्या.\n- गोदाम पावतीवर साठवलेल्या मालावर कर्ज घेता येऊ शकते.\n\nसाठवणुकीमुळे कापणीनंतर लगेच होणारी अडचणीची विक्री कमी होते.",
          },
        },
      ],
    },
  ],
  questions: [
    { type: "MCQ", prompt: { en: "What does PACS stand for?", hi: "PACS का पूरा नाम क्या है?", mr: "PACS चे पूर्ण रूप काय?" }, options: { en: ["Primary Agricultural Credit Society", "Public Agriculture Cash Scheme", "Panchayat Agri Credit Service", "Private Agro Company Society"], hi: ["प्राथमिक कृषि ऋण समिति", "सार्वजनिक कृषि नकद योजना", "पंचायत कृषि ऋण सेवा", "निजी एग्रो कंपनी समिति"], mr: ["प्राथमिक कृषी पतपुरवठा संस्था", "सार्वजनिक कृषी रोख योजना", "पंचायत कृषी कर्ज सेवा", "खाजगी ॲग्रो कंपनी संस्था"] }, answer: 0 },
    { type: "MCQ", prompt: { en: "From whom does a PACS usually borrow?", hi: "PACS आमतौर पर किससे उधार लेती है?", mr: "PACS साधारणपणे कोणाकडून कर्ज घेते?" }, options: { en: ["District Central Cooperative Bank", "Moneylender", "Gram panchayat", "Post office"], hi: ["ज़िला केंद्रीय सहकारी बैंक", "साहूकार", "ग्राम पंचायत", "डाकघर"], mr: ["जिल्हा मध्यवर्ती सहकारी बँक", "सावकार", "ग्रामपंचायत", "टपाल कार्यालय"] }, answer: 0 },
    { type: "MSQ", prompt: { en: "Which activities can a multi-service PACS take up? (Choose all that apply)", hi: "बहुउद्देशीय PACS कौन-से काम कर सकती है? (सभी सही चुनें)", mr: "बहुउद्देशीय PACS कोणते उपक्रम करू शकते? (सर्व योग्य निवडा)" }, options: { en: ["Fertiliser sales", "Storage", "Common Service Centre", "Printing currency"], hi: ["खाद बिक्री", "भंडारण", "कॉमन सर्विस सेंटर", "नोट छापना"], mr: ["खते विक्री", "साठवणूक", "कॉमन सर्व्हिस सेंटर", "चलन छापणे"] }, answer: [0, 1, 2] },
    { type: "TF", prompt: { en: "A board member may approve their own loan.", hi: "बोर्ड सदस्य अपना ही ऋण मंज़ूर कर सकता है।", mr: "संचालक स्वतःचे कर्ज मंजूर करू शकतो." }, answer: false },
    { type: "MCQ", prompt: { en: "A crop loan amount is based on:", hi: "फ़सल ऋण की राशि किस पर आधारित होती है?", mr: "पीक कर्जाची रक्कम कशावर आधारित असते?" }, options: { en: ["Scale of finance per acre for the crop", "The farmer's age", "Number of family members", "The secretary's choice"], hi: ["फ़सल के प्रति एकड़ वित्त मान", "किसान की उम्र", "परिवार के सदस्यों की संख्या", "सचिव की पसंद"], mr: ["पिकाची प्रति एकर कर्जमर्यादा", "शेतकऱ्याचे वय", "कुटुंबातील सदस्यांची संख्या", "सचिवाची मर्जी"] }, answer: 0 },
    { type: "TF", prompt: { en: "With a KCC, interest is charged only on the amount actually used.", hi: "KCC में ब्याज केवल वास्तव में इस्तेमाल की गई राशि पर लगता है।", mr: "KCC मध्ये व्याज फक्त प्रत्यक्ष वापरलेल्या रकमेवर लागते." }, answer: true },
    { type: "MCQ", prompt: { en: "Where should you check current government scheme rules?", hi: "वर्तमान सरकारी योजना के नियम कहाँ देखने चाहिए?", mr: "सध्याचे शासकीय योजनेचे नियम कुठे पाहावेत?" }, options: { en: ["Official sources like the DCCB or NABARD", "Social media forwards", "A neighbour's guess", "Old newspapers"], hi: ["DCCB या NABARD जैसे आधिकारिक स्रोत", "सोशल मीडिया फ़ॉरवर्ड", "पड़ोसी का अंदाज़ा", "पुराने अख़बार"], mr: ["DCCB किंवा NABARD सारखे अधिकृत स्रोत", "सोशल मीडिया फॉरवर्ड", "शेजाऱ्याचा अंदाज", "जुनी वर्तमानपत्रे"] }, answer: 0 },
    { type: "MCQ", prompt: { en: "Why is loan recovery important for a PACS?", hi: "PACS के लिए ऋण वसूली क्यों ज़रूरी है?", mr: "PACS साठी कर्ज वसुली का महत्त्वाची आहे?" }, options: { en: ["Unrecovered money cannot be lent again", "It increases the secretary's salary", "It is not important", "It closes the society"], hi: ["न लौटा पैसा दोबारा उधार नहीं दिया जा सकता", "इससे सचिव का वेतन बढ़ता है", "यह ज़रूरी नहीं है", "इससे समिति बंद होती है"], mr: ["परत न आलेले पैसे पुन्हा कर्जाने देता येत नाहीत", "यामुळे सचिवाचा पगार वाढतो", "हे महत्त्वाचे नाही", "यामुळे संस्था बंद होते"] }, answer: 0 },
    { type: "TF", prompt: { en: "In a computerised PACS, each transaction is entered once and flows to all books.", hi: "कंप्यूटरीकृत PACS में हर लेन-देन एक बार दर्ज होकर सभी बही-खातों में जाता है।", mr: "संगणकीकृत PACS मध्ये प्रत्येक व्यवहार एकदाच नोंदवून सर्व वह्यांमध्ये जातो." }, answer: true },
    { type: "MCQ", prompt: { en: "When should the day be closed in the ERP?", hi: "ERP में दिन कब बंद करना चाहिए?", mr: "ERP मध्ये दिवस कधी बंद करावा?" }, options: { en: ["After cash matches the system balance", "At lunch time", "Before any entries", "Only at year end"], hi: ["नकदी सिस्टम शेष से मिलने के बाद", "दोपहर के भोजन के समय", "किसी भी प्रविष्टि से पहले", "केवल साल के अंत में"], mr: ["रोकड प्रणालीतील शिलकीशी जुळल्यानंतर", "जेवणाच्या वेळी", "कोणतीही नोंद करण्यापूर्वी", "फक्त वर्षाअखेरीस"] }, answer: 0 },
    { type: "TF", prompt: { en: "It is fine to share your ERP login ID with a colleague.", hi: "अपना ERP लॉगिन ID किसी सहकर्मी से साझा करना ठीक है।", mr: "आपला ERP लॉगिन ID सहकाऱ्याला देणे ठीक आहे." }, answer: false },
    { type: "MCQ", prompt: { en: "What does a DCB report show?", hi: "DCB रिपोर्ट क्या दिखाती है?", mr: "DCB अहवाल काय दाखवतो?" }, options: { en: ["Demand, collection and balance of loans", "Daily cattle births", "District cooperative budget", "Deposit certificate bonus"], hi: ["ऋणों की माँग, वसूली और शेष", "रोज़ पशु जन्म", "ज़िला सहकारी बजट", "जमा प्रमाणपत्र बोनस"], mr: ["कर्जांची मागणी, वसुली आणि शिल्लक", "रोजचे वासरांचे जन्म", "जिल्हा सहकारी अंदाजपत्रक", "ठेव प्रमाणपत्र बोनस"] }, answer: 0 },
    { type: "MSQ", prompt: { en: "Which services can a PACS offer as a Common Service Centre? (Choose all that apply)", hi: "कॉमन सर्विस सेंटर के रूप में PACS कौन-सी सेवाएँ दे सकती है? (सभी सही चुनें)", mr: "कॉमन सर्व्हिस सेंटर म्हणून PACS कोणत्या सेवा देऊ शकते? (सर्व योग्य निवडा)" }, options: { en: ["Bill payments", "Form filling", "Insurance enrolment help", "Issuing passports itself"], hi: ["बिल भुगतान", "फ़ॉर्म भरना", "बीमा नामांकन में मदद", "ख़ुद पासपोर्ट जारी करना"], mr: ["बिल भरणा", "अर्ज भरणे", "विमा नोंदणीसाठी मदत", "स्वतः पासपोर्ट देणे"] }, answer: [0, 1, 2] },
    { type: "TF", prompt: { en: "Village storage can reduce distress sales after harvest.", hi: "गाँव का भंडारण फ़सल के बाद मजबूरी की बिक्री कम कर सकता है।", mr: "गावातील साठवणुकीमुळे कापणीनंतरची अडचणीची विक्री कमी होऊ शकते." }, answer: true },
    { type: "MCQ", prompt: { en: "What should be given for every deposit in a PACS godown?", hi: "PACS गोदाम में हर जमा पर क्या देना चाहिए?", mr: "PACS गोदामात प्रत्येक ठेवीवर काय द्यावे?" }, options: { en: ["A receipt", "Nothing", "A verbal promise", "A discount coupon"], hi: ["रसीद", "कुछ नहीं", "मौखिक वादा", "छूट कूपन"], mr: ["पावती", "काहीही नाही", "तोंडी आश्वासन", "सवलत कूपन"] }, answer: 0 },
  ],
};
