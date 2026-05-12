import type { MyAgencyService, Services } from '@/@types/center'
import type { ServiceItem } from '@/context/createStoreContext'
import { formatDurationLabel, type DurationUnit } from './duration'

export type ServiceNode = {
    id: number
    name: string
    slug: string | null
    children?: ServiceNode[]
}

export type SelectOption = {
    value: number
    label: string
}

export type DemoCatalogItem = {
    serviceId: number
    label: string
}

export const resolveServiceNodes = (response: unknown): ServiceNode[] => {
    if (!response || typeof response !== 'object') {
        return []
    }

    const payload = response as { data?: unknown }
    const data = payload.data ?? response

    return Array.isArray(data) ? (data as ServiceNode[]) : []
}

export const flattenServiceTree = (
    nodes: ServiceNode[],
    parents: string[] = [],
): DemoCatalogItem[] => {
    return nodes.flatMap((node) => {
        const path = [...parents, node.name]
        const current: DemoCatalogItem = {
            serviceId: node.id,
            label: path.join(' / '),
        }

        return [current, ...flattenServiceTree(node.children ?? [], path)]
    })
}

export const mapAgencyServiceToStoreItem = (
    service: MyAgencyService,
): ServiceItem => ({
    id: service.id,
    serviceId: service.service?.id ?? 0,
    serviceLabel:
        service.title ||
        service.service?.name ||
        service.slug ||
        String(service.id),
    duration: Number(service.estimate_time ?? 0),
    durationUnit: (service.duration_unit ?? 'minute') as DurationUnit,
    durationLabel:
        service.duration_label ||
        formatDurationLabel(
            Number(service.estimate_time ?? 0),
            (service.duration_unit ?? 'minute') as DurationUnit,
        ),
    durationMinutes: Number(service.estimate_time_minutes ?? service.estimate_time ?? 0),
    pricingType: service.pricing_type ?? 'fixed',
    needsCoordination: Boolean(service.needs_coordination),
    price: typeof service.price === 'number' ? service.price : null,
    priceMin: typeof service.price_min === 'number' ? service.price_min : null,
    priceMax: typeof service.price_max === 'number' ? service.price_max : null,
    description: service.body ?? '',
})

export const mapServicesResponseItem = (service: Services): ServiceNode => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    children: Array.isArray(service.children)
        ? service.children.map(mapServicesResponseItem)
        : [],
})
