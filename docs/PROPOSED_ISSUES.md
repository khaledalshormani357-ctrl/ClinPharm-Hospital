# Proposed Issues — ClinPharm Hospital (Phase 0) — V2

هذه نسخة V2 لقائمة Issues المقترحة، محفوظة على فرع `feature/clinpharm-audit-report`. لا تُنشأ Issues فعلية ولا تُطبّق تغييرات إنتاجية — هذا الملف وثيقة تخطيطية فقط.

إرشادات عامة:
- هذه الوثيقة تُصنف المشكلات وتضع أولويات تنفيذ مقترحة (P0..P3) مع "Execution order" لتوضيح التبعيات التسلسلية.
- لكل Issue أدرجنا ثلاثة حقول واضحة: "Verified from repository"، "Needs runtime verification"، و"Requires product/clinical decision".
- لا تُنفَّذ أي migration أو تغييرات في Supabase أو RLS أو الإنتاج دون موافقتك الصريحة.

Execution order (مقترح عام)
P0-1 Identity/Auth architecture
↓
P1-1 Dev environment & runbook
↓
P1-2 RLS verification (staging)
↓
P1-3 Core clinical model (Patients, Encounters, Diagnoses, Allergies, Medications, Medication History, Medication Orders, Medication Reconciliation, Vitals, Labs)
↓
P1-4 Offline / sync verification
↓
P1-5 DRP foundation (بعد استقرار البيانات السريرية الأساسية)
↓
P2-1 Guidelines / Evidence ingestion & Search
↓
P2-2 Storage / Attachments (بناءً على احتياجات use-cases)
↓
P2-3 Education & Training domain (Questions, OSCE, Study Topics, Sessions, Learning Progress, Competencies, Reflections, Clinical Logbook)

ملاحظة: الترتيب قابل للتعديل إذا أظهر الكود أو الاختبارات سببًا أفضل.

---

1) Title: Identity / Authentication architecture (P0)

Priority: P0
Execution order: P0-1

Problem:
هناك مساران مستقلان للهوية في النظام حالياً:
- Manus OAuth → openId → MySQL/Drizzle (local users)
- Supabase Auth → auth.users → public.profiles → clinical tables

لا يوجد mapping موثّق وموثوق بين openId و auth.users.id، مما يخلق ازدواجية في الهوية ومخاطر في فرض RLS والالتحاق ببيانات المرضى.

Desired final state (هدف نهائي):
Authentication → Supabase Auth → profiles → Clinical data

Short-term constraints (قبل أي ترحيل):
- لا نريد إنشاء أو تشغيل sync job بين MySQL وSupabase كحل قصير المدى دون دليل واضح ومبرر.
- لا نُنشئ جداول mapping تنفيذية الآن إلا إذا أظهر التدقيق أن ذلك ضروري وبموافقتك.

Proposed investigative actions (قبل أي تنفيذ):
- تحديد جميع الأماكن التي تعتمد على `openId` في الكود (بحث كامل في repo: drizzle, server, SDK, auth flows, cookies, jwt handling).
- تحديد جميع الأماكن التي تعتمد على `auth.uid()` أو تستخدم Supabase session (client hooks, server calls to Supabase).
- تقييم إمكانية توجيه عملية المصادقة إلى Supabase Auth مباشرة (هل يمكن للـfrontend/backend استبدال Manus OAuth؟ ما تبعات ذلك على SSO/مستخدمين حالين).
- وصف بدائل ربط الهوية (مثلاً: provisioning Supabase user عند أول login عبر Manus OAuth باستخدام server-side createUser، أو دعوة المستخدم إلى تسجيل دخول ثانوي في Supabase) مع تقييم المخاطر.
- وضع خطة انتقال تدريجية ومحكمة بدون كسر المصادقة: خطوات تحقق، بيئة staging، خزنة نسخ احتياطية، feature flags، واختبارات قبول.

Acceptance criteria (للتحقق قبل الانتقال):
- قائمة كاملة بالمكانس البرمجية التي تستهلك `openId` و `auth.uid()`.
- وثيقة تقييم لخيارات الربط/الترحيل مع مخاطر وفوائد لكل خيار.
- خطة انتقال تدريجية مقترحة لا تنفذ أي عمليات كتابة مدمرة في الإنتاج دون موافقة صريحة.

Verified from repository:
- Drizzle `drizzle/schema.ts` و `server/db.ts` و `server/_core/sdk.ts` تُظهر اعتماد المسار MySQL للمستخدمين والمصادقة (upsertUser/getUserByOpenId).
- `supabase/schema.sql` يُظهر public.profiles مرتبط بـ auth.users.

