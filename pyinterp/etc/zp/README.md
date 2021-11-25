# zp

## Instructions

```
usage: zp.py [-h] [-f FILE] [-o OUTPUT] [-n] [-b] [-es6] [-d]

CLI to zp bootstrap compiler.

optional arguments:
  -h, --help            show this help message and exit
  -f FILE, --file FILE  file to compile
  -o OUTPUT, --output OUTPUT
                        output file
  -n, --node            export as node module (default False)
  -b, --browser         export as browser module (default True)
  -es6, --es6-classes   compile to ES6 classes (default False)
  -d, --debug           add debug information (default False)
```

## Make

The `Makefile` assumes that you have already built the parser in `../../parser`.

Run `make` to build a browser module version of `zast.py` in `test/`. You can
then open `test/index.html` and use `zast` in the console.

Tests require `node`. Run `make test_node` to run the parser through
`../../parser/test1.py` with ES6 and vanilla classes. Run `make test_builds` to build ES6 and vanilla node and browser modules.
