import { useParams } from 'react-router'
import SettingsLayout from './SettingsLayout'
import PerLocaleSettingsGroupPage from './PerLocaleSettingsGroupPage'
import AgencyWorkflowSettings from './AgencyWorkflowSettings'
import OtpSettings from './OtpSettings'
import NotificationSettings from './NotificationSettings'

const PER_LOCALE_GROUPS = new Set([
    'general',
    'contact-us',
    'about-us',
    'about',
    'faq',
    'store',
])

const SettingsGroupPage = (): React.JSX.Element => {
    const { group } = useParams<{ group: string }>()

    let content: React.ReactNode = null
    if (group && PER_LOCALE_GROUPS.has(group)) {
        content = <PerLocaleSettingsGroupPage />
    } else if (group === 'agency-workflow') {
        content = <AgencyWorkflowSettings />
    } else if (group === 'otp') {
        content = <OtpSettings />
    } else if (group === 'notifications') {
        content = <NotificationSettings />
    }

    return <SettingsLayout>{content}</SettingsLayout>
}

export default SettingsGroupPage
