import ConfigProvider from '@/components/ui/ConfigProvider'
import { themeConfig } from '@/configs/theme.config'
import useDarkMode from '@/utils/hooks/useDarkMode'
import useThemeSchema from '@/utils/hooks/useThemeSchema'
import useLocale from '@/utils/hooks/useLocale'
import useDirection from '@/utils/hooks/useDirection'
import { useThemeStore } from '@/store/themeStore'
import { MODE_DARK, MODE_LIGHT } from '@/constants/theme.constant'
import type { CommonProps } from '@/@types/common'
import type { Direction } from '@/@types/theme'
import { useEffect } from 'react'
import { localeMetadata } from '@/locales'

const Theme = (props: CommonProps) => {
    useThemeSchema()
    const [isDarkMode] = useDarkMode()
    const [direction] = useDirection();

    const { locale } = useLocale()

    useEffect(() => {
        const nextDirection: Direction =
            localeMetadata[locale]?.direction ?? themeConfig.direction
        if (direction !== nextDirection) {
            useThemeStore.getState().setDirection(nextDirection)
        }
    }, [locale, direction])

    return (
        <ConfigProvider
            value={{
                locale: locale,
                ...themeConfig,
                direction,
                mode: isDarkMode ? MODE_DARK : MODE_LIGHT,
            }}
        >
            {props.children}
        </ConfigProvider>
    )
}

export default Theme
