function sendMp3(res, b64) {
  res.type("audio/mpeg");
  res.set("Cache-Control", "no-store");
  res.send(Buffer.from(b64, "base64"));
}
try { eval(fs.readFileSync(__dirname + "/s68_draw.js", "utf8")); } catch (e) {}
try { eval(fs.readFileSync(__dirname + "/s68_play.js", "utf8")); } catch (e) {}
try { eval(fs.readFileSync(__dirname + "/s68_pass.js", "utf8")); } catch (e) {}
try { eval(fs.readFileSync(__dirname + "/s68_pen.js", "utf8")); } catch (e) {}
try { eval(fs.readFileSync(__dirname + "/s68_yd.js", "utf8")); } catch (e) {}
try { eval(fs.readFileSync(__dirname + "/s68_yd_b.js", "utf8")); } catch (e) {}
