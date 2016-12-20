var StreamZip = require('node-stream-zip');
var fs = require('fs');
var es = require('event-stream');

var Csv2json = function (config) {
    if(typeof config === "string") {
        config = { pathToFile: config };
    } else if(!config) {
        config = {};
    }
    this.file = config.pathToFile || "./data/data.zip";
    this.jsonFile = config.jsonFile || (this.file.substring(0, this.file.lastIndexOf("/")+1) + 
        this.file.substring(this.file.lastIndexOf("/")+1, this.file.length-4) + ".json");
    this.linesToSave = config.linesToSave || 1000;
    this.separator = config.separator || "||";
};

Csv2json.prototype.convert = function(callback) {
	if(!callback) {
		callback = function() {};
	}
    var checkFileExtension = function(fn) {
        return (fn.lastIndexOf(".") === fn.length-4 && fn.substring(fn.length-3).toLowerCase() === 'zip');
    };
    var ln = 0;
    var data = "";
    var firstSave = true; // file is saved for the first time - clear file contents
    var firstLine = true; // first line of data - no leading comma
    var props = [];
    var propsLine = "";
    var my = this;
    
    // check if parameters are correct
    if(!checkFileExtension(this.file)) {
        console.log("Error: Incorrect file extension.");
        return;
    }
    if(!this.separator) {
        console.log("Error: Separator not provided.");
    }
    if(this.linesToSave < 100) {
        this.linesToSave = 100;
    } else if (this.linesToSave > 100000) {
        this.linesToSave = 100000;
    }

    // helper function to process input object into output object format
    var processLine = function (line) {
        //console.log("processing line: " + ln + " file: " + my.file + );
        var processObject = function (data) {
            var getNumbers = function(n) {
                var re = /\d+/g;
                return n.match(re).join("");
            };
            // add leading zero if needed
            var addLeadingZero = function(n) {
                n = n.toString();
                return (n.length < 2) ? "0" + n : n;
            }
            // transforms date "D/M/YYYY" into YYYY-MM-DD format
            var getDate = function(ds) {
                ds = ds.split("/");
                var d = new Date(ds[2], ds[1]-1, ds[0]);
                var darr = [d.getFullYear(), 
                            addLeadingZero(d.getMonth()+1), 
                            addLeadingZero(d.getDate())];
                return darr.join("-");
            };
            var result = {};
            if(data.last_name && data.first_name) {
                result.name = data.last_name + " " + data.first_name;
                result.person = {
                    firstName: data.first_name,
                    lastName: data.last_name
                }
            } else {
                result.name = "";
                result.person = {
                    firstName: "",
                    lastName: ""
                }
            }
            result.phone = data.phone ? getNumbers(data.phone) : "";
            result.amount = data.amount ? (Math.round(data.amount*100)/100) : 0;
            result.date = data.date ? getDate(data.date) : "";
            result.costCenterNum = data.cc ? getNumbers(data.cc) : "";
            return result;
        };

        line = line.toString();
        var str = line.replace(/\"/g, "").trim();
        if(str.length < 1) {
            return;
        }
        var items = [];
        if(str.includes(my.separator)) {
            var items = str.split(my.separator);
        } else {
            items[0] = str;
        }
        // first line in every file will contain property names
        if(props.length < 1) {
            props = items;
            propsLine = line;
            return;
        } else if(line === propsLine) {
            return;
        }
        var obj = {};
        for(var j = 0; j < props.length; j++) {
            obj[props[j]] = items[j];
        }
        return JSON.stringify(processObject(obj), null, 2);
    }; // end of processline

    // function that saves accumulated string data into JSON file
    var saveToFile = function (data) {
        var flag = "a";
        if(firstSave) {
            firstSave = false;
            flag = "w";
        }
        fs.writeFileSync(my.jsonFile, data, { flag: flag });
        return "";
    }

	var readNextFile = function() {
		if(fileArray.length > 0) {
			streamFile(fileArray.shift());
		} else {
			callback();
		}
	}

	var streamFile = function(file) {
        zip.stream(file, (err, stm) => {
            if(err) {
                callback(err);
                return;
            }
            stm
            .pipe(es.split())
            .pipe(es.mapSync(function(line) {
                stm.pause();
                ln++;
                var processed = processLine(line);
                if (!!processed) { // if has data
                    if(firstLine) {
                        firstLine = false;
                        data += processed;
                    } else {
                        data += ",\n" + processed;
                    }
                }

                if (ln % my.linesToSave === 0) {
                    data = saveToFile(data);
                    ln = 0;
                }
                stm.resume();
            })
            .on('error', function(err) {
                console.error('Error reading file. ' + err);
                return;
            })
            .on('end', function() {
                data = saveToFile(data);
                // console.log("finished file");
                readNextFile(); // finished one file - start next
            })
            )
        });

	}

    var fileArray = [];
    var zip = new StreamZip({
        file: this.file
    });
    zip.on('error', function(err) { console.error('Error reading archive. ' + err); });
    zip.on('ready', function() {
        var files = zip.entries();
        var keys = Object.keys(files);
        for(var i = 0; i < keys.length; i++) {
            if(files.hasOwnProperty(keys[i])) {
            	fileArray.push(keys[i]);
            }
        }
        readNextFile();
    });
};

module.exports = Csv2json;
