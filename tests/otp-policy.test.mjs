import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({ entryPoints: ['src/utils/authIdentity.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
const { identityPayload, safeAuthReturnPath } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)

test('phone payload normalizes international and Arabic/Persian digits', () => {
    assert.deepEqual(identityPayload({ mode: 'phone', countryCode: '+968', localNumber: '۹۱۲۳ ۴۵۶۷', email: 'ignored@example.test' }), { mobile: '+96891234567' })
})

test('explicit email mode does not send a stale phone', () => {
    assert.deepEqual(identityPayload({ mode: 'email', countryCode: '+968', localNumber: '91234567', email: ' user@example.test ' }), { email: 'user@example.test' })
})

test('website handoff survives only safe relative return paths', () => {
    const handoff = '/auth?redirect_uri=https%3A%2F%2Fomanihub.com%2Fcallback&return_to=https%3A%2F%2Fomanihub.com'
    assert.equal(safeAuthReturnPath(handoff), handoff)
    for (const value of ['https://evil.test', '//evil.test', '/\\evil.test', '/%2f%2fevil.test', '/%5cevil.test', 'javascript:alert(1)', '/%zz']) {
        assert.equal(safeAuthReturnPath(value), undefined)
    }
    assert.equal(safeAuthReturnPath('/'+String.fromCharCode(0)), undefined)
})
