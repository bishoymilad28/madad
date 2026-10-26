// اللغات: العربية (الأصل) والإنجليزية
// النصوص في app.js مكتوبة بالعربية، وتُترجم عند العرض من القاموس أدناه.
// أي عنصر عليه translate="no" (عناوين الطلبات، الأسماء، الملاحظات) لا يُترجم لأنه من إدخال المستخدمين.

const KEY = 'midad_lang';
function initial() {
  try { const q = new URLSearchParams(location.search).get('lang'); if (q === 'en' || q === 'ar') return q; } catch { }
  try { const s = localStorage.getItem(KEY); if (s === 'en' || s === 'ar') return s; } catch { }
  return 'ar';
}
export let LANG = initial();
export const isEn = () => LANG === 'en';

export function applyLang() {
  const h = document.documentElement;
  h.lang = LANG; h.dir = LANG === 'en' ? 'ltr' : 'rtl';
  document.title = LANG === 'en' ? 'MIDAD | Al Madam Knowledge & Innovation Platform' : 'مِداد | منصة المُدام للمعرفة والابتكار';
}
export function setLang(l) {
  LANG = l === 'en' ? 'en' : 'ar';
  try { localStorage.setItem(KEY, LANG); } catch { }
  applyLang();
}

const EN = {
  // ===== الخطة الاستراتيجية الافتراضية =====
  'نادٍ رائد، صانعُ المواهب والإنجاز المستدام.': 'A leading club that makes talent and sustainable achievement.',
  'تطوير منظومة رياضية وثقافية متكاملة تُمكّن المواهب، وتعزز التنافسية، وتبني قيادات شابة، عبر شراكات فاعلة تحقق إنجازًا مستدامًا وتعزز جودة الحياة المجتمعية.': 'To develop an integrated sports and cultural system that empowers talent, strengthens competitiveness and builds young leaders, through effective partnerships that deliver sustainable achievement and enhance community quality of life.',
  'بناء منظومة مستدامة للمواهب والتميز الرياضي': 'Build a sustainable system for talent and sporting excellence',
  'تطوير منظومة رياضية متكاملة تدعم اكتشاف وتأهيل المواهب، ورفع مستوى التميز والتنافسية الرياضية.': 'Develop an integrated sports system that discovers and develops talent and raises sporting excellence and competitiveness.',
  'تعزيز الدور الرياضي والثقافي والمجتمعي': 'Strengthen the club’s sporting, cultural and community role',
  'ترسيخ دور النادي كمركز رياضي وثقافي ومجتمعي فاعل يعزز جودة الحياة والانتماء.': 'Establish the club as an active sporting, cultural and community hub that enhances quality of life and belonging.',
  'تعزيز التميز المؤسسي عبر الحوكمة والابتكار': 'Advance institutional excellence through governance and innovation',
  'بناء منظومة مؤسسية مبتكرة وأكثر كفاءة تدعم جودة الأداء والتطوير المستمر.': 'Build an innovative, more efficient organisation that supports quality performance and continuous improvement.',
  'تعزيز الاستدامة المالية من خلال تنمية الموارد الاستثمارية': 'Strengthen financial sustainability by growing investment resources',
  'دعم الاستقرار المالي والاستدامة التشغيلية وتعزيز قدرة النادي على التطوير.': 'Support financial stability and operational sustainability, and the club’s capacity to develop.',
  'استقطاب وتمكين الكفاءات الرياضية والإدارية والقيادية': 'Attract and empower sporting, administrative and leadership talent',
  'إعداد وتمكين كوادر وقيادات رياضية وإدارية شابة قادرة على دعم التحول المؤسسي.': 'Prepare and empower young sporting and administrative staff and leaders who can drive institutional transformation.',
  'تعزيز الشراكات المؤسسية والمجتمعية': 'Strengthen institutional and community partnerships',
  'توسيع الشراكات الفاعلة بما يدعم التنمية الرياضية والمجتمعية.': 'Expand effective partnerships that support sporting and community development.',
  'الأخلاق الرياضية': 'Sportsmanship', 'جودة الحياة': 'Quality of life', 'المواطنة الإيجابية': 'Positive citizenship', 'النزاهة والشفافية': 'Integrity & transparency',
  'الابتكار والتميز': 'Innovation & excellence', 'الاحترافية والأداء': 'Professionalism & performance', 'الاستدامة': 'Sustainability',

  // ===== القوائم =====
  'رياضي': 'Sports', 'ثقافي': 'Culture', 'مجتمعي': 'Community', 'إداري': 'Administration', 'مالي': 'Finance', 'تقنية ورقمنة': 'Technology & digital',
  'الصحة والسلامة والبيئة': 'Health, safety & environment', 'خدمة المتعاملين': 'Customer service',
  'موظف في النادي': 'Club employee', 'عضو في النادي': 'Club member', 'من الجمهور': 'Member of the public',
  'مشارك': 'Participant', 'عضو لجنة': 'Committee member', 'مسؤول': 'Administrator',
  'مقترح': 'Proposal', 'تقديم مقترح': 'Submit a proposal', 'فكرة لتحسين خدمة أو إجراء أو نشاط قائم في النادي.': 'An idea to improve an existing club service, procedure or activity.',
  'الوضع الحالي أو المشكلة': 'Current situation or problem', 'المقترح': 'The proposal', 'الفائدة المتوقعة': 'Expected benefit',
  'وفر في الوقت أو التكلفة، رضا المتعاملين، السلامة…': 'Time or cost savings, customer satisfaction, safety…', 'الجهة المقترحة للتنفيذ': 'Suggested implementing unit',
  'ابتكار': 'Innovation', 'تقديم ابتكار': 'Submit an innovation', 'حل جديد لم يُطبّق في النادي من قبل: خدمة أو عملية أو منتج.': 'A new solution never applied at the club before: a service, process or product.',
  'نوع الابتكار': 'Type of innovation', 'ابتكار في خدمة': 'Service innovation', 'ابتكار في عملية': 'Process innovation', 'ابتكار في منتج': 'Product innovation', 'ابتكار في نموذج العمل': 'Business-model innovation',
  'مستوى الجِدّة': 'Degree of novelty', 'تحسين جذري لما هو قائم': 'Radical improvement of the existing', 'جديد على النادي': 'New to the club', 'جديد على مستوى الدولة': 'New to the UAE', 'جديد عالمياً': 'New to the world',
  'التحدي الذي يعالجه': 'Challenge it addresses', 'وصف الابتكار وطريقة عمله': 'Description and how it works', 'الأثر المتوقع ومؤشر قياسه': 'Expected impact and how to measure it',
  'الموارد المطلوبة': 'Resources required', 'ميزانية تقديرية، فريق، تقنية، شراكات': 'Estimated budget, team, technology, partnerships',
  'بحث / دراسة حالة': 'Research / case study', 'تقديم بحث أو دراسة حالة': 'Submit research or a case study', 'بحث أو دراسة حالة أو تجربة موثقة، تُنشر في المكتبة بعد المراجعة.': 'Research, a case study or a documented experience, published in the library after review.',
  'نوع العمل': 'Type of work', 'بحث': 'Research', 'دراسة حالة': 'Case study', 'ورقة عمل': 'Working paper', 'تقرير مقارنة معيارية': 'Benchmarking report', 'درس مستفاد': 'Lesson learned',
  'المؤلفون': 'Authors', 'الملخص': 'Abstract', 'المنهجية': 'Methodology', 'أهم النتائج': 'Key findings', 'التوصيات': 'Recommendations',
  'رابط الملف الكامل': 'Link to the full file', 'رابط OneDrive أو SharePoint أو Google Drive': 'OneDrive, SharePoint or Google Drive link',
  'مستلم': 'Received', 'تسجيل الطلب برقم مرجعي': 'Logged with a reference number', 'فرز أولي': 'Screening', 'اكتمال البيانات وارتباطها بالأهداف': 'Completeness and fit with the goals',
  'تقييم اللجنة': 'Committee review', 'الجدوى والأثر والجِدّة': 'Feasibility, impact and novelty', 'معتمد': 'Approved', 'قرار الاعتماد وتحديد المسؤول': 'Approval decision and owner assigned',
  'منفذ / منشور': 'Implemented / published', 'قياس الأثر أو النشر في المكتبة': 'Impact measured or published in the library', 'مطلوب استكمال': 'Needs more information', 'غير معتمد': 'Not approved', 'منفذ': 'Implemented',
  'دراسات الحالة والبحوث': 'Case studies & research', 'البحوث ودراسات الحالة المعتمدة للنشر.': 'Research and case studies approved for publication.',
  'الابتكارات': 'Innovations', 'الابتكارات المعتمدة والمنفذة في النادي.': 'Innovations approved and implemented at the club.',
  'المقترحات': 'Proposals', 'المقترحات المعتمدة والمنفذة في النادي.': 'Proposals approved and implemented at the club.',
  'مرجع ومواصفة': 'Reference & standard', 'دليل وأداة': 'Guide & tool', 'تقرير': 'Report', 'رابط خارجي': 'External link', 'مرجع': 'Reference',

  // ===== رسائل الأخطاء =====
  'رقم الهاتف غير صحيح. اكتبه هكذا: 05xxxxxxxx': 'Invalid phone number. Enter it like this: 05xxxxxxxx',
  'الرمز غير صحيح. تأكد من الأرقام الستة وحاول مجدداً.': 'Incorrect code. Check the six digits and try again.',
  'انتهت صلاحية الرمز. اطلب رمزاً جديداً.': 'The code has expired. Request a new one.',
  'محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.': 'Too many attempts. Please wait a moment and try again.',
  'خدمة الرسائل غير مفعّلة بعد في إعدادات المنصة. تواصل مع المسؤول.': 'SMS is not enabled yet in the platform settings. Please contact the administrator.',
  'تعذّر التحقق الأمني. حدّث الصفحة وحاول مرة أخرى.': 'Security check failed. Refresh the page and try again.',
  'تعذّر الاتصال. تحقق من الإنترنت.': 'Connection failed. Check your internet.',
  'لا تملك صلاحية تنفيذ هذا الإجراء.': 'You don’t have permission to do this.',
  'حدث خطأ غير متوقع. حاول مرة أخرى.': 'Something went wrong. Please try again.',

  // ===== الإطار =====
  'الرئيسية': 'Home', 'مكتبة المعرفة': 'Knowledge library', 'قدّم': 'Submit', 'طلباتي': 'My submissions', 'لوحة الإدارة': 'Admin', 'خروج': 'Sign out', 'دخول': 'Sign in',
  'وضع تجريبي:': 'Demo mode:', 'البيانات تُحفظ في متصفحك فقط.': 'Data is stored in your browser only.', 'البيانات تُحفظ في متصفحك فقط. جرّب:': 'Data is stored in your browser only. Try:',
  'دخول كمسؤول': 'Sign in as admin', 'دخول كمشارك': 'Sign in as participant', 'رقم جديد': 'New number', 'إعادة ضبط البيانات': 'Reset data', 'القائمة الرئيسية': 'Main menu',
  'مِداد · منصة نادي المُدام الثقافي الرياضي للمعرفة والابتكار': 'MIDAD · Al Madam Cultural Sports Club knowledge & innovation platform',
  'منهجية التقييم وفق إرشادات ISO 56002 و ISO 56007': 'Evaluation follows ISO 56002 and ISO 56007 guidance',
  'نادي المُدام الثقافي الرياضي': 'Al Madam Cultural Sports Club', 'مجلس الشارقة الرياضي': 'Sharjah Sports Council', 'حياكم في منصة نادي المُدام الثقافي الرياضي': 'Welcome to the Al Madam Cultural Sports Club platform', 'اللغة': 'Language',

  // ===== الرئيسية =====
  'منصة لتقديم المقترحات والابتكارات والبحوث ودراسات الحالة، ومكتبة معرفة مفتوحة للجميع. ادخل برقم هاتفك في أقل من دقيقة وابدأ.': 'Submit proposals, innovations, research and case studies, and explore a knowledge library open to everyone. Sign in with your phone number in under a minute.',
  'قدّم الآن': 'Submit now', 'ادخل برقم هاتفك': 'Sign in with your phone', 'تصفّح المكتبة': 'Browse the library', 'شعار مِداد': 'MIDAD logo',
  'نبدأ من الاتجاه': 'We start from direction', 'الخطة الاستراتيجية': 'Strategic plan', 'رؤيتنا': 'Our vision', 'رسالتنا': 'Our mission', 'قيمنا': 'Our values',
  'شارك بما لديك': 'Share what you have', 'ماذا تريد أن تقدّم؟': 'What would you like to submit?', 'ابدأ ←': 'Start →', 'بعد التقديم': 'After you submit', 'رحلة الطلب': 'The submission journey',
  'عنصر في مكتبة المعرفة': 'items in the knowledge library', 'بحث ودراسة حالة منشورة': 'research & case studies published', 'ابتكار معتمد': 'innovations approved', 'فكرة تحولت إلى واقع': 'ideas turned into reality',

  // ===== المكتبة =====
  'إدارة المعرفة': 'Knowledge management', 'مفتوحة للجميع، ويُضاف إليها كل ما تعتمده لجنة الابتكار.': 'Open to everyone. Everything the innovation committee approves is added here.',
  'فتح الملف': 'Open file', 'التفاصيل': 'Details', 'حذف': 'Delete', 'لا نتائج مطابقة': 'No matching results', 'جرّب كلمة أخرى.': 'Try another word.',
  'يُضاف هنا كل طلب في هذا القسم فور اعتماده.': 'Every submission in this section appears here once approved.',

  // ===== الدخول =====
  'خطوات الدخول': 'Sign-in steps', 'رقم الهاتف': 'Phone number', 'رمز التحقق': 'Verification code', 'بياناتك': 'Your details',
  'وضع تجريبي: لا تُرسل رسالة فعلية، والرمز دائماً': 'Demo mode: no SMS is sent, and the code is always',
  'تحقق': 'Verify', 'أدخل الرمز': 'Enter the code', 'أرسلنا رمزاً من 6 أرقام إلى': 'We sent a 6-digit code to', 'تغيير الرقم': 'Change number',
  'إعادة الإرسال بعد': 'Resend in', 'ث': 's', 'إعادة إرسال الرمز': 'Resend code', 'أهلاً بك في مِداد': 'Welcome to MIDAD', 'عرّفنا بنفسك': 'Tell us about yourself',
  'مرة واحدة فقط، وبعدها تدخل برقمك مباشرة.': 'Just once. After this, your number signs you straight in.', 'الاسم': 'Name', 'صفتك': 'You are a', 'أوافق على استخدام بياناتي لأغراض المنصة فقط': 'I agree my data is used for platform purposes only',
  'ابدأ': 'Start', 'دخول وتسجيل في خطوة واحدة': 'Sign in and sign up in one step', 'نرسل لك رمز تحقق برسالة نصية، وتدخل مباشرة. لا كلمات مرور.': 'We text you a verification code and you’re in. No passwords.',
  'رقم الهاتف المتحرك': 'Mobile number', 'مثال: 0501234567 — ولرقم من دولة أخرى اكتبه مع رمزها:': 'Example: 0501234567 — for another country, include its code:', 'أرسل الرمز': 'Send code',
  'اكتب رقم هاتف صحيحاً، مثل 0501234567': 'Enter a valid phone number, e.g. 0501234567', 'الرمز مكوّن من 6 أرقام.': 'The code has 6 digits.', 'جارٍ التحقق…': 'Verifying…',
  'اكتب اسمك.': 'Enter your name.', 'وافق على شرط استخدام البيانات للمتابعة.': 'Please accept the data-use condition to continue.', 'أُرسل رمز التحقق': 'Verification code sent', 'جارٍ الإرسال…': 'Sending…',

  // ===== التقديم =====
  'اختر…': 'Choose…', 'ادخل أولاً لتقديم طلبك': 'Sign in to submit', 'برقم هاتفك ورمز يصلك برسالة، وتتابع بعدها حالة طلبك وقرار اللجنة.': 'Use your phone number and a texted code, then follow your submission and the committee’s decision.',
  'تم استلام طلبك': 'Submission received', 'احتفظ بالرقم المرجعي لمتابعة الطلب': 'Keep the reference number to follow your submission', 'ستجد حالته في «طلباتي»، ويصلك قرار اللجنة مكتوباً فيه.': 'You’ll find its status under “My submissions”, where the committee’s decision will be written.',
  'متابعة طلباتي': 'Go to my submissions', 'تقديم طلب آخر': 'Submit another', 'نموذج التقديم': 'Submission form', 'العنوان': 'Title', 'المجال': 'Area', 'اختر المجال…': 'Choose an area…',
  'إرسال': 'Submit', 'الحقول المعلّمة بـ * مطلوبة': 'Fields marked * are required', 'ملاحظة اللجنة:': 'Committee note:', 'متابعة': 'Follow-up', 'طلب جديد': 'New submission',
  'لم تقدّم أي طلب بعد': 'You haven’t submitted anything yet', 'مقترحاتك وابتكاراتك وبحوثك ستظهر هنا مع حالة كل منها.': 'Your proposals, innovations and research will appear here with their status.', 'ابدأ أول طلب': 'Start your first submission',
  'الرابط يجب أن يبدأ بـ https://': 'The link must start with https://', 'تم استلام': 'Received',

  'فكرتك تُسهم في مستقبل النادي': 'Your idea shapes the club’s future', 'تعرّف على استراتيجيتنا': 'Explore our strategy', 'إخفاء الاستراتيجية': 'Hide the strategy',
  'الرؤية والرسالة': 'Vision & mission', 'ما المجال الذي تُسهم فكرتك في تطويره؟': 'Which area does your idea help develop?',
  'المواهب والتميز الرياضي': 'Talent & sporting excellence', 'الأنشطة الرياضية والثقافية والمجتمعية': 'Sports, cultural & community activities', 'الخدمات والأداء المؤسسي': 'Services & institutional performance',
  'الموارد المالية والاستثمار': 'Financial resources & investment', 'الكفاءات والقيادات': 'People & leadership', 'الشراكات المؤسسية والمجتمعية': 'Institutional & community partnerships', 'غير متأكد': 'Not sure',
  'حسب المجال الاستراتيجي': 'By strategic area', 'المجال الاستراتيجي': 'Strategic area',
  'ملاحظة': 'Feedback', 'تقديم ملاحظة': 'Give feedback', 'ملاحظة على خدمة أو مرفق أو تجربة في النادي، تصل مباشرة للجهة المعنية ولا تُنشر للعامة.': 'Feedback on a club service, facility or experience. It goes straight to the right team and is never published.',
  'نوع الملاحظة': 'Type of feedback', 'اقتراح تحسين': 'Improvement suggestion', 'شكوى': 'Complaint', 'إشادة': 'Compliment', 'ملاحظة عامة': 'General comment',
  'الخدمة أو المرفق المعني': 'Service or facility', 'مثل: الصالة الرياضية، المكتبة، التسجيل في الأنشطة': 'e.g. the gym, the library, activity registration', 'الملاحظة': 'Your feedback',
  'متى حدث ذلك؟': 'When did it happen?', 'تاريخ أو وقت تقريبي': 'Approximate date or time', 'ما المجال الذي تتعلق به ملاحظتك؟': 'Which area is your feedback about?',
  'قدّمها بصوتك': 'Say it instead', 'قلها بصوتك': 'Say it instead',
  'تحدّث بطريقتك، ويكتب الذكاء الاصطناعي كلامك في النموذج لتراجعه قبل الإرسال. يُحفظ التسجيل مع طلبك.': 'Speak naturally and AI writes what you said into the form for you to review before submitting. The recording is saved with your submission.',
  'التسجيل الصوتي غير متاح في هذا المتصفح. يمكنك تعبئة النموذج كتابةً.': 'Voice recording isn’t available in this browser. You can fill in the form by typing.',
  'ابدأ التسجيل': 'Start recording', 'إيقاف التسجيل': 'Stop recording', 'جارٍ التسجيل…': 'Recording…',
  'اذكر الفكرة، والمشكلة التي تعالجها، وفائدتها. اضغط للإيقاف (حد أقصى 3 دقائق).': 'Describe the idea, the problem it solves and its benefit. Tap to stop (3 minutes max).',
  'جارٍ تحويل صوتك إلى نموذج…': 'Turning your voice into the form…', 'يستمع الذكاء الاصطناعي للتسجيل ويعبّئ الحقول.': 'AI is listening to the recording and filling in the fields.',
  'تسجيلك الصوتي': 'Your recording', 'إعادة التسجيل': 'Record again', 'حذف التسجيل': 'Delete recording',
  'التسجيل قصير جداً. أعد التسجيل وتحدّث لثوانٍ أكثر.': 'The recording is too short. Record again and speak a little longer.',
  'لم نجد في التسجيل ما يكفي لتعبئة الحقول. أكملها كتابةً، وسيُحفظ التسجيل مع طلبك.': 'There wasn’t enough in the recording to fill the fields. Complete them by typing; the recording is still saved with your submission.',
  'وضع تجريبي: حُفظ التسجيل. تحويل الصوت إلى نموذج يعمل بعد ربط المنصة بـ Firebase AI.': 'Demo mode: the recording is saved. Voice-to-form works once the platform is connected to Firebase AI.',
  'حُفظ التسجيل، لكن تعذّر تحويله الآن. أكمل الحقول كتابةً، وسيصل التسجيل للجنة مع طلبك.': 'The recording is saved, but it couldn’t be converted right now. Complete the fields by typing; the committee will still receive the recording.',
  'لم يُسمح باستخدام الميكروفون. اسمح به من إعدادات المتصفح ثم حاول مرة أخرى.': 'Microphone access was blocked. Allow it in your browser settings and try again.',
  'تعذّر تشغيل الميكروفون في هذا المتصفح.': 'The microphone couldn’t be started in this browser.',
  'التسجيل الصوتي': 'Voice recording', 'النص المفرّغ من التسجيل': 'Transcript of the recording', 'تعذّر تحميل التسجيل.': 'The recording couldn’t be loaded.',
  'تسجيل صوتي': 'Voice recording', 'نعم': 'Yes',
  // ===== الإدارة =====
  'نظرة عامة': 'Overview', 'الطلبات': 'Submissions', 'المكتبة': 'Library', 'المستخدمون': 'Users', 'أقسام الإدارة': 'Admin sections',
  'هذه الصفحة للجنة الابتكار ومسؤولي المنصة': 'This page is for the innovation committee and platform administrators', 'العودة للرئيسية': 'Back to home',
  'تصدير الطلبات CSV': 'Export submissions (CSV)', 'إجمالي الطلبات': 'Total submissions', 'قيد الدراسة': 'Under review', 'معتمد أو منفذ': 'Approved or implemented', 'نسبة الاعتماد': 'Approval rate',
  'حسب النوع': 'By type', 'حسب المرحلة': 'By stage', 'حسب صفة المقدّم': 'By submitter type', 'أحدث الطلبات': 'Latest submissions', 'لا توجد طلبات بعد.': 'No submissions yet.',
  'لجنة الابتكار': 'Innovation committee', 'تصدير CSV': 'Export CSV', 'بحث بالعنوان أو الرقم أو الاسم': 'Search by title, reference or name', 'النوع': 'Type', 'كل الأنواع': 'All types',
  'المرحلة': 'Stage', 'كل المراحل': 'All stages', 'الرقم': 'Reference', 'المقدّم': 'Submitter', 'التاريخ': 'Date', 'لا توجد طلبات مطابقة': 'No matching submissions',
  'قرار المرحلة': 'Stage decision', 'ملاحظة لمقدّم الطلب': 'Note to the submitter', 'سبب القرار أو المطلوب استكماله': 'Reason for the decision or what is missing', 'حفظ القرار': 'Save decision',
  'إضافة إلى المكتبة': 'Add to the library', 'الطلبات المعتمدة تُضاف تلقائياً. استخدم هذا النموذج للمراجع الإضافية.': 'Approved submissions are added automatically. Use this form for additional references.',
  'القسم': 'Section', 'الرابط': 'Link', 'نبذة': 'Summary', 'إضافة': 'Add', 'لا توجد مراجع مضافة.': 'No references added.',
  'مكتب التخطيط الاستراتيجي': 'Strategic planning office', 'الفترة': 'Period', 'الرؤية': 'Vision', 'الرسالة': 'Mission', 'الأهداف': 'Goals',
  'هدف في كل سطر بالصيغة: الرمز | العنوان | الغاية': 'One goal per line: code | title | aim', 'القيم': 'Values', 'افصل بينها بفاصلة': 'Separate with commas', 'حفظ الخطة': 'Save plan',
  'النسخة الإنجليزية (اختياري)': 'English version (optional)', 'تظهر لمن يتصفح المنصة بالإنجليزية. اتركها فارغة لاستخدام الترجمة الافتراضية.': 'Shown to visitors browsing in English. Leave blank to use the default translation.',
  'الرؤية بالإنجليزية': 'Vision (English)', 'الرسالة بالإنجليزية': 'Mission (English)', 'الأهداف بالإنجليزية': 'Goals (English)', 'القيم بالإنجليزية': 'Values (English)',
  'المشاركون': 'Participants', 'لجنة ومسؤولون': 'Committee & admins', 'الهاتف': 'Phone', 'الصفة': 'Type', 'تاريخ التسجيل': 'Joined', 'الدور': 'Role',
  'تم تسجيل الخروج': 'Signed out', 'إغلاق': 'Close', 'تأكيد الحذف': 'Confirm delete', 'تم الحذف': 'Deleted', 'الرقم المرجعي': 'Reference', 'ملاحظة اللجنة': 'Committee note',
  'تم تحديث الدور': 'Role updated', 'تم حفظ القرار': 'Decision saved', 'العنوان مطلوب.': 'Title is required.', 'تمت الإضافة إلى المكتبة': 'Added to the library', 'تم حفظ الخطة': 'Plan saved',
  'جارٍ تحميل منصة مِداد…': 'Loading MIDAD…', 'ابحث': 'Search'
};

