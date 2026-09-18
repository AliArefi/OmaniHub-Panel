import { Container } from '@/components/shared'
import { Card } from '@/components/ui'
import { FormGeneralSection } from './components/FormGeneralSection'
import useTranslation from '@/utils/hooks/useTranslation'

export default function NewCenter() {
    const { t } = useTranslation()

    return (
        <Container>
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-auto">
                    <Card>
                        <FormGeneralSection />
                    </Card>
                </div>
                <div className="lg:min-w-[400px] 2xl:w-[500px]">
                    <Card>
                        <h4 className="mb-6">{t('centerCreation.newTitle')}</h4>
                        <p>{t('centerCreation.newDescription')}</p>
                    </Card>
                </div>
            </div>
        </Container>
    )
}
