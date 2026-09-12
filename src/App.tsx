import { BrowserRouter } from 'react-router'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import Views from '@/views'
import appConfig from './configs/app.config'
import AnalyticsRouteTracker from '@/components/analytics/AnalyticsRouteTracker'
import InstallAppPrompt from '@/components/template/InstallAppPrompt'

if (appConfig.enableMock) {
    import('./mock')
}

function App() {
    return (
        <Theme>
            <BrowserRouter>
                <AnalyticsRouteTracker />
                <AuthProvider>
                    <Layout>
                        <Views />
                    </Layout>
                    <InstallAppPrompt />
                </AuthProvider>
            </BrowserRouter>
        </Theme>
    )
}

export default App