// نصوص فيها أرقام أو أجزاء متغيرة
const PATTERNS = [
  [/^(\d+) (عنصر|عناصر)$/, m => `${m[1]} ${m[1] === '1' ? 'item' : 'items'}`],
  [/^(\d+) من (\d+)$/, m => `${m[1]} of ${m[2]}`],
  [/^الخطة الاستراتيجية (.+)$/, m => `Strategic plan ${m[1]}`],
  [/^ابحث في (.+)…$/, m => `Search ${lookup(m[1])}…`],
  [/^لا يوجد محتوى في (.+) بعد$/, m => `Nothing in ${lookup(m[1])} yet`],
  [/^المستخدمون \((\d+)\)$/, m => `Users (${m[1]})`],
  [/^المراجع المضافة \((\d+)\)$/, m => `Added references (${m[1]})`],
  [/^إرسال (.+)$/, m => `Submit ${lookup(m[1]).toLowerCase()}`],
  [/^دور (.+)$/, m => `Role of ${m[1]}`],
  [/^أكمل الحقول المطلوبة \((\d+)\) قبل الإرسال\.$/, m => `Complete the required fields (${m[1]}) before submitting.`],
  [/^أهلاً بك في (.+)$/, m => `Welcome to ${m[1] === 'مِداد' ? 'MIDAD' : m[1]}`],
  [/^أهلاً (.+)$/, m => `Welcome, ${m[1]}`],
  [/^أهلاً$/, () => 'Welcome'],
  [/^عبّأ الذكاء الاصطناعي (\d+) (?:حقلاً|حقول) من كلامك\. راجعها وعدّل ما تريد قبل الإرسال\.$/, m => `AI filled ${m[1]} field${m[1] === '1' ? '' : 's'} from what you said. Review and edit before submitting.`],
  [/^وضع تجريبي: كُتب نص كلامك في (\d+) حقول\. التعبئة الذكية لكل الحقول تعمل بعد ربط المنصة بـ Firebase AI\.$/, m => `Demo mode: your words were written into ${m[1]} fields. Smart filling of every field works once the platform is connected to Firebase AI.`],
  [/^([\d:]+) · يُحفظ مع طلبك$/, m => `${m[1]} · saved with your submission`]
];
function lookup(k) {
  if (EN[k] != null) return EN[k];
  for (const [re, f] of PATTERNS) { const m = k.match(re); if (m) return f(m); }
  return null;
}
const AR = /[؀-ۿ]/;

