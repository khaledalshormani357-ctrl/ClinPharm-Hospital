# تدقيق Phase 0 — ClinPharm Hospital

مذكرة تدقيق مفصّلة (Phase 0). هذه الوثيقة محفوظة على فرع feature/clinpharm-audit-report — لا تُجرى أي تغييرات إنتاجية في هذا الالتزام.

ملاحظات أساسية قبل البدء:
- تمّ تثبيت قرارك: Supabase (Postgres) هو المصدر المرجعي الوحيد للبيانات (source of truth).
- لن تُنفَّذ أي تغييرات دموية أو تدميرية على قواعد البيانات أو سياسات RLS في هذه المرحلة.
- سنتعامل مع المتغيرات الحسّاسة (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, DATABASE_URL, service_role) كـ secrets/ENV ولا نضعها في المستودع.

ملخّص النتائج

ALREADY WORKING
- بنية مشروع TypeScript منظمة: client/, server/, shared/, supabase/, drizzle/.
- واجهة React (client/src) مع تكامل trpc و react-query.
- خادم Node/Express مع ملفات _core التي تتعامل مع OAuth، LLM، التخزين، وSDK.
- Supabase schema موجود في supabase/schema.sql ويتضمن جداول: profiles, clinical_patients, clinical_cases, medication_reviews, clinical_interventions, guidelines, sync_queue مع RLS مُفعلة.
- Trigger لإنشاء profile عند إنشاء auth.users جديد.
- README داخل supabase يصف نمط "Cloud First + Local Cache".
- ملف server/_core/llm.ts: طبقة ندء LLM مع آليات backoff وإدارة استجابات.

PARTIAL
- Local cache & sync flow مُوثّق لكنه يحتاج تحققًا وظيفيًا (offline/online, retry, conflict resolution).
- إدارة الأدوار مذكورة في schema.sql لكن لا يوجد وضوح لفرضها داخل الواجهات أو طبقة الخادم.
- Guidelines: جدول موجود لكن لا توجد أدوات لإدخال/استرجاع/فهرسة الأدلة.
- صفحات الواجهة الأساسية متوفّرة لكن لم يتم التحقق من تكاملها الكامل مع الـpatient/medication workflows.

MISSING
- جداول أساسية مطلوبة بالمواصفة لم تُدرج بعد: Encounters, Diagnoses, Allergies, Medications (تفصيلية), MedicationHistory, MedicationOrders, MedicationReconciliation, VitalSigns, LaboratoryResults, ClinicalProblems, DrugRelatedProblems, MonitoringPlans, EvidenceSources, Questions, OSCEStations, StudyTopics, StudySessions, LearningProgress, Competencies, Reflections, ClinicalLogbook, Notifications, AuditLogs.
- Supabase Storage bucket للمرفقات غير مُنشأ.
- محرك DRP (قواعد/قابلات التمديد) غير مُنفّذ.
- طبقة Copilot إكلينيكي غير مدمجة في سير العمل، رغم توفر llm.ts كطبقة اتصال.

BROKEN / RISKS
- ازدواجية في بيانات المستخدم/الهوية بين MySQL (Drizzle users) وSupabase (auth.users + profiles) — خطر تباين الصلاحيات وتضارب الهوية.
- لا يمكن التحقق من سياسات RLS على البيانات الحيّة دون الوصول إلى مشروع Supabase أو نسخة اختبارية حيث نطبق schema.sql.
- مخاطر أمنية متعلقة بـLLM: تسريب PII/PHI إلى مزود AI إن لم تُفعل سياسات منع التسرب وتسييج السياق.
- احتمالية تعارض إصدارات أو إعدادات حزم تحتاج اختبار build.

DUPLICATED
- سجل المستخدم موجود في كلا المكانين: drizzle/schema.ts (users) وsupabase public.profiles/auth.users.

LEGACY
- Drizzle/MySQL يبدو أنه داعم لمسار المصادقة والـusers table — ليس مجرد حطام، فهو مستخدم في مسار authenticateRequest.

