# command to run python 3.8
PYTHON38?=../../venv/bin/python

GRAMMAR?=Grammar_novice

FUZZ_SAMPLE=last


all: _zparse.py


clean:
	rm -f _zparse.py


check: test1 test2 test3 test4


test1 test2 test3 test4 test5 $(FUZZ_SAMPLE): _zparse.py
	@echo "====================================================================== $@"
	@if $(PYTHON38) parse38.py $@.py > p38.ast 2> p38.err; then \
	  : || echo "*** NO SYNTAX ERRORS REPORTED BY CPYTHON ***"; \
	  if $(PYTHON38) zast.py $@.py > z.ast 2> z.err; then \
	    : || echo "*** NO SYNTAX ERRORS REPORTED BY ZAST ***"; \
	    if diff -U 5 z.ast p38.ast > z.diff ; then \
	      echo "*** CPython and zast generated identical ASTs"; \
	    else \
	      echo "*** CPython and zast generated different ASTs:"; \
	      cat z.diff; \
	    fi; \
	  else \
	    sed '/^SyntaxError: /,$$!d' z.err > z.err2; \
	    echo "*** zast raised a syntax error but not CPython:"; \
	    echo "---------------------zast----------------------"; \
	    cat z.err2; \
	  fi; \
	else \
	  sed '/^SyntaxError: /,$$!d' p38.err > p38.err2; \
	  if $(PYTHON38) zast.py $@.py > z.ast 2> z.err; then \
	    echo "*** CPython raised a syntax error but not zast:"; \
	    echo "--------------------CPython--------------------"; \
	    cat p38.err2; \
	  else \
	    sed '/^SyntaxError: /,$$!d' z.err > z.err2; \
	    if diff -U 5 z.err2 p38.err2 > z.diff2 ; then \
	      echo "*** CPython and zast raised the same syntax error"; \
	    else \
	      echo "*** CPython and zast raised different syntax errors:"; \
	      echo "--------------------CPython--------------------"; \
	      cat p38.err2; \
	      echo "---------------------zast----------------------"; \
	      cat z.err2; \
	    fi; \
	  fi; \
	fi


fuzz fuzz-nostop: _zparse.py
	@n=0; \
	while :; do \
	  : || echo "*******************************************************"; \
	  n=$$(expr $$n + 1); if test "$$(expr $$n % 100)" == "0"; then echo "*** $$n"; fi; \
	  rm -f $(FUZZ_SAMPLE).py; \
	  if test ! -e "$(FUZZ_SAMPLE).py"; then \
	    $(PYTHON38) -m zpgen -fuzzer $(GRAMMAR).py > $(FUZZ_SAMPLE).py; \
	  fi; \
	  : || cat $(FUZZ_SAMPLE).py; \
	  if $(PYTHON38) parse38.py $(FUZZ_SAMPLE).py > p38.ast 2> p38.err; then \
	    : || echo "*** NO SYNTAX ERRORS REPORTED BY CPYTHON ***"; \
	    if $(PYTHON38) zast.py $(FUZZ_SAMPLE).py > z.ast 2> z.err; then \
	      : || echo "*** NO SYNTAX ERRORS REPORTED BY ZAST ***"; \
	      if diff -U 5 z.ast p38.ast > z.diff ; then \
	        : || echo "*** CPython and zast generated identical ASTs"; \
	      else \
	        echo "*** CPython and zast generated different ASTs:"; \
	        cat z.diff; \
	        echo "--------------------source---------------------"; \
	        cat $(FUZZ_SAMPLE).py; \
	        echo "-----------------------------------------------"; \
	        if test "$@" == "fuzz"; then exit 1; fi; \
	      fi; \
	    else \
	      sed '/^SyntaxError: /,$$!d' z.err > z.err2; \
	      echo "*** zast raised a syntax error but not CPython:"; \
	      echo "---------------------zast----------------------"; \
	      cat z.err2; \
	      if test "$@" == "fuzz"; then exit 1; fi; \
	    fi; \
	  else \
	    if ! sed '/^SyntaxError: /,$$!d' p38.err > p38.err2; then \
	      cp p38.err p38.err2; \
	    fi; \
	    if $(PYTHON38) zast.py $(FUZZ_SAMPLE).py > z.ast 2> z.err; then \
	      echo "*** CPython raised a syntax error but not zast:"; \
	      echo "--------------------CPython--------------------"; \
	      cat p38.err2; \
	      echo "--------------------source---------------------"; \
	      cat $(FUZZ_SAMPLE).py; \
	      echo "-----------------------------------------------"; \
	      if test "$@" == "fuzz"; then exit 1; fi; \
	    else \
	      if ! sed '/^SyntaxError: /,$$!d' z.err > z.err2; then \
	        cp z.err z.err2; \
	      fi; \
	      if diff -U 5 z.err2 p38.err2 > z.diff2 ; then \
	        : || echo "*** CPython and zast raised the same syntax error"; \
	      else \
	        echo "*** CPython and zast raised different syntax errors:"; \
	        echo "--------------------CPython--------------------"; \
	        cat p38.err2; \
	        echo "---------------------zast----------------------"; \
	        cat z.err2; \
	        echo "--------------------source---------------------"; \
	        cat $(FUZZ_SAMPLE).py; \
	        echo "-----------------------------------------------"; \
	        if test "$@" == "fuzz"; then exit 1; fi; \
	      fi; \
	    fi; \
	  fi; \
	done

_zparse.py: $(GRAMMAR).py $(GRAMMAR)_actions.py zpgen.py
	touch _zparse.py
	$(PYTHON38) -m zpgen $(GRAMMAR).py > _zparse.py