// ترجمة نص واحد (تُستخدم أيضاً في ملف CSV)
export function tr(s) {
  if (LANG !== 'en' || s == null) return s;
  const str = String(s), k = str.trim();
  if (!k || !AR.test(k)) return str;
  const v = lookup(k);
  return v == null ? str : str.replace(k, v);
}

const NO = '[translate="no"]';
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
function textOk(n) { const p = n.parentElement; return p && !p.closest('script,style,textarea,' + NO); }
function fixText(n) { if (!textOk(n)) return; const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
function fixAttrs(el) { for (const a of ATTRS) { const o = el.getAttribute(a); if (o && AR.test(o)) { const v = tr(o); if (v !== o) el.setAttribute(a, v); } } }
export function translateNow(root) { translateTree(root); }
function translateTree(root) {
  if (LANG !== 'en' || !root) return;
  if (root.nodeType === 3) return fixText(root);
  if (root.nodeType !== 1 || root.closest(NO + ',script,style')) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: n => n.nodeType === 1 && n.matches(NO + ',script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  fixAttrs(root);
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? fixText(n) : fixAttrs(n);
}

// يراقب كل ما يُضاف للصفحة (الصفحات، النوافذ، التنبيهات، العدّاد) ويترجمه قبل ظهوره
export function startTranslator() {
  const obs = new MutationObserver(muts => {
    if (LANG !== 'en') return;
    for (const m of muts) {
      if (m.type === 'characterData') translateTree(m.target);
      else if (m.type === 'attributes') translateTree(m.target);
      else m.addedNodes.forEach(translateTree);
    }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  translateTree(document.body);
}