تفصيل أين يُستخدم MySQL/Drizzle
- ملفات رئيسية:
  - drizzle/schema.ts — تعريف جدول users (openId, name, email, role, timestamps).
  - server/db.ts — تهيئة drizzle(process.env.DATABASE_URL) ووظائف: getDb(), upsertUser(), getUserByOpenId().
  - server/_core/sdk.ts — يعتمد على db.getUserByOpenId و db.upsertUser خلال authenticateRequest.
- الاستخدام العملي:
  - MySQL/Drizzle مستخدم حالياً لمزامنة/حفظ سجلات المستخدمين المحلية (openId ومعلومات الجلسة).
  - لا توجد دلائل على أن Drizzle يُستخدم لتخزين بيانات المرضى السريرية — تلك تتجه إلى Supabase.
- استنتاج:
  - Drizzle ليس مجرد legacy غير مستخدم؛ مُستخدم حالياً في مسار المصادقة/المستخدم.
  - يوجد ازدواج جزئي في بيانات المستخدم بين MySQL وSupabase.

خريطة قاعدة البيانات الحالية (مبنية على supabase/schema.sql)
- public.profiles
  - id uuid PK -> auth.users(id)
  - display_name, role (admin|clinical_pharmacist|pharmacy_student|supervisor), timestamps
  - RLS: owner-only (auth.uid() = id) للقراءة/الكتابة/التحديث

- public.clinical_patients
  - id text PK, owner_id uuid -> auth.users(id), initials, name, ward, issue, status, color, sync_state, timestamps
  - RLS: owner-isolated (auth.uid() = owner_id)

- public.clinical_cases
  - id uuid PK, owner_id uuid, patient_id -> clinical_patients(id), title, current_step, source_verified, timestamps
  - RLS: owner-isolated

- public.medication_reviews
  - id uuid PK, owner_id, patient_id, indication, effectiveness, safety, status, timestamps
  - RLS: owner-isolated

- public.clinical_interventions
  - id uuid PK, owner_id, patient_id, intervention_type, soap_note, evidence_url, evidence_level, status, timestamps
  - RLS: owner-isolated

- public.guidelines
  - id uuid PK, organization, title, year, tier (Tier 1..3), source_url, status, created_at
  - RLS: select using true (مشاركة للقراءة)

- public.sync_queue
  - id text PK, owner_id uuid, operation (create|update|delete), table_name, payload jsonb, attempts, last_error, created_at
  - RLS: owner-isolated

العلاقات الرئيسية
- profiles.id ↔ auth.users.id
- clinical_patients.owner_id ↔ auth.users.id
- clinical_cases.patient_id ↔ clinical_patients.id
- medication_reviews.patient_id ↔ clinical_patients.id
- clinical_interventions.patient_id ↔ clinical_patients.id

RLS (من schema.sql)
- profiles: select/insert/update policies تتطلب auth.uid() = id
- clinical_patients/cases/interventions/medication_reviews/sync_queue: owner-isolated policies auth.uid() = owner_id (for all operations)
- guidelines: select open to all (true)

Authentication flow (تقني)
- OAuth عبر Manus: تبادل code → exchange token → getUserInfo
- الخادم ينشئ JWT موقّعة ويخزنها في Cookie أو يُرسل Bearer token كبديل (sessionStorage fallback for WebView/Safari).
- SDKServer.authenticateRequest يقوم بـ:
  - قراءة cookie أو authorization bearer
  - verifySession(jwt)
  - استخدام openId من الجلسة للبحث عن المستخدم محلياً في MySQL عبر db.getUserByOpenId
  - إذا لم يوجد: استدعاء getUserInfoWithJwt من OAuth server ثم upsertUser إلى MySQL
  - استخدام بيانات MySQL كتمثيل User لتأمين الوصول
- في الوقت نفسه، الجداول السريرية في Supabase تعتمد على auth.users (Supabase) كمالكين للصفوف (owner_id)

