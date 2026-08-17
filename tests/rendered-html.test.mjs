import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept:"text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status:404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renderiza a landing Thenees aprovada", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<title>Thenees — Community Operating System<\/title>/);
  assert.match(html, /EU JOGO\./);
  assert.match(html, /INTERAGEM\./);
  assert.match(html, /FUNCIONA\./);
  assert.match(html, /id="live"/);
  assert.match(html, /AGENDA DE TRANSMISSÕES/);
  assert.match(html, /id="comunidade"/);
  assert.match(html, /id="parcerias"/);
  assert.match(html, /class="partner-showcase"/);
  assert.match(html, /NVIDIA/);
  assert.match(html, /AMD/);
  assert.match(html, /SAMSUNG/);
  assert.match(html, /FIFINE/);
  assert.match(html, /class="site-footer"/);
  assert.match(html, /class="footer-local"/);
  assert.match(html, /SANTOS \/ SÃO PAULO · BRT \/ UTC−03/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|Building your site/i);
});

test("mantém o produto livre do starter descartado", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /EU JOGO\./);
  assert.match(page, /VOCÊS/);
  assert.match(page, /INTERAGEM\./);
  assert.match(layout, /Thenees — Community Operating System/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.deepEqual(await readdir(new URL("../app/_sites-preview", import.meta.url)), []);
});
