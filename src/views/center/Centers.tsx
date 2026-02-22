import { Agency } from "@/@types/center";
import { Avatar, Card, Spinner, Table } from "@/components/ui";
import TBody from "@/components/ui/Table/TBody";
import Td from "@/components/ui/Table/Td";
import Th from "@/components/ui/Table/Th";
import THead from "@/components/ui/Table/THead";
import Tr from "@/components/ui/Table/Tr";
import { getMyAgencies } from "@/services/CenterService";
import { useTranslation } from "@/store/useTranslation";
import { useEffect, useState } from "react";

export default function Centers() {

    const [agencies, setAgencies] = useState<Agency[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { t, setLang } = useTranslation()

    useEffect(() => {
        const fetchAgencies = async () => {
            setLoading(true)
            try {
                const resp = await getMyAgencies()
                setAgencies(resp.data)
            } catch (err: any) {
                setError(err?.response?.data?.message || 'خطا در دریافت اطلاعات')
            } finally {
                setLoading(false)
            }
        }

        fetchAgencies()
    }, [])

    if (loading) return <div className="w-full text-center flex items-center justify-center flex-col">
        <Spinner />
        <div>{t('loading')}</div>
    </div>
    if (error) return <div>{error}</div>

    return (
        <>
            <Card>
                <div className="mb-10">
                    <h2 className="mb-2">{t('myAgenciesTitle')}</h2>
                    <p>{t('myAgenciesSubtitle')}</p>
                </div>
                <Table>
                    <THead>
                        <Tr>
                            <Th>{t('myAgenciesHojra')}</Th>
                            <Th>{t('status')}</Th>
                            <Th>{t('operation')}</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {agencies.map((agency) => (
                            <Tr key={agency.id}>
                                <Td>
                                    <div className="flex items-center justify-start gap-2">
                                        <Avatar src={agency.logo} />
                                        <div className="font-bold">{agency.title}</div>
                                    </div>
                                </Td>
                                <Td>{agency.status}</Td>
                                <Td>{agency.id}</Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>

            </Card>
        </>
    )
}
