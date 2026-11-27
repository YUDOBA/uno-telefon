// Oyun motorunu tarayıcı için tek dosya yapar (alıştırma telefonda, sunucusuz çalışır)
const fs = require("fs");
const path = require("path");
function engineBundle() {
  const rd = (f) => fs.readFileSync(path.join(__dirname, f + ".js"), "utf8");
  const mods = ["rules", "engine"].map((n) =>
    "(function () { var module = { exports: {} }, exports = module.exports, require = req;\n" + rd(n) + "\nM[" + JSON.stringify(n) + "] = module.exports; })();");
  return "(function () { var M = {}; function req(n) { return M[String(n).replace('./', '')]; }\n" + mods.join("\n") +
    "\nwindow.DapaiEngine = { R: M.rules, E: M.engine }; })();";
}
module.exports = { engineBundle };