مشكلة الهوية/توافق المصدر
- لا توجد خرائط واضحة بين openId (Manus OAuth) وauth.users.id في Supabase. هذا يخلق التباساً حول أي نظام يُعتبر المصدر النهائي للهوية.
- يجب توحيد الخريطة: إما توصيل openId مباشرة إلى auth.users.id في Supabase أو صنع جدول مطابقة موثّق.

حالة AI Integration
- server/_core/llm.ts موجود ويستعمل ENV.forgeApiKey وENV.forgeApiUrl أو الافتراضي forge.manus.im
- يتضمن: normalize messages, retry/backoff, response parsing
- ملاحظات:
  - لا توجد طبقة سياسات لمنع تسريب بيانات حساسة قبل إرسال الرسائل إلى مزود LLM
  - لا توجد آليات توثيق/تخزين الاستجابات أو تتبع الاستشهادات
  - البنية الجيدة كأساس ولكن تحتاج تصميم سياسات سريرية، طبقة اقتباس ومصدر أدلة

حالة Patient workflow
- وجود جدول clinical_patients وواجهات جزئية في client/src/pages
- لا توجد جداول Encounters/Diagnoses/MedicationOrders/MedicationHistory الكافية — الحاجة لإضافتها لاختبارات كاملة
- يجب اختبار الـfull flow محلياً (UI → API → DB → RLS)

حالة DRP modules
- لا يوجد محرك DRP حالياً؛ لا توجد قواعد/جداول مخصصة لتخزين DrugRelatedProblems أو تنبيهات تفاعلات دوائية

حالة Clinical Guidelines
- جدول guidelines موجود ولكن لا توجد أدوات ingestion/management/search

حالة medications/instruments
- لا توجد جداول medications التفصيلية أو formularies

تعارضات معمارية أو أمنية واضحة
- ازدواجية بيانات المستخدم بين MySQL وSupabase
- غياب خريطة موثوقة بين openId وauth.users.id
- LLM layer يحتاج سياسات تصفية/aggregations لتجنّب تسريب PHI
- مفاتيح الخدمة (service_role key) يجب أن تبقى خارج المستودع

خطة مبدئية لتوحيد قواعد البيانات (اقتراحية ولا تُطبّق الآن)
1) مسح التأثيرات: حصر كل الأماكن التي تقرأ/تكتب بيانات المستخدم في MySQL وSupabase.
2) اختيار استراتيجية توحيد (موافق عليك: جعل Supabase المصدر المرجعي):
   - أضف أعمدة role/metadata في public.profiles بحيث تستوعب حقول MySQL الضرورية.
   - أنشئ job آمن لنسخ بيانات users من MySQL إلى public.profiles (قراءة فقط، non-destructive) لملء الحقول.
   - أعد توجيه server SDK للمطالبة ببيانات المستخدم من Supabase بدلاً من MySQL، ثم تقليص اعتماد Drizzle تدريجياً.
3) تنفيذ migrations غير مدمرة مع اختبارات شاملة ونسخ احتياطية.
4) بعد التأكد: إيقاف كتابة المستخدمين إلى MySQL أو استخدامه فقط كـ read-replica مؤقت.

ملفّات رئيسية متأثرة
- supabase/schema.sql
- drizzle/schema.ts
- server/db.ts
- server/_core/sdk.ts
- client/src/main.tsx

الخطوات التي أنجزتها الآن
- حفظت هذا التقرير كـ docs/AUDIT_PHASE0.md على فرع feature/clinpharm-audit-report.

الخطوة التالية التي أقترحها (انتظر موافقتك قبل التنفيذ):
- إنشاء ملف docs/PROPOSED_ISSUES.md مع قائمة Issues مُنظَّمة، ثم فتح Issues فعلية في GH بعد موافقتك.
- لتمكين اختبارات محليّة وfunctional tests: أحتاج منّك متغيرات dev (VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY و DATABASE_URL dev) كـ secrets أو دعوة مراسِل قراءة لمشروع Supabase staging.


---

توقيع: GitHub Copilot Chat Assistant
