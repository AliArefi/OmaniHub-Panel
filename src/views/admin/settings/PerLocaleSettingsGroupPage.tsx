import { useParams } from 'react-router'
import PerLocaleSettingsForm from './PerLocaleSettingsForm'
import type { SettingsFieldDescriptor } from './PerLocaleSettingsForm'
import type { PerLocaleSettingsGroup } from '@/services/admin/AdminSettingsService'

const FIELDS: Record<PerLocaleSettingsGroup, { title: string; fields: SettingsFieldDescriptor[] }> = {
    general: {
        title: 'General settings',
        fields: [
            { name: 'home_title', label: 'Home title' },
            { name: 'home_h1', label: 'Home H1' },
            { name: 'main_nav_title', label: 'Main nav title' },
            { name: 'home_canonical', label: 'Home canonical URL', type: 'url' },
            { name: 'home_meta_description', label: 'Home meta description', type: 'textarea' },
            { name: 'header_logo', label: 'Header logo', type: 'file' },
            { name: 'footer_logo', label: 'Footer logo', type: 'file' },
            { name: 'header_email', label: 'Header email', type: 'email' },
            { name: 'footer_phone', label: 'Footer phone' },
            { name: 'footer_phone2', label: 'Footer phone 2' },
            { name: 'footer_email', label: 'Footer email', type: 'email' },
            { name: 'footer_address', label: 'Footer address' },
            { name: 'footer_under_logo_text', label: 'Footer under-logo text', type: 'textarea' },
            { name: 'footer_copyright', label: 'Footer copyright', type: 'textarea' },
            { name: 'twitter', label: 'Twitter URL', type: 'url' },
            { name: 'linkedin', label: 'LinkedIn URL', type: 'url' },
            { name: 'instagram', label: 'Instagram URL', type: 'url' },
            { name: 'whatsapp', label: 'WhatsApp number' },
            { name: 'ios_app', label: 'iOS app URL', type: 'url' },
            { name: 'android_app', label: 'Android app URL', type: 'url' },
        ],
    },
    'contact-us': {
        title: 'Contact us page',
        fields: [
            { name: 'title', label: 'Title' },
            { name: 'h1', label: 'H1' },
            { name: 'map', label: 'Map embed', type: 'textarea' },
        ],
    },
    'about-us': {
        title: 'About us (landing)',
        fields: [
            { name: 'title', label: 'Title' },
            { name: 'h1', label: 'H1' },
            { name: 'h2', label: 'H2' },
            { name: 'body', label: 'Body', type: 'textarea', rows: 6 },
        ],
    },
    about: {
        title: 'About page',
        fields: [
            { name: 'title', label: 'Title' },
            { name: 'description', label: 'Description', type: 'textarea', rows: 6 },
            { name: 'image', label: 'Image', type: 'file' },
            { name: 'item1_title', label: 'Item 1 title' },
            { name: 'item1_desc', label: 'Item 1 description' },
            { name: 'item2_title', label: 'Item 2 title' },
            { name: 'item2_desc', label: 'Item 2 description' },
            { name: 'item3_title', label: 'Item 3 title' },
            { name: 'item3_desc', label: 'Item 3 description' },
            { name: 'item4_title', label: 'Item 4 title' },
            { name: 'item4_desc', label: 'Item 4 description' },
        ],
    },
    faq: {
        title: 'Home FAQ',
        fields: [
            { name: 'up_title', label: 'Up title' },
            { name: 'title', label: 'Title' },
            { name: 'description', label: 'Description', type: 'textarea', rows: 6 },
            { name: 'image', label: 'Image', type: 'file' },
            { name: 'btn', label: 'Button text' },
            { name: 'btn_url', label: 'Button URL', type: 'url' },
        ],
    },
    store: {
        title: 'Store settings',
        fields: [
            { name: 'slider', label: 'Slider image', type: 'file' },
            { name: 'about_image', label: 'About image', type: 'file' },
            { name: 'agree_text', label: 'Agreement text', type: 'textarea' },
        ],
    },
}

const PerLocaleSettingsGroupPage = () => {
    const { group } = useParams<{ group: PerLocaleSettingsGroup }>()
    const config = group ? FIELDS[group] : undefined

    if (!config) return null

    return (
        <PerLocaleSettingsForm
            group={group as PerLocaleSettingsGroup}
            title={config.title}
            fields={config.fields}
        />
    )
}

export default PerLocaleSettingsGroupPage