Needs runtime verification:
- التأكد أثناء تشغيل التطبيق/جلسات حقيقية بأن القيم المفتاحية (openId, auth.users.id) لا تُستخدم بشكل متضارب.
- اختبار جلسات OAuth حقيقية ومعاينة auth.uid() في Supabase.

Requires product/clinical decision:
- قرار نهائي حول من يكون المصدر المرجعي للهوية (Supabase vs MySQL) وموعد التنفيذ.
- قبول طريقة التسلسل (مثلاً: provisioning on-first-login vs user migration flow).

---

2) Title: Dev environment & runbook (P1)

Priority: P1
Execution order: P1-1 (يجب تنفيذها بعد حل P0-1 أو بالتوازي مع التحقيقات)

Problem:
لا يوجد ملف .env.example واضح أو دليل تشغيل موحّد لتشغيل بيئة التطوير محلياً مع Supabase staging/بدائل.

Proposed solution:
- إنشاء docs/DEV_RUNBOOK.md و `.env.example` مع متغيرات placeholders: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (staging), DATABASE_URL (dev), OAUTH_SERVER_URL, FORGE_API_KEY_PLACEHOLDER، إلخ.
- تعليمات لتعبئة مفاتيح dev مؤقتة، seed scripts للمستخدمين والبيانات الأساسية، وخطوات تشغيل للتطبيق (client/server) وCI smoke.

Acceptance criteria:
- مطوّر جديد يستطيع إعداد وتشغيل التطبيق محلياً باتباع الدليل.

Verified from repository:
- لا يُوجد `.env.example` في الروت. package.json يحتوي على سكربتات dev/build.

Needs runtime verification:
- تشغيل الخطوات على جهاز dev واحد على الأقل والتأكد من أن build/boot ناجحة.

Requires product/clinical decision:
- تحديد ما إذا كان يتم توفير بيانات عيّنة سريرية أو بيانات مزيفة للـdev.

---

3) Title: RLS verification (staging) (P1)

Priority: P1
Execution order: P1-2

Problem:
سياسات RLS موجودة في `supabase/schema.sql` لكنها لم تُفحص تشغيلياً في بيئة تطبيقية لضمان السلوك المرجو.

Proposed solution:
- إعداد Supabase staging طبقاً لـschema.sql، إنشاء حسابات اختبار متعددة بأدوار مختلفة، وكتابة matrix اختبارات لقراءة/كتابة/تحديث/حذف على كل جدول.

Acceptance criteria:
- اختبار مصفوفة الأذونات يمرّ في staging لكل الجداول الحرجة.

Verified from repository:
- وجود سياسات RLS في `supabase/schema.sql` (profiles, clinical_patients, clinical_cases, medication_reviews, clinical_interventions, sync_queue, guidelines).

Needs runtime verification:
- تنفيذ matrix الاختبارات مع جلسات auth مختلفة في staging.

Requires product/clinical decision:
- تحديد الشروط الدقيقة لكل دور (role -> permissions matrix).

---

4) Title: Core clinical model — phased (P1)

Priority: P1
Execution order: P1-3

Problem:
لا نريد بناء EHR كامل دفعة واحدة. يجب تقسيم domain model إلى مراحل واضحة وترتيب حسب الأولوية لبناء سِير العمل الدوائي والسريري.

Phase A — Core clinical (الأولوية العليا لبناء مسار المريض والأدوية):
- Patients
- Encounters
- Diagnoses/Problems
- Allergies
- Medications
- Medication History
- Medication Orders
- Medication Reconciliation
- Vital Signs
- Laboratory Results

Phase B — Clinical intelligence (لاحقاً، اعتماداً على Phase A):
- Drug Related Problems (DRPs)
- Monitoring Plans
- Evidence Sources

Phase C — Education (أقل أولوية مبدئية)
- Questions
- OSCE Stations
- Study Topics
- Study Sessions
- Learning Progress
- Competencies
- Reflections
- Clinical Logbook

Acceptance criteria:
- تصميم مخططات بسيطة (ERD) لكل جدول أساسي في Phase A مع الحقول الدنيا المطلوبة.
- migrations جاهزة للتشغيل في staging (non-destructive additions فقط).

Verified from repository:
- `supabase/schema.sql` يحتوي على `clinical_patients` و `clinical_cases` و `medication_reviews` و `clinical_interventions` فقط — لا توجد جداول مفصّلة للأدوية/encounters.

Needs runtime verification:
- اختبار UI flows التي تتطلب ربط encounter/medication مع patient.

Requires product/clinical decision:
- تحديد الحقول الدنيا المطلوبة لكل كيان (مثلاً: medication should include coding e.g., RxNorm/CVN).

