import { Button } from "@/components/ui";
import {
    Briefcase,
    Wallet,
    Users,
    TrendingUp,
    Star,
    CheckCircle,
    Clock,
    XCircle,
} from "lucide-react";

export default function Home() {
    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">
                    لوحة تحكم الحجرة
                </h1>
                <p className="text-gray-500">
                    إدارة خدماتك، متابعة الطلبات، وتحليل الأداء في منصة عُماني هاب
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <KpiCard
                    title="الخدمات النشطة"
                    value="8"
                    icon={<Briefcase />}
                    trend="+2 هذا الشهر"
                    color="blue"
                />
                <KpiCard
                    title="إجمالي الإيرادات"
                    value="1,240 ریال"
                    icon={<Wallet />}
                    trend="+18%"
                    color="emerald"
                />
                <KpiCard
                    title="العملاء"
                    value="96"
                    icon={<Users />}
                    trend="+12 عميل"
                    color="indigo"
                />
                <KpiCard
                    title="التقييم"
                    value="4.8 / 5"
                    icon={<Star />}
                    trend="تقييم ممتاز"
                    color="amber"
                />
            </div>

            {/* Orders Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <OrderStatus
                    title="طلبات مكتملة"
                    value="96"
                    icon={<CheckCircle />}
                    color="green"
                />
                <OrderStatus
                    title="قيد التنفيذ"
                    value="18"
                    icon={<Clock />}
                    color="orange"
                />
                <OrderStatus
                    title="ملغاة"
                    value="10"
                    icon={<XCircle />}
                    color="red"
                />
            </div>

            {/* Services Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                <div className="p-6 flex items-center justify-between border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                        قائمة الخدمات
                    </h2>
                    
                    <Button> إضافة خدمة جديدة</Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-6 py-4 font-medium">الخدمة</th>
                                <th className="px-6 py-4 font-medium">السعر</th>
                                <th className="px-6 py-4 font-medium">الطلبات</th>
                                <th className="px-6 py-4 font-medium">التقييم</th>
                                <th className="px-6 py-4 font-medium">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            <ServiceRow
                                name="تصميم متجر إلكتروني"
                                price="120 ریال"
                                orders="34"
                                rating="4.9"
                                status="نشطة"
                            />
                            <ServiceRow
                                name="إدارة حسابات التواصل"
                                price="80 ریال"
                                orders="21"
                                rating="4.7"
                                status="نشطة"
                            />
                            <ServiceRow
                                name="تصوير منتجات"
                                price="60 ریال"
                                orders="12"
                                rating="4.3"
                                status="موقوفة"
                            />
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Performance Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-green-900 p-8 text-white">
                <div className="relative z-10 max-w-xl">
                    <h3 className="text-2xl font-bold mb-2 text-green-950">
                        أداء ممتاز هذا الشهر 
                    </h3>
                    <p className="leading-relaxed text-white">
                        خدماتك تحقق نمواً مستمراً، استمر في تقديم جودة عالية
                        لزيادة الطلبات وتحسين تقييم العملاء.
                    </p>
                </div>
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </div>
        </div>
    );
}

/* ================= Components ================= */

function KpiCard({
    title,
    value,
    icon,
    trend,
    color,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend: string;
    color: "blue" | "emerald" | "indigo" | "amber";
}) {
    const colors: any = {
        blue: "bg-blue-100 text-blue-600",
        emerald: "bg-emerald-100 text-emerald-600",
        indigo: "bg-indigo-100 text-indigo-600",
        amber: "bg-amber-100 text-amber-600",
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-base text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">{trend}</p>
        </div>
    );
}

function OrderStatus({
    title,
    value,
    icon,
    color,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function ServiceRow({
    name,
    price,
    orders,
    rating,
    status,
}: {
    name: string;
    price: string;
    orders: string;
    rating: string;
    status: "نشطة" | "موقوفة";
}) {
    return (
        <tr>
            <td className="px-6 py-4 font-medium text-gray-800">{name}</td>
            <td className="px-6 py-4">{price}</td>
            <td className="px-6 py-4">{orders}</td>
            <td className="px-6 py-4">{rating}</td>
            <td className="px-6 py-4">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium
            ${status === "نشطة"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                >
                    {status}
                </span>
            </td>
        </tr>
    );
}
