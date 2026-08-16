import { useMemo } from 'react'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import classNames from 'classnames'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useLocaleStore } from '@/store/localeStore'
import { useThemeStore } from '@/store/themeStore'
import { HiCheck } from 'react-icons/hi'
import type { CommonProps } from '@/@types/common'
import type { Direction } from '@/@types/theme'

const languageList = [
    { label: 'العربية', value: 'ar', flag: 'OM', direction: 'rtl' as Direction },
    { label: 'English', value: 'en', flag: 'US', direction: 'ltr' as Direction },
]

const _LanguageSelector = ({ className }: CommonProps) => {
    const { currentLang: locale, setLang } = useLocaleStore((state) => state)
    const setDirection = useThemeStore((state) => state.setDirection)

    const selectLangFlag = useMemo(() => {
        return languageList.find((lang) => lang.value === locale)?.flag
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
            {languageList.map((lang) => (
                <Dropdown.Item
                    key={lang.label}
                    className="justify-between"
                    eventKey={lang.label}
                    onClick={() => {
                        setLang(lang.value)
                        // Content language and UI direction are decoupled
                        // everywhere else in the app, but the language picker
                        // is the one place a human is explicitly choosing a
                        // language — switching direction to match is expected.
                        setDirection(lang.direction)
                    }}
                >
                    <span className="flex items-center">
                        <Avatar
                            size={18}
                            shape="circle"
                            src={`/img/countries/${lang.flag}.png`}
                        />
                        <span className="ltr:ml-2 rtl:mr-2">{lang.label}</span>
                    </span>
                    {locale === lang.value && (
                        <HiCheck className="text-emerald-500 text-lg" />
                    )}
                </Dropdown.Item>
            ))}
        </Dropdown>
    )
}

const LanguageSelector = withHeaderItem(_LanguageSelector)

export default LanguageSelector
