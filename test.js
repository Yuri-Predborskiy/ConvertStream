var Converter = require("./app.js");
var conv = new Converter("./data/data.zip");

function callback(err) {
	if(err) {
		console.log("error processing archive: " + err);
	} else {
		console.log("finished");
	}
}

conv.convert(callback);
