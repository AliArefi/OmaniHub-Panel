import { Navigate, Outlet } from 'react-router'
import appConfig from '@/configs/app.config'
import { useAuth } from '@/auth'

const { authenticatedEntryPath } = appConfig

const PublicRoute = () => {
    const { authenticated } = useAuth()

    if (authenticated && location.pathname !== '/auth') {
        return <Navigate to={authenticatedEntryPath} />
    }

    return <Outlet />
}

export default PublicRoute
