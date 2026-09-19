import Dialog from '@/components/ui/Dialog'
import classNames from 'classnames'
import { HiCheck } from 'react-icons/hi'
import { useLocaleStore } from '@/store/localeStore'
import { localeMetadata, supportedLocales } from '@/locales'
import useTranslation from '@/utils/hooks/useTranslation'

type LanguageDialogProps = {
    isOpen: boolean
    onClose: () => void
}

const LanguageDialog = ({ isOpen, onClose }: LanguageDialogProps) => {
    const { t } = useTranslation()
    const { currentLang: locale, setLang } = useLocaleStore((state) => state)

    const handleSelect = (language: (typeof supportedLocales)[number]) => {
        setLang(language)
        onClose()
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={360}
            onClose={onClose}
            onRequestClose={onClose}
        >
            <h5 className="mb-4">{t('shared.userMenu.language')}</h5>
            <div className="flex flex-col gap-1">
                {supportedLocales.map((language) => {
                    const metadata = localeMetadata[language]
                    const active = locale === language
                    return (
                        <button
                            key={language}
                            type="button"
                            onClick={() => handleSelect(language)}
                            className={classNames(
                                'flex items-center justify-between w-full px-3 py-3 rounded-lg text-start',
                                'hover:bg-gray-100 dark:hover:bg-gray-700',
                                active && 'bg-gray-50 dark:bg-gray-700/60 font-semibold',
                            )}
                        >
                            <span>{t(metadata.labelKey)}</span>
                            {active && (
                                <HiCheck className="text-emerald-500 text-lg" />
                            )}
                        </button>
                    )
                })}
            </div>
        </Dialog>
    )
}

export default LanguageDialog