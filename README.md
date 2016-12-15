# ConvertStream
Test task for converting archived CSV documents into JSON format data using node.js streams.

## Dependencies
* node-stream-zip

## How to use
1. Require ConvertStream
2. Create a new instance with configuration object or string "./path/to/file.zip"
3. Execute convert();

```
var ConvertStream = require("./app.js");
var conv = new ConvertStream("./data/archive.zip");
conv.convert();
```

JSON file will be saved into same folder with same name as archive file.

## Configuration
There are two possible configuration options for ConvertStream:
1. Provide a string, containing path to file
```
var conv = new ConvertStream("./data/archive.zip");
```
Other parameters will have default values.

2. Provide a configuration object. Example:
```
var config = {
  pathToFile: "./data/data.zip",
  jsonFile: "./data/result.json",
  linesToSave: 1000,
  separator: "||"
};
```
Default values:
* `pathToFile` - "./data/data.zip"
* `jsonFile` - same as `pathToFile` but with .JSON extension
* `linesToSave` - 1000
* `separator` - "||"

## Expected input file format
```
"first_name"||"last_name"||"user"||"email"||"name"||"phone"||"cc"||"amount"||"date"
```

Note: script will insert empty string or 0 in the output JSON file if required field is not found.

## Resulting JSON file format
```
{
  "name": "string", // <last_name> + <first_name>
  "phone": "string", // normalized <phone> (numbers only)
  "person": {
    "firstName": "string",
    "lastName": "string"
  },
  "amount": "number", // rounded to 2 digits
  "date": "date", // <date> in YYYY-MM-DD format with leading zeroes
  "costCenterNum": "string" // <cc> without prefix (i.e. ACN00006 00006)
}
```
