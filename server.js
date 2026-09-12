const fs = require("fs");
eval(fs.readFileSync(__dirname + "/a.js", "utf8") + fs.readFileSync(__dirname + "/b.js", "utf8") + fs.readFileSync(__dirname + "/s33.js", "utf8"));
