// إعدادات منصة مِداد
// 1) الصق إعدادات مشروع Firebase من: Project settings ← Your apps ← Web app
// 2) اكتب رقم هاتف مسؤول المنصة بالصيغة الدولية (ويجب أن يكون نفسه في ملف firestore.rules)
// ما دام apiKey فارغاً تعمل المنصة في «الوضع التجريبي»: البيانات في متصفحك فقط، ورمز التحقق دائماً 123456.

export const CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  // أرقام المسؤولين بالصيغة الدولية بدون مسافات، مثال: "+971501234567"
  adminPhones: ["+971500000000"],
  // رمز الدولة الافتراضي لمن يكتب رقمه محلياً (05xxxxxxxx)
  countryCode: "+971",
  // التقديم بالصوت: نموذج Gemini عبر Firebase AI Logic (يُفعَّل من Firebase console ← AI Logic)
  ai: { model: "gemini-3.8-flash" },
  orgName: "نادي المُدام الثقافي الرياضي",
  platformName: "مِداد",
  platformNameEn: "MIDAD"
};
