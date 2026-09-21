function sendMp3(res, b64) {
  var buf = Buffer.from(b64, "base64");
  res.type("audio/mpeg");
  res.set("Cache-Control", "no-store");
  res.send(buf);
}
function installSfxFrom(name, b64) {
  try {
    var buf = Buffer.from(b64, "base64");
    if (!buf || buf.length < 500) return;
    var dest = path.join(__dirname, "public", "sfx-" + name + ".mp3");
    fs.writeFileSync(dest, buf);
  } catch (e) {}
}
function extractB64(txt) {
  var m = String(txt || "").match(/sendMp3\(res,\s*"([A-Za-z0-9+/=]+)"/);
  return m ? m[1] : "";
}
["draw", "play", "pass", "pen", "yd"].forEach(function (k) {
  try {
    var txt = fs.readFileSync(__dirname + "/s68_" + k + ".js", "utf8");
    eval(txt);
    var b64 = extractB64(txt);
    if (b64) installSfxFrom(k, b64);
  } catch (e) {}
});
try {
  var ya = fs.readFileSync(__dirname + "/s68_yd.js", "utf8");
  var yb = fs.readFileSync(__dirname + "/s68_yd_b.js", "utf8");
  eval(ya);
  eval(yb);
  if (typeof YD_A === "string" && typeof YD_B === "string" && (YD_A + YD_B).length > 500) {
    installSfxFrom("yd", YD_A + YD_B);
  }
} catch (e) {}
