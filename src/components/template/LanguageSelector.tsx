import { useMemo } from 'react'
import Dropdown from '@/components/ui/Dropdown'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useLocaleStore } from '@/store/localeStore'
import { localeMetadata, supportedLocales } from '@/locales'
import useTranslation from '@/utils/hooks/useTranslation'
import { HiCheck } from 'react-icons/hi'
import type { CommonProps } from '@/@types/common'

const _LanguageSelector = ({ className }: CommonProps) => {
    const { t } = useTranslation()
    const { currentLang: locale, setLang } = useLocaleStore((state) => state)

    const selectName = useMemo(() => {
        return localeMetadata[locale]?.name
    }, [locale])

    const selectedLanguage = (
        <div className={classNames(className, 'flex items-center')}>
            <span>{(selectName)}</span>
        </div>
    )

    return (
        <Dropdown renderTitle={selectedLanguage} placement="bottom-end">
            {supportedLocales.map((language) => {
                const metadata = localeMetadata[language]
                return (
                    <Dropdown.Item
                        key={language}
                        className="justify-between"
                        eventKey={language}
                        onClick={() => setLang(language)}
                    >
                        <span className="flex items-center">

                            <span>{t(metadata.labelKey)}</span>
                        </span>
                        {locale === language && (
                            <HiCheck className="text-emerald-500 text-lg" />
                        )}
                    </Dropdown.Item>
                )
            })}
        </Dropdown>
    )
}

const LanguageSelector = withHeaderItem(_LanguageSelector)

export default LanguageSelector
