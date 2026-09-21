if (typeof YD_PARTS !== "undefined" && YD_PARTS.length) {
  app.get("/sfx-yd.mp3", function(req,res){ sendMp3(res, YD_PARTS.join("")); });
  try { installSfxFrom("yd", YD_PARTS.join("")); } catch (e) {}
}