---

5) Title: Offline / Sync verification (P1)

Priority: P1
Execution order: P1-4

Problem:
آلية الـLocal cache و sync_queue موثقة لكنها لم تُختبر وظيفياً (conflict resolution, retries, backoff, error handling).

Proposed solution:
- إجراء اختبارات end-to-end لمحاكاة سيناريوهات offline → online، conflicts، وتكرار المحاولات.
- تحسين logging في `sync_queue` لمعرفة الأسباب عند الفشل.

Acceptance criteria:
- سيناريوهات محاكاة تعمل في staging/locally مع توثيق لسلوك الـsync.

Verified from repository:
- وجود `sync_queue` في schema.sql وREADME يصف flow.

Needs runtime verification:
- تشغيل التطبيق في نمط offline وتحقق من معالجة `sync_queue`.

Requires product/clinical decision:
- سياسات حل التعارض: last-write-wins vs merge rules vs human review.

---

6) Title: DRP foundation & dependencies (P1)

Priority: P1
Execution order: P1-5 (بعد Phase A core clinical)

Problem:
لا نبني محرك DRP قبل أن تتوفر الطبقات السريرية الأساسية. DRP يعتمد بشدة على توافر بيانات المريض، الأدوية، التشخيصات، والنتائج المخبرية.

Proposed approach:
- اعتمد الترتيب التالي: Patient → Medications → Diagnoses/Problems → Labs/Vitals → Medication Review → DRP detection → Recommendation → Monitoring.
- صمم بنية DRP بحيث تعتمد على مراجع خارجية (codes, severity, rules repository) وتبقى قابلة للتوسيع (rule-engine أو pipeline إحصائي/ML لاحقاً).

Acceptance criteria:
- ERD يوضح الروابط اللازمة لتشغيل DRP عند توفر البيانات الأساسية.

Verified from repository:
- لا توجد جداول `drug_related_problems` أو محرّك قواعد حالياً.

Needs runtime verification:
- تحقق من ربط Medication History وMedication Orders مع patient records في staging بعد إضافة الجداول.

Requires product/clinical decision:
- تعريف أنواع DRP المقبولة ودرجة الخطورة وسياسات التصعيد.

---

7) Title: Clinical Safety Architecture for AI and Decision Support (P1)

Priority: P1
Execution order: P1-6 (توازي مع DRP foundation؛ يجب أن يكون متاحاً قبل تفعيل أي توصيات آلية)

Problem:
نحتاج بنية أمان سريرية واضحة لدمج AI/Decision Support ضمن سير العمل السريري دون السماح للـAI بتنفيذ إجراءات حرجة مباشرة.

Requirements / Constraints:
- AI ليس له صلاحية تنفيذ medication orders مباشرة.
- AI لا يغيّر أو يحذف clinical data مباشرة — أي اقتراح يجب أن يكون اقتراحاً قابلاً للمراجعة.
- كل recommendation يجب أن تُميّز صراحة بين محتوى مستند إلى guideline/إثبات ونتيجة AI.
- إظهار evidence/source عندما يكون متاحاً.
- تسجيل model/provider/version، وقت التوصية، والـinput context (مختصر/معرّف ملائم) في الـaudit log.
- وجود human-in-the-loop قبل أي إجراء ذي مخاطرة عالية.
- آلية للتعامل مع حالات عدم التأكد (uncertainty) — عرض الدرجات والحدود.

Acceptance criteria:
- وثيقة هندسة السلامة السريرية مع حالات استخدام (use-cases) ومستويات الثقة المطلوبة وعمليات التدخل ا��بشري.
- قائمة واضحة لما يُسمح بإرساله إلى مزود الـLLM (allowlist) وما يجب تعقيمه.

Verified from repository:
- توجد طبقة LLM client (`server/_core/llm.ts`) لكن لا توجد سياسات سلامة/allowlist موثقة أو طبقة تصفية.

Needs runtime verification:
- أمثلة واقعية لاستدعاءات LLM في staging للتحقق من المدخلات والمخرجات والمسارات.

Requires product/clinical decision:
- تحديد ما هي التوصيات التي تُعتبر "عالية المخاطر" وتتطلب مراجعة بشرية فورية.

---

8) Title: Clinical data privacy and LLM data-minimization (P1)

Priority: P1
Execution order: P1-7

Problem:
طبقة LLM موجودة ولكن لا توجد سياسات واضحة لمنع تسريب PHI/PII أو لضمان تقليل إرسال بيانات حساسة إلى موفّري النماذج.

