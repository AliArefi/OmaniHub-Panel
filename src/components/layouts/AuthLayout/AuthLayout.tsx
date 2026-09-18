import { useMemo, lazy } from 'react'
import type { CommonProps } from '@/@types/common'
import type { LazyExoticComponent, JSX } from 'react'
import LanguageSelector from '@/components/template/LanguageSelector'

type LayoutType = 'simple' | 'split' | 'side'

type Layouts = Record<
    LayoutType,
    LazyExoticComponent<<T extends CommonProps>(props: T) => JSX.Element>
>

const currentLayoutType: LayoutType = 'side'

const layouts: Layouts = {
    simple: lazy(() => import('./Simple')),
    split: lazy(() => import('./Split')),
    side: lazy(() => import('./Side')),
}

const AuthLayout = ({ children }: CommonProps) => {
    const Layout = useMemo(() => {
        return layouts[currentLayoutType]
    }, [])

    return (
        <div className="relative h-full">
            <div className="absolute end-4 top-4 z-10">
                <LanguageSelector hoverable={false} />
            </div>
            <Layout>{children}</Layout>
        </div>
    )
}

export default AuthLayout
