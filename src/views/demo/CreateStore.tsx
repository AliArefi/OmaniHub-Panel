import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Upload,
  CheckCircle,
} from "lucide-react";

export default function CreateStoreWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow">
        <h1 className="text-lg lg:text-xl font-bold text-primary">
          طلب إنشاء حجرة جديدة
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          أدخل بيانات الحجرة والخدمات الخاصة بك بخطوات بسيطة ومنظمة
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white shadow rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  حالة الطلب
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  لم يتم الإرسال بعد
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "معلومات الحجرة",
                  "الخدمات والمنفذين",
                  "أوقات العمل",
                ].map((label, i) => {
                  const active = step === i + 1;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 text-sm ${
                        active
                          ? "text-green-600 font-semibold"
                          : "text-gray-400"
                      }`}
                    >
                      {active ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                      {label}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 leading-relaxed">
                💡 كلما كانت البيانات أوضح، زادت فرصة قبول الحجرة بشكل أسرع
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-8">
          <Accordion
            title="معلومات الحجرة"
            description="البيانات الأساسية التي تظهر للزوار"
            open={step === 1}
            onClick={() => setStep(1)}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Input label="اسم الحجرة" placeholder="مثال: استوديو عُماني" />
              <Select
                label="نوع الخدمة"
                options={["تصميم", "تصوير", "تسويق", "برمجة"]}
              />
              <div className="lg:col-span-2">
                <Textarea
                  label="نبذة عن الحجرة"
                  placeholder="اكتب وصفاً واضحاً عن خدماتك"
                />
              </div>
              <FileUpload label="صورة الغلاف" />
            </div>

            <Footer>
              <PrimaryButton onClick={() => setStep(2)}>
                حفظ والمتابعة
              </PrimaryButton>
            </Footer>
          </Accordion>

          <Accordion
            title="الخدمات والمنفذين"
            description="إضافة الخدمات وأعضاء الفريق"
            open={step === 2}
            onClick={() => setStep(2)}
          >
            <SectionTitle>الخدمات</SectionTitle>

            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="اسم الخدمة" />
                <Input label="السعر (ر.ع)" />
                <Input label="مدة التنفيذ" />
                <Textarea label="وصف الخدمة" />
              </div>
            </Card>

            <SecondaryButton>
              <Plus className="w-4 h-4" />
              إضافة خدمة
            </SecondaryButton>

            <SectionTitle>المنفذون</SectionTitle>

            <Card>
              <Input label="اسم العضو" />
              <Textarea label="نبذة قصيرة" />
              <FileUpload label="الصورة الشخصية" />
            </Card>

            <Footer>
              <GhostButton onClick={() => setStep(1)}>السابق</GhostButton>
              <PrimaryButton onClick={() => setStep(3)}>
                التالي
              </PrimaryButton>
            </Footer>
          </Accordion>

          <Accordion
            title="أوقات العمل"
            description="تحديد أوقات الحجز المتاحة"
            open={step === 3}
            onClick={() => setStep(3)}
          >
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="اليوم"
                  options={[
                    "السبت",
                    "الأحد",
                    "الاثنين",
                    "الثلاثاء",
                    "الأربعاء",
                    "الخميس",
                  ]}
                />
                <Input label="من" placeholder="09:00" />
                <Input label="إلى" placeholder="17:00" />
              </div>
            </Card>

            <SecondaryButton>
              <Plus className="w-4 h-4" />
              إضافة وقت
            </SecondaryButton>

            <Footer>
              <GhostButton onClick={() => setStep(2)}>السابق</GhostButton>
              <PrimaryButton>إرسال الطلب</PrimaryButton>
            </Footer>
          </Accordion>
        </main>
      </div>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function Accordion({ title, description, open, onClick, children }: any) {
  return (
    <div
      className={`shadow rounded-2xl bg-white transition overflow-hidden ${
        open ? "shadow-green-100 bg-green-50/40" : "shadow-gray-200"
      }`}
    >
      <button
        onClick={onClick}
        className="w-full p-6 flex items-center justify-between text-right hover:bg-gray-50 transition"
      >
        <div>
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold">
            {title}
          </h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            {description}
          </p>
        </div>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>

      <div
        className={`grid transition-all duration-500 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden px-6 pb-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}

const Input = ({ label, ...props }: any) => (
  <div>
    <label className="text-sm md:text-base font-medium">{label}</label>
    <input
      {...props}
      className="mt-1 w-full rounded-xl border px-3 py-2
      focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
    />
  </div>
);

const Textarea = ({ label, ...props }: any) => (
  <div>
    <label className="text-sm md:text-base font-medium">{label}</label>
    <textarea
      {...props}
      rows={4}
      className="mt-1 w-full rounded-xl border px-3 py-2
      focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
    />
  </div>
);

const Select = ({ label, options }: any) => (
  <div>
    <label className="text-sm md:text-base font-medium">{label}</label>
    <select className="mt-1 w-full rounded-xl border px-3 py-2">
      <option value="">اختر</option>
      {options.map((o: string) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

const FileUpload = ({ label }: any) => (
  <div>
    <label className="text-sm md:text-base font-medium">{label}</label>
    <div className="mt-1 flex items-center gap-2 border rounded-xl px-4 py-3 hover:bg-gray-50 transition cursor-pointer">
      <Upload className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-500">رفع ملف</span>
    </div>
  </div>
);

const Card = ({ children }: any) => (
  <div className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition">
    {children}
  </div>
);

const SectionTitle = ({ children }: any) => (
  <h3 className="text-lg md:text-xl font-semibold text-gray-900">
    {children}
  </h3>
);

const Footer = ({ children }: any) => (
  <div className="flex justify-between items-center pt-4">
    {children}
  </div>
);

const PrimaryButton = ({ children, ...props }: any) => (
  <button
    {...props}
    className="px-6 py-2 rounded-xl bg-green-600 text-white
    hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition"
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, ...props }: any) => (
  <button
    {...props}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border
    hover:bg-gray-50 transition"
  >
    {children}
  </button>
);

const GhostButton = ({ children, ...props }: any) => (
  <button
    {...props}
    className="text-gray-600 hover:text-gray-900 transition"
  >
    {children}
  </button>
);
