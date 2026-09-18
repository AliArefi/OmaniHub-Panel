import { useMemo } from 'react'
import Avatar from '@/components/ui/Avatar'
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

    const selectLangFlag = useMemo(() => {
        return localeMetadata[locale]?.flag
    }, [locale])

    const selectedLanguage = (
        <div className={classNames(className, 'flex items-center')}>
            <Avatar
                size={24}
                shape="circle"
                src={`/img/countries/${selectLangFlag}.png`}
            />
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
                        <Avatar
                            size={18}
                            shape="circle"
                            src={`/img/countries/${metadata.flag}.png`}
                        />
                        <span className="ltr:ml-2 rtl:mr-2">{t(metadata.labelKey)}</span>
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
