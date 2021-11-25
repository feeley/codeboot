
// The paths in this file are set up to work with the Makefile
// in the parent directory.

const fs = require('fs');
const zast = require('./test/zast_node');

fs.readFile("../../parser/test1.py", "utf8", function(err, data) {
  if (err) {
    return console.log(err);
  } else {
    console.log(zast.parse(data));
  }
});
