import Container from '@/components/shared/Container'
import SpaceSignBoard from '@/assets/svg/SpaceSignBoard'
import useTranslation from '@/utils/hooks/useTranslation'

const AccessDenied = () => {
    const { t } = useTranslation()
    return (
        <Container className="h-full">
            <div className="h-full flex flex-col items-center justify-center">
                <SpaceSignBoard height={280} width={280} />
                <div className="mt-10 text-center">
                    <h3 className="mb-2">{t('accessDenied.title')}</h3>
                    <p className="text-base">
                        {t('accessDenied.message')}
                    </p>
                </div>
            </div>
        </Container>
    )
}

export default AccessDenied
