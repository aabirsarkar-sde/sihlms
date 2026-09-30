import type { CourseSeed } from "./content-types";

export const dairy: CourseSeed = {
  code: "DAIRY",
  title: "Dairy Cooperative Management",
  description: "Run a village dairy cooperative society well: milk collection, quality testing, fair payments, accounts and member services.",
  modules: [
    {
      title: { en: "Understanding Dairy Cooperatives", hi: "डेयरी सहकारी समितियों को समझना", mr: "दुग्ध सहकारी संस्था समजून घेणे" },
      lessons: [
        {
          title: { en: "What is a dairy cooperative?", hi: "डेयरी सहकारी समिति क्या है?", mr: "दुग्ध सहकारी संस्था म्हणजे काय?" },
          body: {
            en: "A dairy cooperative is a society owned by the milk producers themselves. Members pour milk every day, and the society sells it together to get a better price.\n\n- Every member has one vote, whatever the quantity of milk.\n- Profit is shared back to members as bonus or better prices.\n- The society buys feed and services in bulk, so costs come down.\n\nWorking together gives small farmers the strength of a big business.",
            hi: "डेयरी सहकारी समिति दूध उत्पादकों की अपनी संस्था होती है। सदस्य रोज़ दूध देते हैं और समिति उसे मिलकर बेचती है ताकि बेहतर दाम मिले।\n\n- हर सदस्य का एक वोट होता है, दूध कितना भी हो।\n- मुनाफ़ा बोनस या बेहतर दाम के रूप में सदस्यों को लौटता है।\n- समिति चारा और सेवाएँ थोक में खरीदती है, इसलिए खर्च कम होता है।\n\nमिलकर काम करने से छोटे किसानों को बड़े व्यापार जैसी ताक़त मिलती है।",
            mr: "दुग्ध सहकारी संस्था ही दूध उत्पादकांची स्वतःची संस्था असते. सदस्य रोज दूध घालतात आणि संस्था ते एकत्र विकते, त्यामुळे चांगला भाव मिळतो.\n\n- दूध कितीही असो, प्रत्येक सदस्याला एक मत असते.\n- नफा बोनस किंवा चांगल्या दराच्या रूपाने सदस्यांना परत मिळतो.\n- संस्था पशुखाद्य आणि सेवा घाऊक खरेदी करते, त्यामुळे खर्च कमी होतो.\n\nएकत्र काम केल्याने लहान शेतकऱ्यांना मोठ्या व्यवसायाचे बळ मिळते.",
          },
        },
        {
          title: { en: "The three-tier Anand pattern", hi: "तीन-स्तरीय आनंद पैटर्न", mr: "त्रिस्तरीय आनंद पॅटर्न" },
          body: {
            en: "Most Indian dairy cooperatives follow the three-tier Anand pattern.\n\n- Village society: collects milk from members twice a day.\n- District union: chills, processes and packs the milk, and supplies feed and veterinary care.\n- State federation: markets the products under a common brand.\n\nEach tier is owned by the tier below it, so control stays with the farmers.",
            hi: "ज़्यादातर भारतीय डेयरी सहकारी समितियाँ तीन-स्तरीय आनंद पैटर्न पर चलती हैं।\n\n- ग्राम समिति: सदस्यों से दिन में दो बार दूध इकट्ठा करती है।\n- ज़िला संघ: दूध को ठंडा, प्रोसेस और पैक करता है, और चारा व पशु-चिकित्सा देता है।\n- राज्य महासंघ: उत्पादों को एक साझा ब्रांड के नाम से बेचता है।\n\nहर स्तर का मालिक उसके नीचे वाला स्तर होता है, इसलिए नियंत्रण किसानों के पास रहता है।",
            mr: "बहुतेक भारतीय दुग्ध सहकारी संस्था त्रिस्तरीय आनंद पॅटर्नप्रमाणे चालतात.\n\n- गाव संस्था: सदस्यांकडून दिवसातून दोनदा दूध गोळा करते.\n- जिल्हा संघ: दूध थंड करतो, प्रक्रिया करून पॅक करतो, आणि पशुखाद्य व पशुवैद्यकीय सेवा देतो.\n- राज्य महासंघ: उत्पादने एका समान ब्रँडखाली विकतो.\n\nप्रत्येक स्तराची मालकी खालच्या स्तराकडे असते, त्यामुळे नियंत्रण शेतकऱ्यांकडे राहते.",
          },
        },
        {
          title: { en: "Roles of members and the board", hi: "सदस्यों और बोर्ड की भूमिका", mr: "सदस्य आणि संचालक मंडळाची भूमिका" },
          body: {
            en: "The general body of all members is the highest authority. It elects a managing committee (board) for a fixed term.\n\n- Members: pour quality milk, attend the annual general meeting, and vote.\n- Board: sets policy, approves the budget and appoints the secretary.\n- Secretary: runs daily work, keeps records and makes payments.\n\nGood societies hold meetings on time and share accounts openly with members.",
            hi: "सभी सदस्यों की आम सभा सर्वोच्च होती है। यह एक तय अवधि के लिए प्रबंध समिति (बोर्ड) चुनती है।\n\n- सदस्य: अच्छी गुणवत्ता का दूध दें, वार्षिक आम सभा में आएँ और वोट करें।\n- बोर्ड: नीति तय करता है, बजट मंज़ूर करता है और सचिव नियुक्त करता है।\n- सचिव: रोज़ का काम चलाता है, रिकॉर्ड रखता है और भुगतान करता है।\n\nअच्छी समितियाँ समय पर बैठकें करती हैं और हिसाब सदस्यों के साथ खुलकर साझा करती हैं।",
            mr: "सर्व सदस्यांची सर्वसाधारण सभा ही सर्वोच्च असते. ती ठराविक काळासाठी व्यवस्थापन समिती (संचालक मंडळ) निवडते.\n\n- सदस्य: दर्जेदार दूध घालणे, वार्षिक सर्वसाधारण सभेला येणे आणि मतदान करणे.\n- संचालक मंडळ: धोरण ठरवते, अंदाजपत्रक मंजूर करते आणि सचिवाची नेमणूक करते.\n- सचिव: रोजचे काम चालवतो, नोंदी ठेवतो आणि पेमेंट करतो.\n\nचांगल्या संस्था वेळेवर सभा घेतात आणि हिशोब सदस्यांसमोर खुलेपणाने मांडतात.",
          },
        },
      ],
    },
    {
      title: { en: "Milk Collection and Quality", hi: "दूध संग्रह और गुणवत्ता", mr: "दूध संकलन आणि गुणवत्ता" },
      lessons: [
        {
          title: { en: "Collecting milk at the society", hi: "समिति पर दूध संग्रह", mr: "संस्थेत दूध संकलन" },
          body: {
            en: "Milk is collected at fixed times every morning and evening. Each member's milk is weighed, sampled and recorded against their member number.\n\n- Use clean, covered steel cans.\n- Record quantity and sample number immediately.\n- Give the member a slip or SMS with quantity, fat and rate.\n\nAn automatic milk collection unit (AMCU) records all of this digitally and reduces disputes.",
            hi: "दूध हर सुबह और शाम तय समय पर इकट्ठा किया जाता है। हर सदस्य का दूध तौला जाता है, नमूना लिया जाता है और उसके सदस्य नंबर पर दर्ज किया जाता है।\n\n- साफ़, ढके हुए स्टील के कैन इस्तेमाल करें।\n- मात्रा और नमूना नंबर तुरंत दर्ज करें।\n- सदस्य को मात्रा, फ़ैट और दर की पर्ची या SMS दें।\n\nऑटोमैटिक मिल्क कलेक्शन यूनिट (AMCU) यह सब डिजिटल रूप से दर्ज करती है और विवाद कम करती है।",
            mr: "दूध दररोज सकाळी आणि संध्याकाळी ठराविक वेळी गोळा केले जाते. प्रत्येक सदस्याचे दूध मोजले जाते, नमुना घेतला जातो आणि त्याच्या सदस्य क्रमांकावर नोंदवले जाते.\n\n- स्वच्छ, झाकलेले स्टीलचे कॅन वापरा.\n- प्रमाण आणि नमुना क्रमांक लगेच नोंदवा.\n- सदस्याला प्रमाण, फॅट आणि दराची पावती किंवा SMS द्या.\n\nस्वयंचलित दूध संकलन यंत्र (AMCU) हे सर्व डिजिटल पद्धतीने नोंदवते आणि वाद कमी करते.",
          },
        },
        {
          title: { en: "Testing fat and SNF", hi: "फ़ैट और SNF की जाँच", mr: "फॅट आणि SNF तपासणी" },
          body: {
            en: "Milk is paid for by quality, not just quantity. Two tests matter most.\n\n- Fat %: measured with a milk analyser or Gerber method.\n- SNF % (solids-not-fat): protein, lactose and minerals, usually worked out from fat and the lactometer reading.\n\nThe society publishes a rate chart that links fat and SNF to price per litre. Watered milk shows low SNF, so testing protects honest members.",
            hi: "दूध का भुगतान केवल मात्रा से नहीं, गुणवत्ता से होता है। दो जाँचें सबसे ज़रूरी हैं।\n\n- फ़ैट %: मिल्क एनालाइज़र या गर्बर विधि से मापा जाता है।\n- SNF % (ठोस-गैर-वसा): प्रोटीन, लैक्टोज़ और खनिज; आमतौर पर फ़ैट और लैक्टोमीटर रीडिंग से निकाला जाता है।\n\nसमिति एक रेट चार्ट जारी करती है जो फ़ैट और SNF को प्रति लीटर दाम से जोड़ता है। पानी मिले दूध में SNF कम आता है, इसलिए जाँच ईमानदार सदस्यों की रक्षा करती है।",
            mr: "दुधाचे पैसे फक्त प्रमाणावर नाही तर गुणवत्तेवर दिले जातात. दोन तपासण्या सर्वात महत्त्वाच्या आहेत.\n\n- फॅट %: मिल्क ॲनालायझर किंवा गर्बर पद्धतीने मोजले जाते.\n- SNF % (घन-अस्निग्ध पदार्थ): प्रथिने, लॅक्टोज आणि खनिजे; साधारणपणे फॅट आणि लॅक्टोमीटर वाचनावरून काढले जाते.\n\nसंस्था दरपत्रक जाहीर करते जे फॅट आणि SNF ला प्रति लिटर दराशी जोडते. पाणी मिसळलेल्या दुधात SNF कमी येते, म्हणून तपासणी प्रामाणिक सदस्यांचे संरक्षण करते.",
          },
        },
        {
          title: { en: "Hygiene and the cold chain", hi: "स्वच्छता और कोल्ड चेन", mr: "स्वच्छता आणि शीत साखळी" },
          body: {
            en: "Milk spoils quickly when warm. Bacteria double roughly every 20 minutes at room temperature.\n\n- Wash hands and udders before milking.\n- Bring milk to the society within two hours.\n- Chill it to 4°C in a bulk milk cooler (BMC).\n\nClean milk earns a quality bonus and keeps consumers safe.",
            hi: "गर्म होने पर दूध जल्दी ख़राब होता है। कमरे के तापमान पर बैक्टीरिया लगभग हर 20 मिनट में दोगुने हो जाते हैं।\n\n- दुहने से पहले हाथ और थन धोएँ।\n- दो घंटे के अंदर दूध समिति तक पहुँचाएँ।\n- बल्क मिल्क कूलर (BMC) में 4°C तक ठंडा करें।\n\nसाफ़ दूध पर गुणवत्ता बोनस मिलता है और उपभोक्ता सुरक्षित रहते हैं।",
            mr: "दूध गरम राहिल्यास लवकर खराब होते. खोलीच्या तापमानात जिवाणू साधारण दर 20 मिनिटांनी दुप्पट होतात.\n\n- धार काढण्यापूर्वी हात आणि कास धुवा.\n- दोन तासांच्या आत दूध संस्थेत आणा.\n- बल्क मिल्क कूलर (BMC) मध्ये 4°C पर्यंत थंड करा.\n\nस्वच्छ दुधाला गुणवत्ता बोनस मिळतो आणि ग्राहक सुरक्षित राहतात.",
          },
        },
      ],
    },
    {
      title: { en: "Accounts and Payments", hi: "हिसाब और भुगतान", mr: "हिशोब आणि पेमेंट" },
      lessons: [
        {
          title: { en: "Milk pricing and payment cycles", hi: "दूध का दाम और भुगतान चक्र", mr: "दुधाचा दर आणि पेमेंट चक्र" },
          body: {
            en: "Members are usually paid every 10 days. The amount is litres × rate from the rate chart.\n\n- Pay directly into members' bank accounts.\n- Deduct feed or loan dues only with a clear statement.\n- Display the payment register on the notice board.\n\nRegular, transparent payment builds trust and keeps members loyal.",
            hi: "सदस्यों को आमतौर पर हर 10 दिन में भुगतान होता है। राशि = लीटर × रेट चार्ट का दाम।\n\n- भुगतान सीधे सदस्यों के बैंक खाते में करें।\n- चारे या ऋण की कटौती केवल साफ़ विवरण के साथ करें।\n- भुगतान रजिस्टर सूचना-पट्ट पर लगाएँ।\n\nनियमित और पारदर्शी भुगतान से भरोसा बनता है और सदस्य जुड़े रहते हैं।",
            mr: "सदस्यांना साधारणपणे दर 10 दिवसांनी पेमेंट केले जाते. रक्कम = लिटर × दरपत्रकातील दर.\n\n- पेमेंट थेट सदस्यांच्या बँक खात्यात करा.\n- पशुखाद्य किंवा कर्जाची कपात फक्त स्पष्ट विवरणासह करा.\n- पेमेंट रजिस्टर सूचना फलकावर लावा.\n\nनियमित आणि पारदर्शक पेमेंटमुळे विश्वास वाढतो आणि सदस्य जोडलेले राहतात.",
          },
        },
        {
          title: { en: "Basic bookkeeping for the society", hi: "समिति के लिए बुनियादी बहीखाता", mr: "संस्थेसाठी मूलभूत लेखांकन" },
          body: {
            en: "Every rupee in and out must be written down the same day.\n\n- Cash book: all cash receipts and payments.\n- Milk register: daily quantity and quality per member.\n- Ledger: accounts of each member, supplier and the union.\n\nAt month end, the cash in hand must match the cash book balance.",
            hi: "हर आने-जाने वाला रुपया उसी दिन लिखा जाना चाहिए।\n\n- कैश बुक: सभी नकद प्राप्तियाँ और भुगतान।\n- दूध रजिस्टर: हर सदस्य की रोज़ की मात्रा और गुणवत्ता।\n- खाता-बही (लेजर): हर सदस्य, सप्लायर और संघ का खाता।\n\nमहीने के अंत में हाथ की नकदी कैश बुक के शेष से मेल खानी चाहिए।",
            mr: "आत येणारा आणि बाहेर जाणारा प्रत्येक रुपया त्याच दिवशी लिहिला पाहिजे.\n\n- रोकड वही: सर्व रोख जमा आणि पेमेंट.\n- दूध रजिस्टर: प्रत्येक सदस्याचे रोजचे प्रमाण आणि गुणवत्ता.\n- खातेवही (लेजर): प्रत्येक सदस्य, पुरवठादार आणि संघाचे खाते.\n\nमहिन्याच्या शेवटी हातातील रोकड रोकड वहीतील शिलकीशी जुळली पाहिजे.",
          },
        },
        {
          title: { en: "Audit and transparency", hi: "ऑडिट और पारदर्शिता", mr: "लेखापरीक्षण आणि पारदर्शकता" },
          body: {
            en: "Cooperative law requires the accounts to be audited every year.\n\n- Keep vouchers and bills for every payment.\n- Fix audit objections before the next general meeting.\n- Share the audited balance sheet with all members.\n\nA clean audit makes it easier to get loans and grants for the society.",
            hi: "सहकारी कानून के अनुसार हर साल खातों का ऑडिट ज़रूरी है।\n\n- हर भुगतान के वाउचर और बिल रखें।\n- अगली आम सभा से पहले ऑडिट आपत्तियाँ ठीक करें।\n- ऑडिट की गई बैलेंस शीट सभी सदस्यों के साथ साझा करें।\n\nसाफ़ ऑडिट से समिति को ऋण और अनुदान मिलना आसान होता है।",
            mr: "सहकार कायद्यानुसार दरवर्षी हिशोबाचे लेखापरीक्षण आवश्यक आहे.\n\n- प्रत्येक पेमेंटचे व्हाउचर आणि बिल जपून ठेवा.\n- पुढील सर्वसाधारण सभेपूर्वी लेखापरीक्षणातील आक्षेप दुरुस्त करा.\n- लेखापरीक्षित ताळेबंद सर्व सदस्यांना दाखवा.\n\nस्वच्छ लेखापरीक्षणामुळे संस्थेला कर्ज आणि अनुदान मिळणे सोपे होते.",
          },
        },
      ],
    },
    {
      title: { en: "Growth and Services", hi: "विकास और सेवाएँ", mr: "वाढ आणि सेवा" },
      lessons: [
        {
          title: { en: "Feed, veterinary and breeding services", hi: "चारा, पशु-चिकित्सा और प्रजनन सेवाएँ", mr: "पशुखाद्य, पशुवैद्यकीय आणि प्रजनन सेवा" },
          body: {
            en: "Better animals give more milk. Societies help members by offering:\n\n- Balanced cattle feed and mineral mixture at fair prices.\n- First aid and regular veterinary camps.\n- Artificial insemination (AI) with good-quality semen.\n\nKeep a simple record of each animal's vaccination and breeding dates.",
            hi: "अच्छे पशु ज़्यादा दूध देते हैं। समितियाँ सदस्यों की मदद इन सेवाओं से करती हैं:\n\n- उचित दाम पर संतुलित पशु आहार और खनिज मिश्रण।\n- प्राथमिक उपचार और नियमित पशु-चिकित्सा शिविर।\n- अच्छी गुणवत्ता के वीर्य से कृत्रिम गर्भाधान (AI)।\n\nहर पशु के टीकाकरण और गर्भाधान की तारीख़ों का सरल रिकॉर्ड रखें।",
            mr: "चांगली जनावरे जास्त दूध देतात. संस्था सदस्यांना या सेवा देऊन मदत करतात:\n\n- योग्य दरात संतुलित पशुखाद्य आणि खनिज मिश्रण.\n- प्रथमोपचार आणि नियमित पशुवैद्यकीय शिबिरे.\n- चांगल्या दर्जाच्या वीर्याने कृत्रिम रेतन (AI).\n\nप्रत्येक जनावराच्या लसीकरण आणि रेतनाच्या तारखांची साधी नोंद ठेवा.",
          },
        },
        {
          title: { en: "Digital tools for societies", hi: "समितियों के लिए डिजिटल साधन", mr: "संस्थांसाठी डिजिटल साधने" },
          body: {
            en: "Simple digital tools save time and prevent mistakes.\n\n- AMCU software for collection and rate calculation.\n- SMS or app alerts to members after each pouring.\n- Bank transfers instead of cash payments.\n\nNever share OTPs or passwords, even with staff. Back up data every week.",
            hi: "सरल डिजिटल साधन समय बचाते हैं और गलतियाँ रोकते हैं।\n\n- संग्रह और दर गणना के लिए AMCU सॉफ़्टवेयर।\n- हर बार दूध देने के बाद सदस्यों को SMS या ऐप अलर्ट।\n- नकद के बजाय बैंक ट्रांसफ़र।\n\nOTP या पासवर्ड कभी किसी से साझा न करें, कर्मचारियों से भी नहीं। हर हफ़्ते डेटा का बैकअप लें।",
            mr: "साधी डिजिटल साधने वेळ वाचवतात आणि चुका टाळतात.\n\n- संकलन आणि दर गणनेसाठी AMCU सॉफ्टवेअर.\n- प्रत्येक वेळी दूध घातल्यानंतर सदस्यांना SMS किंवा ॲप सूचना.\n- रोख रकमेऐवजी बँक ट्रान्सफर.\n\nOTP किंवा पासवर्ड कधीही कोणालाही सांगू नका, कर्मचाऱ्यांनाही नाही. दर आठवड्याला डेटाचा बॅकअप घ्या.",
          },
        },
        {
          title: { en: "Careers in the dairy sector", hi: "डेयरी क्षेत्र में करियर", mr: "दुग्ध क्षेत्रातील करिअर" },
          body: {
            en: "Trained people are needed across the dairy value chain.\n\n- Society secretary or milk tester.\n- BMC operator or plant helper.\n- Field supervisor, AI technician or feed sales.\n\nYour Sahakar Setu certificate is verifiable by employers. Turn on \"Open to work\" in your profile to be found.",
            hi: "डेयरी की पूरी वैल्यू चेन में प्रशिक्षित लोगों की ज़रूरत है।\n\n- समिति सचिव या दूध परीक्षक।\n- BMC ऑपरेटर या प्लांट सहायक।\n- फ़ील्ड सुपरवाइज़र, AI तकनीशियन या पशु आहार बिक्री।\n\nआपका सहकार सेतु प्रमाणपत्र नियोक्ता जाँच सकते हैं। नौकरी पाने के लिए प्रोफ़ाइल में \"काम के लिए उपलब्ध\" चालू करें।",
            mr: "दुग्ध व्यवसायाच्या संपूर्ण साखळीत प्रशिक्षित लोकांची गरज आहे.\n\n- संस्था सचिव किंवा दूध परीक्षक.\n- BMC ऑपरेटर किंवा प्लांट मदतनीस.\n- क्षेत्र पर्यवेक्षक, AI तंत्रज्ञ किंवा पशुखाद्य विक्री.\n\nतुमचे सहकार सेतू प्रमाणपत्र नियोक्ते तपासू शकतात. शोधले जाण्यासाठी प्रोफाइलमध्ये \"कामासाठी उपलब्ध\" चालू करा.",
          },
        },
      ],
    },
  ],
  questions: [
    { type: "MCQ", prompt: { en: "Who owns a dairy cooperative society?", hi: "डेयरी सहकारी समिति का मालिक कौन होता है?", mr: "दुग्ध सहकारी संस्थेचा मालक कोण असतो?" }, options: { en: ["The milk producers who are members", "The district collector", "A private company", "The bank"], hi: ["सदस्य दूध उत्पादक", "ज़िला कलेक्टर", "एक निजी कंपनी", "बैंक"], mr: ["सदस्य दूध उत्पादक", "जिल्हाधिकारी", "एक खाजगी कंपनी", "बँक"] }, answer: 0 },
    { type: "TF", prompt: { en: "In a cooperative, a member who pours more milk gets more votes.", hi: "सहकारी समिति में ज़्यादा दूध देने वाले सदस्य को ज़्यादा वोट मिलते हैं।", mr: "सहकारी संस्थेत जास्त दूध घालणाऱ्या सदस्याला जास्त मते मिळतात." }, answer: false },
    { type: "MCQ", prompt: { en: "Which tier of the Anand pattern collects milk from members?", hi: "आनंद पैटर्न का कौन-सा स्तर सदस्यों से दूध इकट्ठा करता है?", mr: "आनंद पॅटर्नमधील कोणता स्तर सदस्यांकडून दूध गोळा करतो?" }, options: { en: ["State federation", "District union", "Village society", "National board"], hi: ["राज्य महासंघ", "ज़िला संघ", "ग्राम समिति", "राष्ट्रीय बोर्ड"], mr: ["राज्य महासंघ", "जिल्हा संघ", "गाव संस्था", "राष्ट्रीय मंडळ"] }, answer: 2 },
    { type: "MCQ", prompt: { en: "What is the highest authority in a cooperative society?", hi: "सहकारी समिति में सर्वोच्च अधिकार किसका है?", mr: "सहकारी संस्थेत सर्वोच्च अधिकार कोणाचा असतो?" }, options: { en: ["The secretary", "The general body of members", "The milk tester", "The feed supplier"], hi: ["सचिव", "सदस्यों की आम सभा", "दूध परीक्षक", "चारा सप्लायर"], mr: ["सचिव", "सदस्यांची सर्वसाधारण सभा", "दूध परीक्षक", "पशुखाद्य पुरवठादार"] }, answer: 1 },
    { type: "MSQ", prompt: { en: "Which details should a member receive after pouring milk? (Choose all that apply)", hi: "दूध देने के बाद सदस्य को कौन-सी जानकारी मिलनी चाहिए? (सभी सही चुनें)", mr: "दूध घातल्यानंतर सदस्याला कोणती माहिती मिळाली पाहिजे? (सर्व योग्य निवडा)" }, options: { en: ["Quantity", "Fat %", "Rate", "Secretary's salary"], hi: ["मात्रा", "फ़ैट %", "दर", "सचिव का वेतन"], mr: ["प्रमाण", "फॅट %", "दर", "सचिवाचा पगार"] }, answer: [0, 1, 2] },
    { type: "MCQ", prompt: { en: "What does SNF stand for?", hi: "SNF का मतलब क्या है?", mr: "SNF म्हणजे काय?" }, options: { en: ["Solids-not-fat", "Standard nutrition factor", "Society net fund", "Sample number filed"], hi: ["ठोस-गैर-वसा (Solids-not-fat)", "मानक पोषण कारक", "समिति शुद्ध कोष", "दर्ज नमूना संख्या"], mr: ["घन-अस्निग्ध (Solids-not-fat)", "मानक पोषण घटक", "संस्था निव्वळ निधी", "नोंदवलेला नमुना क्रमांक"] }, answer: 0 },
    { type: "TF", prompt: { en: "Milk mixed with water usually shows a low SNF reading.", hi: "पानी मिले दूध में आमतौर पर SNF कम आता है।", mr: "पाणी मिसळलेल्या दुधात साधारणपणे SNF कमी येते." }, answer: true },
    { type: "MCQ", prompt: { en: "To what temperature should milk be chilled in a bulk milk cooler?", hi: "बल्क मिल्क कूलर में दूध को किस तापमान तक ठंडा करना चाहिए?", mr: "बल्क मिल्क कूलरमध्ये दूध किती तापमानापर्यंत थंड करावे?" }, options: { en: ["4°C", "15°C", "25°C", "0°C frozen"], hi: ["4°C", "15°C", "25°C", "0°C जमाकर"], mr: ["4°C", "15°C", "25°C", "0°C गोठवून"] }, answer: 0 },
    { type: "MSQ", prompt: { en: "Which are good hygiene practices? (Choose all that apply)", hi: "कौन-सी अच्छी स्वच्छता आदतें हैं? (सभी सही चुनें)", mr: "कोणत्या चांगल्या स्वच्छतेच्या सवयी आहेत? (सर्व योग्य निवडा)" }, options: { en: ["Wash hands before milking", "Use covered steel cans", "Keep milk in the sun", "Deliver milk within two hours"], hi: ["दुहने से पहले हाथ धोना", "ढके स्टील कैन इस्तेमाल करना", "दूध धूप में रखना", "दो घंटे में दूध पहुँचाना"], mr: ["धार काढण्यापूर्वी हात धुणे", "झाकलेले स्टील कॅन वापरणे", "दूध उन्हात ठेवणे", "दोन तासांत दूध पोहोचवणे"] }, answer: [0, 1, 3] },
    { type: "MCQ", prompt: { en: "How is a member's milk payment usually calculated?", hi: "सदस्य के दूध का भुगतान आमतौर पर कैसे निकाला जाता है?", mr: "सदस्याच्या दुधाचे पेमेंट साधारणपणे कसे काढले जाते?" }, options: { en: ["Litres × rate from the rate chart", "A fixed amount per month", "Number of animals × 100", "Whatever the secretary decides"], hi: ["लीटर × रेट चार्ट का दाम", "हर महीने तय राशि", "पशुओं की संख्या × 100", "जो सचिव तय करे"], mr: ["लिटर × दरपत्रकातील दर", "दर महिन्याला ठराविक रक्कम", "जनावरांची संख्या × 100", "सचिव ठरवेल ते"] }, answer: 0 },
    { type: "MCQ", prompt: { en: "Which book records all cash receipts and payments?", hi: "कौन-सी किताब में सभी नकद प्राप्तियाँ और भुगतान दर्ज होते हैं?", mr: "कोणत्या वहीत सर्व रोख जमा आणि पेमेंट नोंदवले जातात?" }, options: { en: ["Cash book", "Milk register", "Visitor book", "Attendance register"], hi: ["कैश बुक", "दूध रजिस्टर", "आगंतुक पुस्तिका", "हाज़िरी रजिस्टर"], mr: ["रोकड वही", "दूध रजिस्टर", "अभ्यागत वही", "हजेरी रजिस्टर"] }, answer: 0 },
    { type: "TF", prompt: { en: "Cooperative accounts must be audited every year.", hi: "सहकारी समिति के खातों का हर साल ऑडिट होना चाहिए।", mr: "सहकारी संस्थेच्या हिशोबाचे दरवर्षी लेखापरीक्षण झाले पाहिजे." }, answer: true },
    { type: "MCQ", prompt: { en: "What does AI mean in dairy breeding?", hi: "डेयरी प्रजनन में AI का मतलब क्या है?", mr: "दुग्ध प्रजननात AI म्हणजे काय?" }, options: { en: ["Artificial insemination", "Animal insurance", "Automatic intake", "Annual inspection"], hi: ["कृत्रिम गर्भाधान", "पशु बीमा", "स्वचालित सेवन", "वार्षिक निरीक्षण"], mr: ["कृत्रिम रेतन", "पशु विमा", "स्वयंचलित सेवन", "वार्षिक तपासणी"] }, answer: 0 },
    { type: "TF", prompt: { en: "It is safe to share your OTP with the society staff.", hi: "अपना OTP समिति के कर्मचारियों से साझा करना सुरक्षित है।", mr: "आपला OTP संस्थेच्या कर्मचाऱ्यांना सांगणे सुरक्षित आहे." }, answer: false },
    { type: "MSQ", prompt: { en: "Which jobs are part of the dairy value chain? (Choose all that apply)", hi: "कौन-सी नौकरियाँ डेयरी वैल्यू चेन का हिस्सा हैं? (सभी सही चुनें)", mr: "कोणत्या नोकऱ्या दुग्ध मूल्यसाखळीचा भाग आहेत? (सर्व योग्य निवडा)" }, options: { en: ["Milk tester", "BMC operator", "AI technician", "Airline pilot"], hi: ["दूध परीक्षक", "BMC ऑपरेटर", "AI तकनीशियन", "विमान पायलट"], mr: ["दूध परीक्षक", "BMC ऑपरेटर", "AI तंत्रज्ञ", "विमान वैमानिक"] }, answer: [0, 1, 2] },
  ],
};
