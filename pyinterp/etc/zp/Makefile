TMPDIR = ./_tmpdir
PYTHON38 = ../../venv/bin/python
ZP_DEBUG =

_tmpdir:
	mkdir -p $(TMPDIR)

.PHONY: _zparse.py
_zparse.py: pyinterp-venv
	@echo "Make parser..."
	@cd ../../pyinterp/zast && $(MAKE) clean && $(MAKE)

.PHONY: pyinterp-venv
pyinterp-venv:
	@echo "Setting up pyinterp venv..."
	@cd ../.. && $(MAKE) venv

pyinterp: _tmpdir pyinterp-venv _zparse.py
	$(PYTHON38) zp.py -f ../../pyinterp/pyinterp/__init__.py $(ZP_DEBUG) -e pyinterp -o $(TMPDIR)/pyinterp.js
	$(PYTHON38) zp.py -f ../../pyinterp/pyinterp/__init__.py $(ZP_DEBUG) -e pyinterp -t -o $(TMPDIR)/pyinterp_browser.js
	$(PYTHON38) zp.py -f ../../pyinterp/pyinterp/__init__.py $(ZP_DEBUG) -e pyinterp -n -t -o $(TMPDIR)/pyinterp_node.js
	cp $(TMPDIR)/pyinterp_browser.js test/pyinterp/

profile: _tmpdir pyinterp-venv _zparse.py
	mv profile.out profile.out.old
	$(PYTHON38) zp.py -f ../../pyinterp/pyinterp/__init__.py $(ZP_DEBUG) -e pyinterp -n -t -o $(TMPDIR)/pyinterp_node.js
	node --prof --logfile=profile.log --no-logfile-per-isolate profile.js
	node --prof-process profile.log > profile.out
	@echo "Profiling information is available in profile.out."

style: _tmpdir pyinterp-venv _zparse.py
	$(PYTHON38) zp.py -f ../../pyinterp/style/__init__.py $(ZP_DEBUG) -e style -o $(TMPDIR)/style.js
	$(PYTHON38) zp.py -f ../../pyinterp/style/__init__.py $(ZP_DEBUG) -e style -t -o $(TMPDIR)/style_browser.js
	$(PYTHON38) zp.py -f ../../pyinterp/style/__init__.py $(ZP_DEBUG) -e style -n -t -o $(TMPDIR)/style_node.js

tests: pyinterp
	cd ../../pyinterp/pyinterp/tests && $(MAKE)

clean:
	rm -vf ./test/zast_browser.js ./test/zast_node.js ./test/zast_browser_es6.js \
	./test/zast_node_es6.js ./test/pyinterp/pyinterp_node.js \
	./test/pyinterp/pyinterp_browser.js
	rm -vrf $(TMPDIR)/*
	rmdir $(TMPDIR)
