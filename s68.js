function sendMp3(res, b64) {
  res.type("audio/mpeg");
  res.set("Cache-Control", "no-store");
  res.send(Buffer.from(b64, "base64"));
}
function sendSfxFile(res, name) {
  var p = path.join(__dirname, "public", name);
  if (fs.existsSync(p)) {
    res.type("audio/mpeg");
    res.set("Cache-Control", "no-store");
    return res.sendFile(p);
  }
  return false;
}
["draw","play","pass","pen","yd"].forEach(function(k){
  app.get("/sfx-"+k+".mp3", function(req,res){
    if (sendSfxFile(res, "sfx-"+k+".mp3")) return;
    try { eval(fs.readFileSync(__dirname + "/s68_" + k + ".js", "utf8")); } catch(e) {}
    if (!res.headersSent) res.status(404).end();
  });
});
