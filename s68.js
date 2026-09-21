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
    fs.writeFileSync(path.join(__dirname, "public", "sfx-" + name + ".mp3"), buf);
  } catch (e) {}
}
function extractB64(txt) {
  var m = String(txt || "").match(/sendMp3\(res,\s*"([A-Za-z0-9+/=]+)"/);
  return m ? m[1] : "";
}
["draw", "play", "pass", "pen"].forEach(function (k) {
  try {
    var txt = fs.readFileSync(__dirname + "/s68_" + k + ".js", "utf8");
    eval(txt);
    var b64 = extractB64(txt);
    if (b64) installSfxFrom(k, b64);
  } catch (e) {}
});
var YD_PARTS = [];
[0,1,2,3,4,5,6].forEach(function (i) {
  try { eval(fs.readFileSync(__dirname + "/s68_yd_p" + i + ".js", "utf8")); } catch (e) {}
});
try { eval(fs.readFileSync(__dirname + "/s68_yd_end.js", "utf8")); } catch (e) {}
