# File: "makefile"

# Copyright (c) 2012 by Marc Feeley, All Rights Reserved.

# makefile for building parsers for various subsets of JavaScript.

# This makefile assumes that the Gambit Scheme compiler has been
# installed (see: http://www.iro.umontreal.ca/~gambit).

GRAMMAR=Grammar

.SUFFIXES:
.SUFFIXES: .y .js

all: foo

.y.js:
	./yacc2js.scm $*.y

tokens.js: $(GRAMMAR).js
	sed -e '/^$$/q' $(GRAMMAR).js > tokens.js

keywords.js: keywords.scm
	/Users/feeley/gambit/work/gsc/gsc -:=/Users/feeley/gambit/work -prelude '(include "keywords.scm")' build-keyword-ht.scm
	/Users/feeley/gambit/work/gsi/gsi build-keyword-ht > keywords.js
	rm -f build-keyword-ht.o*

scanner-tables.js: tokens.js keywords.js
	cat tokens.js keywords.js > scanner-tables.js

scanner.js: scanner-tables.js
	sed -e '/START-OF-SCANNER-TABLES/q' scanner.js > part1.js
	sed -n '/END-OF-SCANNER-TABLES/,$$p' scanner.js > part2.js
	cat part1.js scanner-tables.js part2.js > scanner.js.new
	if ! diff scanner.js.new scanner.js > /dev/null; then \
	  for f in @*scanner.js; do \
	    echo mv $$f @$$f; \
	    mv $$f @$$f; \
	  done; \
	  mv scanner.js @scanner.js; \
	fi
	mv scanner.js.new scanner.js
	rm -f part1.js part2.js

parser-tables.js: $(GRAMMAR).js
	sed -n '/var $(GRAMMAR) =/,$$p' $(GRAMMAR).js > parser-tables.js

parser.js: parser-tables.js
	sed -e '/START-OF-PARSER-TABLES/q' parser.js > part1.js
	sed -n '/END-OF-PARSER-TABLES/,$$p' parser.js > part2.js
	cat part1.js parser-tables.js part2.js > parser.js.new
	if ! diff parser.js.new parser.js > /dev/null; then \
	  for f in @*parser.js; do \
	    echo mv $$f @$$f; \
	    mv $$f @$$f; \
	  done; \
	  mv parser.js @parser.js; \
	fi
	mv parser.js.new parser.js
	rm -f part1.js part2.js

foo: scanner.js parser.js

clean:
	rm -f $(GRAMMAR).js tokens.js keywords.js scanner-tables.js parser-tables.js build-keyword-ht.o* *~
