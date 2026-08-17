import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const outputDirectory = resolve('build')
const indexPath = resolve(outputDirectory, 'index.html')
const versionPath = resolve(outputDirectory, 'version.json')
const version = process.env.GITHUB_SHA?.trim() || randomUUID()

const refreshScript = `
<script>
(() => {
  const currentVersion = ${JSON.stringify(version)};
  let checking = false;

  const loadedUrl = new URL(window.location.href);
  if (loadedUrl.searchParams.has('__build')) {
    loadedUrl.searchParams.delete('__build');
    window.history.replaceState({}, '', loadedUrl.toString());
  }

  const checkForUpdate = async () => {
    if (checking) return;
    checking = true;

    try {
      const response = await fetch('/version.json?t=' + Date.now(), {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;

      const payload = await response.json();
      if (payload.version && payload.version !== currentVersion) {
        const url = new URL(window.location.href);
        url.searchParams.set('__build', payload.version);
        window.location.replace(url.toString());
      }
    } catch {
      // A temporary network failure should not interrupt the admin session.
    } finally {
      checking = false;
    }
  };

  checkForUpdate();
  window.setInterval(checkForUpdate, 60_000);
  window.addEventListener('focus', checkForUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
})();
</script>`

const indexHtml = await readFile(indexPath, 'utf8')
if (!indexHtml.includes('</body>')) {
    throw new Error('Unable to stamp build: build/index.html has no closing body tag.')
}

await writeFile(
    indexPath,
    indexHtml.replace('</body>', `${refreshScript}\n</body>`),
    'utf8',
)
await writeFile(
    versionPath,
    `${JSON.stringify({ version, builtAt: new Date().toISOString() })}\n`,
    'utf8',
)