Focus areas:
- PHI/PII minimization
- De-identification strategies
- Allowlist of fields/data التي يمكن إرسالها
- Logging / auditability of requests and redactions
- Provider/model data retention expectations (documented per provider)
- Model/provider configuration (temperature, max tokens, streaming policy)
- عدم إرسال patient identifiers غير الضرورية (IDs, full names, MRN)

Proposed solution:
- تصميم طبقة preprocessing تقوم بتطبيق قواعد allowlist/denylist وعمليات تعقيم (hashing/partial redaction) قبل إرسال أي محتوى للـLLM.
- تسجيل كل طلب/ردّ مع علامات زمنية ومؤشر redaction، وتخزين دليل المصدر (evidence URL/ID) إن أمكن.

Acceptance criteria:
- مكتبة صغيرة للـpreprocessing وملف سياسات قابل للتدقيق في repo (لا تُفعّل في الإنتاج إلا بعد المراجعة).

Verified from repository:
- وجود `server/_core/llm.ts` واستخدام ENV.forgeApiKey/ENV.forgeApiUrl.

Needs runtime verification:
- تحليل استدعاءات LLM أثناء التشغيل لمعرفة ما إذا كان يتم إرسال PHI/PII.

Requires product/clinical decision:
- تحديد ما يعتبر PHI/PII في نطاق التطبيق والبيانات المُصرّح إرسالها لأغراض المساعدة.

---

9) Title: Guidelines / Evidence ingestion & Search (P2)

Priority: P2
Execution order: P2-1

Problem:
جدول `guidelines` موجود ولكنه يفتقر لأدوات ingestion، فهرسة، وبحث مدعوم بالأدلة.

Proposed solution:
- تصميم pipeline مخطط لاستيراد قواعد/مستندات مع metadata (title, year, source_url, tier, sections) وواجهة بحث أساسية.
- ربط الأدلة مع التوصيات وDRP حيثما أمكن.

Acceptance criteria:
- تصميم API لاستيراد guideline metadata وواجهة بحث بسيطة في staging.

Verified from repository:
- وجود جدول `guidelines` في schema.sql لكن لا توجد أدوات ingestion واضحة.

Needs runtime verification:
- تجربة ingestion لمستند واحد أو اثنين في staging.

Requires product/clinical decision:
- تحديد مصادر الأدلة المقبولة (local, WHO, national guidelines).

---

10) Title: Storage / Attachments (P2)

Priority: P2
Execution order: P2-2

Problem:
لا تُعتبر Supabase Storage أولوية قبل تحديد حالات استخدام التحميل/المرفقات.

Proposed approach:
- احتفظ بقرار وضع Storage كـP2. عند وجود use-cases محددة (PDFs, images, certificates, lab reports) نُنشئ bucket خاص وRLS مناسبة.

Acceptance criteria:
- قائمة use-cases للمرفقات ومواصفات الأمن والـRLS قبل إنشاء البوكت.

Verified from repository:
- `supabase/README.md` يذكر عدم وجود bucket حالياً.

Needs runtime verification:
- اختبار رفع ملف واحد في staging بعد إنشاء bucket.

Requires product/clinical decision:
- تحديد أنواع المرفقات المسموح بها وسياسات الاحتفاظ.

---

11) Title: Build / Dependencies (P3)

Priority: P3
Execution order: بعد P1-1 (Dev environment ready)

Problem:
اعتمادات قديمة أو overrides موجودة في package.json يمكن أن تسبب فشل build أو تحذيرات أمنية.

Proposed solution:
- بعد أن يعمل dev environment، شغّل `pnpm install` و `pnpm build` و `pnpm lint` في CI/locally، ثم اختبر تحديث الحزم بالتدريج.

Acceptance criteria:
- بيئة dev قابلة للتشغيل وبناء نظيف في CI.

Verified from repository:
- package.json يحتوي على esbuild ^0.25.0 و tailwindcss ^4.x و override لنanoid.

Needs runtime verification:
- تشغيل build محلي وCI.

Requires product/clinical decision:
- لا يتطلب قرارات سريرية، لكنه يتطلب توقيتًا مناسبًا للتحديثات دون تعطيل الإنتاج.

---

End of Proposed Issues V2.

ملاحظات ختامية:
- لم أقم بأي تغييرات تنفيذية على DB أو RLS أو أي عملية إنتاجية. هذا التعديل وثائقي فقط على الفرع `feature/clinpharm-audit-report` كما طلبت.
- لن أفتح أي Issues فعلية أو أقوم بأي PRs تنفيذية أو أبدأ ترحيلات دون موافقتك الصريحة.

الخطوة التالية:
- أكمل التعديل وحفِظته هنا كـV2. سأنتظر تأكيدك أو أي تعديلات أخرى قبل المضي قدماً.
