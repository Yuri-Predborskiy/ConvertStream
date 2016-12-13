console.log('Loading zip...');
var StreamZip = require('node-stream-zip');
var Transform = require('stream').Transform;  
var inherits = require('util').inherits;
var fs = require('fs');
var split = require('stream-split');

var splitter = new split(new Buffer("\r\n"));
var writeStream = fs.createWriteStream('res.json', { flags: 'w' });
var firstCall = true; // change to false on first file
var separator = "||";
var dirName = "./";
var archiveName = "archive.zip";
var props = [];
var propsLine = "";

var zip = new StreamZip({
    file: dirName + archiveName
    //file: 'd:/temp/node_src.zip'
});

zip.on('error', function(err) { console.error('ERROR: ' + err); });
zip.on('ready', function() {
    //console.dir(zip.entry('README.md'));
    console.log('Done in ' + process.uptime() + '. Entries read: ' + zip.entriesCount);
    var files = zip.entries();
    var keys = Object.keys(files);
    for(var i = 0; i < keys.length; i++) {
        if(files.hasOwnProperty(keys[i])) {
            zip.stream(files[keys[i]], function(err, stm) {
                if(err) {
                    return console.error(err);
                }
                stm
                .pipe(splitter)
/*
                .on('data', function (line) {
                    line = line.replace(/"/g, "").trim();
                    // skip empty lines
                    if(line.length < 1) {
                        return;
                    }
                    var items = line.split(separator);
                    // if this is a first line - save it as object keys
                    if(props.length < 1) {
                        props = items;
                        propsLine = line;
                        console.log(props);
                        return;
                    } else if(line === propsLine) {
                        // skip repeating property lines
                        return;
                    }
                    var item = {};
                    // turn each line into array of values and assign them to properties
                    for(var j = 0; j < props.length; j++) {
                        item[props[j]] = items[j];
                    }
                    this.push("," + JSON.stringify(item, null, 2));
                    // console.log("line: \n" + JSON.stringify(item, null, 2));
                })
*/
                .pipe(JSONEncode())
                // .pipe(process.stdout)
                .pipe(writeStream)
                ;
            });
        }
    }
});
zip.on('extract', function(entry, file) {
    console.log('extract', entry.name, file);
});

function JSONEncode(options) {  
  if ( ! (this instanceof JSONEncode))
    return new JSONEncode(options);

  if (! options) options = {};
  options.objectMode = true;
  Transform.call(this, options);
}

inherits(JSONEncode, Transform);

JSONEncode.prototype._transform = function _transform(line, encoding, callback) {  
// v1
    // obj = obj.toString().trim();
    // if(obj.includes("114")) {
    //     console.log("\n\n\nerr:");
    //     console.log(obj);
    // }
    // // convert incoming text into lines and filter out new lines
    // var lines = obj.replace(/\"/g,"").split(/(\r?\n)/).filter(function(item) {
    //     return !/(\r?\n)/.test(item);
    // });
    // // turn 1st line into array of property names
    // var props = lines[0].split(separator);
    // var mylist = "";
    // for(var i = 1; i < lines.length; i++) {
    //     var line = lines[i].split(separator);
    //     var item = {};
    //     // turn each line into array of values and assign them to properties
    //     for(var j = 0; j < props.length; j++) {
    //         item[props[j]] = line[j];
    //     }
    //     mylist = mylist + (firstCall?"":",\n") + JSON.stringify(item, null, 2);
    //     firstCall = false;
    // }
    line = line.toString().replace(/\"/g, "").trim();
    console.log("line: \n" + line);
    // skip empty lines
    if(line.length < 1) {
        return;
    }
    var items = line.split(separator);
    // if this is a first line - save it as object keys
    if(props.length < 1) {
        console.log("saving props");
        props = items;
        propsLine = line;
        console.log(props);
        return;
    } else if(line === propsLine) {
        // skip repeating property lines
        return;
    }
    console.log("passed line test");
    var item = {};
    // turn each line into array of values and assign them to properties
    for(var j = 0; j < props.length; j++) {
        item[props[j]] = items[j];
    }
    this.push("," + JSON.stringify(item, null, 2));
    // console.log("line: \n" + JSON.stringify(item, null, 2));
    // this.push(mylist);
    callback();
};

writeStream.on('close', function () {
    console.log('All done!');
});
