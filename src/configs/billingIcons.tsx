import {
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    CalendarCheck,
    ChartNoAxesCombined,
    Crown,
    Gem,
    HandHeart,
    MessageCircle,
    Rocket,
    ShieldCheck,
    Sparkles,
    Star,
    Store,
    Users,
    Zap,
    type LucideIcon,
} from 'lucide-react'

export const billingIconMap = {
    'badge-check': BadgeCheck,
    briefcase: BriefcaseBusiness,
    building: Building2,
    'calendar-check': CalendarCheck,
    chart: ChartNoAxesCombined,
    crown: Crown,
    gem: Gem,
    'heart-handshake': HandHeart,
    'message-circle': MessageCircle,
    rocket: Rocket,
    'shield-check': ShieldCheck,
    sparkles: Sparkles,
    star: Star,
    store: Store,
    users: Users,
    zap: Zap,
} satisfies Record<string, LucideIcon>

export type BillingIconName = keyof typeof billingIconMap

export const billingIconNames = Object.keys(billingIconMap) as BillingIconName[]

export const getBillingIcon = (name?: string | null): LucideIcon =>
    billingIconMap[name as BillingIconName] || Sparkles
