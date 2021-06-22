var pyinterp = require('./_tmpdir/pyinterp_node.js');

bench = `
x = 0
for i in range(1000000):
    x += 1
print("Done!")
`

var start = process.hrtime();
pyinterp.interp_source(bench, {trace: false});
var end = process.hrtime(start);
var sec = end[0]
var milli = end[1]/1000000;
console.log(`Temps écoulé: ${sec}s ${milli.toFixed(3)}ms`);
