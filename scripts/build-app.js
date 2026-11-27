#!/usr/bin/env node
// Uygulama (Capacitor) için ekran dosyalarını hazırlar.
// Kullanım: node scripts/build-app.js --server https://oyna.yudoba.com [--invite https://oyna.yudoba.com] [--out app/www]
const fs = require("fs");
const path = require("path");
const { engineBundle } = require("../src/engine-bundle");

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const server = arg("server");
if (!server) { console.error("Sunucu adresi gerekli: --server https://..."); process.exit(1); }
const invite = arg("invite", server);
const root = path.join(__dirname, "..");
const out = path.resolve(root, arg("out", "app/www"));
const pub = path.join(root, "public");

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
// Tarayıcıya özel dosyalar uygulamaya girmez
const SKIP = new Set(["sw.js", "boot.html", "manifest.json"]);
(function copy(src, dst) {
  for (const f of fs.readdirSync(src)) {
    if (SKIP.has(f)) continue;
    const a = path.join(src, f), b = path.join(dst, f);
    if (fs.statSync(a).isDirectory()) { fs.mkdirSync(b, { recursive: true }); copy(a, b); }
    else fs.copyFileSync(a, b);
  }
})(pub, out);

fs.writeFileSync(path.join(out, "engine.js"), engineBundle());
fs.copyFileSync(path.join(path.dirname(require.resolve("socket.io")), "..", "client-dist", "socket.io.min.js"), path.join(out, "socket.io.min.js"));
fs.writeFileSync(path.join(out, "config.js"),
  "window.DAPAI_CFG = " + JSON.stringify({ app: true, server, inviteBase: invite }) + ";\n");

let html = fs.readFileSync(path.join(pub, "index.html"), "utf8");
html = html.replace('<script src="/socket.io/socket.io.js"></script>', '<script src="/config.js"></script>\n  <script src="/socket.io.min.js"></script>')
  .replace(/\?v=\d+/g, "")
  .replace(/\s*<link rel="manifest"[^>]*>/, "");
if (!html.includes("/config.js")) { console.error("index.html beklenen yapıda değil"); process.exit(1); }
fs.writeFileSync(path.join(out, "index.html"), html);
const v = (fs.readFileSync(path.join(root, "VERSION.txt"), "utf8") || "").trim();
console.log("Hazır: " + path.relative(root, out) + " (" + v + ", sunucu " + server + ")");
