import { Card, Spinner, toast } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import { TimeLineCreateCenter } from './TimeLineCreateCenter'
import { useEffect, useMemo, useState } from 'react'
import { ProgressCreatingCenter } from './ProgressCreatingCenter'
import { HojraInformation } from './steps/HojraInformations'
import { HojraServices } from './steps/HojraServices'
import {
    CreateStoreProvider,
    type HojraInfo,
    type NewHojraData,
    type ServiceItem,
} from '@/context/createStoreContext'
import { HojraAssignServices } from './steps/HojraAssignServices'
import { HojraSummary } from './steps/HojraSummary'
import { apiGetMyAgency, apiGetMyServices } from '@/services/CenterService'
import { useParams } from 'react-router'
import { HojraExtraInformations } from './steps/HojraExtraInformations'
import { HojraGallery } from './steps/HojraGallery'

export default function CreateStoreWizard() {
    const [step, setStep] = useState<number>(1);
    const { agencySlug } = useParams()

    const [isBootstrapping, setIsBootstrapping] = useState(false)
    const [bootstrapError, setBootstrapError] = useState<string | null>(null)
    const [initialHojraInfo, setInitialHojraInfo] = useState<
        Partial<HojraInfo> | undefined
    >(undefined)
    const [initialNewHojraData, setInitialNewHojraData] = useState<
        Partial<NewHojraData> | undefined
    >(undefined)
    const [initialServices, setInitialServices] = useState<
        ServiceItem[] | undefined
    >(undefined)

    const isEditMode = useMemo(() => {
        return typeof agencySlug === 'string' && agencySlug.trim() !== ''
    }, [agencySlug])

    useEffect(() => {
        if (!isEditMode) return

        let isMounted = true
        setIsBootstrapping(true)
        setBootstrapError(null)

        Promise.resolve()
            .then(async () => {
                const agencyResponse = await apiGetMyAgency(agencySlug as string)
                const agency = agencyResponse.data

                if (!agency || typeof agency !== 'object') {
                    throw new Error('Invalid center response.')
                }

                const hojraInfo: Partial<HojraInfo> = {
                    title: agency.title,
                    service_id: agency.service?.id ?? null,
                    about_text: agency.about_text ?? '',
                }

                const newHojra: Partial<NewHojraData> = {
                    id: agency.id,
                    slug: agencySlug as string,
                }

                const servicesResp = await apiGetMyServices({
                    agency_id: agency.id,
                    per_page: 200,
                })

                const mappedServices: ServiceItem[] = (servicesResp.data ?? [])
                    .map((s) => {
                        const serviceId = s.service?.id ?? 0
                        return {
                            id: s.id,
                            serviceId,
                            serviceLabel:
                                s.title ||
                                s.service?.name ||
                                s.slug ||
                                String(s.id),
                            duration: Number(s.estimate_time ?? 0),
                            price: Number(s.price ?? 0),
                            description: s.body ?? '',
                        }
                    })
                    .filter((s) => s.serviceId > 0)

                if (!isMounted) return
                setInitialHojraInfo(hojraInfo)
                setInitialNewHojraData(newHojra)
                setInitialServices(mappedServices)
            })
            .catch((err: unknown) => {
                if (!isMounted) return
                const message =
                    err instanceof Error
                        ? err.message
                        : 'حدث خطأ أثناء تحميل بيانات المركز'
                setBootstrapError(message)
                toast.push(
                    <Notification type="danger">{message}</Notification>,
                )
            })
            .finally(() => {
                if (!isMounted) return
                setIsBootstrapping(false)
            })

        return () => {
            isMounted = false
        }
    }, [agencySlug, isEditMode])

    if (isEditMode && (isBootstrapping || bootstrapError)) {
        if (bootstrapError) {
            return <div>{bootstrapError}</div>
        }

        return (
            <div className="w-full text-center flex items-center justify-center flex-col">
                <Spinner />
            </div>
        )
    }

    return (
        <CreateStoreProvider
            initialHojraInfo={initialHojraInfo}
            initialNewHojraData={initialNewHojraData}
            initialServices={initialServices}
        >
            <div className="grid lg:grid-cols-4 gap-4">
                <div>
                    <Card>
                        <TimeLineCreateCenter step={step} />
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    {step === 1 && (
                        <HojraInformation changeState={(state) => setStep(state)} />
                    )}
                    {step === 2 && (
                        <HojraExtraInformations changeState={(state) => setStep(state)} />
                    )}
                    {step === 3 && (
                        <HojraGallery changeState={(state) => setStep(state)} />
                    )}
                    {step === 4 && (
                        <HojraServices changeState={(state) => setStep(state)} />
                    )}
                    {step === 5 && (
                        <HojraAssignServices changeState={(state) => setStep(state)} />
                    )}
                    {step === 6 && (
                        <HojraSummary changeState={(state) => setStep(state)} />
                    )}
                </div>
                <div className="w-full">
                    <ProgressCreatingCenter step={step} />
                </div>
            </div>
        </CreateStoreProvider>
    );
}
