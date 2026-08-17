import Spinner from '@/components/ui/Spinner'

type AdminEditLoadingProps = {
    label?: string
}

const AdminEditLoading = ({
    label = 'Loading record...',
}: AdminEditLoadingProps) => {
    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/25 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="flex min-w-56 flex-col items-center gap-4 rounded-xl bg-white px-8 py-6 shadow-2xl dark:bg-gray-800">
                <Spinner size={42} />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {label}
                </span>
            </div>
        </div>
    )
}

export default AdminEditLoading
