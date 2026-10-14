export async function setup(page) {
    const policy = { otp: {
        enabled: true, login_flow_mode: 'required', registration_flow_mode: 'required', recovery_flow_mode: 'required',
        code_length: 6, resend_cooldown_seconds: 0, expires_in_seconds: 600, static_code_hint: null,
        default_auth_identifier_mode: 'mobile_first', allow_email_identifier_fallback: true,
        login_otp_channel_policy: 'auto', registration_otp_channel_policy: 'auto', recovery_otp_channel_policy: 'auto',
        login_method: 'otp_only', allow_email_fallback: true, registration_password_required: false,
    }, oauth: { google_client_id: null } }
    let purpose = 'login'
    const user = { id: 99999, name: 'OTP browser test', email: 'test@example.test', avatar: null, roles: [], permissions: [] }
    const challenge = () => ({
        success: true, message: 'Test verification pending', challenge_id: '11111111-1111-4111-8111-111111111111',
        next_step: 'otp_verify', expires_at: new Date(Date.now() + 600000).toISOString(), user: null, token: null,
        meta: { purpose, channel: 'whatsapp', identifier: '***3450', resend_available_at: new Date().toISOString() },
    })
    await page.route('**/api/1/**', async (route) => {
        const path = new URL(route.request().url()).pathname
        let body = { data: [] }
        if (path.endsWith('/auth/config')) body = policy
        else if (path.endsWith('/auth/me')) body = { authenticated: false, user: null }
        else if (path.endsWith('/auth/login') || path.endsWith('/auth/register')) {
            purpose = path.endsWith('/register') ? 'register' : 'login'
            body = challenge()
        } else if (path.endsWith('/auth/recovery/start')) {
            purpose = 'recovery'
            body = challenge()
        } else if (path.endsWith('/auth/otp/email-fallback')) {
            body = challenge()
            body.meta.channel = 'email'
            body.meta.identifier = 't***@example.test'
        } else if (path.endsWith('/auth/otp/resend')) body = challenge()
        else if (path.endsWith('/auth/otp/verify')) {
            body = purpose === 'recovery'
                ? { ...challenge(), next_step: 'reset_password', meta: { purpose, reset_grant: 'a'.repeat(64) } }
                : { ...challenge(), next_step: 'authenticated', token: 'browser-test-token', user }
        } else if (path.endsWith('/auth/recovery/reset')) body = { success: true }
        const options = route.request().method() === 'OPTIONS'
        await route.fulfill({
            status: options ? 204 : 200, contentType: 'application/json',
            headers: {
                'access-control-allow-origin': 'http://127.0.0.1:5190', 'access-control-allow-credentials': 'true',
                'access-control-allow-headers': 'authorization,content-type,x-requested-with,x-csrf-token',
                'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
            },
            body: options ? '' : JSON.stringify(body),
        })
    })
    await page.goto('http://127.0.0.1:5190/sign-in')
    await page.waitForSelector('input[type=radio]')
    return { url: page.url(), radioCount: await page.locator('input[type=radio]').count(), passwordCount: await page.locator('input[type=password]').count() }
}
