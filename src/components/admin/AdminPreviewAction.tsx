import Tooltip from '@/components/ui/Tooltip'
import { TbExternalLink } from 'react-icons/tb'

type AdminPreviewActionProps = {
    slug: string
    label: string
}

const PUBLIC_SITE_URL = (
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ??
    'https://omanihub.com'
).replace(/\/+$/, '')

const AdminPreviewAction = ({ slug, label }: AdminPreviewActionProps) => {
    const previewUrl = `${PUBLIC_SITE_URL}/en/${encodeURIComponent(slug)}`

    return (
        <Tooltip title={`Preview ${label}`}>
            <a
                aria-label={`Preview ${label}`}
                className="text-lg text-sky-600 hover:text-sky-700"
                href={previewUrl}
                rel="noopener noreferrer"
                target="_blank"
            >
                <TbExternalLink />
            </a>
        </Tooltip>
    )
}

export default AdminPreviewAction
