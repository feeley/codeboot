var fs = require('fs');
var pyinterp = require('./_tmpdir/pyinterp_node.js');

var args = process.argv.slice(2);

var data = fs.readFileSync(args[0], 'utf8');

pyinterp.interp_source(data, {trace: false});
