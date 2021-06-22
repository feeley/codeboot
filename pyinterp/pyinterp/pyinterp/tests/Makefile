# Relative to 'must_pass' and 'wishlist'
PYTHON38 = ../../../../venv/bin/python
TAIL = | tail -n2

all: tests tests-no-sfs zp-tests venv

.PHONY: venv
venv:
	@cd ../../../ && $(MAKE) venv

# Compare CPython and pyinterp.py results
tests: venv
	@echo "Comparing CPython and pyinterp.py results..."
	-cd must_pass && $(PYTHON38) ../run.py --cpython "$(PYTHON38) ../exec_as_pyinterp.py " --pyinterp "$(PYTHON38) -m pyinterp.pyinterp " >../PYINTERP_TESTS_ESSENTIAL 2>&1
	-cd wishlist && $(PYTHON38) ../run.py --cpython "$(PYTHON38) ../exec_as_pyinterp.py " --pyinterp "$(PYTHON38) -m pyinterp.pyinterp " >../PYINTERP_TESTS_WISHLIST 2>&1
	@echo "Pyinterp unit test results:"
	@echo ""
	@echo "===== ESSENTIAL TESTS ======"
	@cat "PYINTERP_TESTS_ESSENTIAL" $(TAIL)
	@echo ""
	@echo "===== WiSH LIST ====="
	@cat "PYINTERP_TESTS_WISHLIST" $(TAIL)
	@echo ""
	rm -f PYINTERP_TESTS_ESSENTIAL
	rm -f PYINTERP_TESTS_WISHLIST

# Comparing CPython and pyinterp.py results in non-safe-for-space mode
tests-no-sfs: venv
	@echo "Comparing CPython and pyinterp.py results in non-safe-for-space mode..."
	-cd must_pass && $(PYTHON38) ../run.py --cpython "$(PYTHON38) ../exec_as_pyinterp.py " --pyinterp "$(PYTHON38) -m pyinterp.pyinterp --no_sfs " >../PYINTERP_TESTS_ESSENTIAL 2>&1
	-cd wishlist && $(PYTHON38) ../run.py --cpython "$(PYTHON38) ../exec_as_pyinterp.py " --pyinterp "$(PYTHON38) -m pyinterp.pyinterp --no_sfs " >../PYINTERP_TESTS_WISHLIST 2>&1
	@echo "Pyinterp unit test results:"
	@echo ""
	@echo "===== ESSENTIAL TESTS ======"
	@cat "PYINTERP_TESTS_ESSENTIAL" $(TAIL)
	@echo ""
	@echo "===== WiSH LIST ====="
	@cat "PYINTERP_TESTS_WISHLIST" $(TAIL)
	@echo ""
	rm -f PYINTERP_TESTS_ESSENTIAL
	rm -f PYINTERP_TESTS_WISHLIST

# Run these tests from the zp makefile:

# Compare pyinterp.py and pyinterp.js traces
zp-trace-tests: venv
	@echo "Comparing pyinterp.py and pyinterp.js traces..."
	-cd must_pass && $(PYTHON38) ../run.py --cpython "$(PYTHON38) -m pyinterp.pyinterp --trace " --pyinterp "node ../../../../etc/zp/zp_trace.js " >../PYINTERP_TESTS_ESSENTIAL 2>&1
	-cd wishlist && $(PYTHON38) ../run.py --cpython "$(PYTHON38) -m pyinterp.pyinterp --trace " --pyinterp "node ../../../../etc/zp/zp_trace.js " >../PYINTERP_TESTS_WISHLIST 2>&1
	@echo "Pyinterp unit test results:"
	@echo ""
	@echo "===== ESSENTIAL TESTS ======"
	@cat "PYINTERP_TESTS_ESSENTIAL" $(TAIL)
	@echo ""
	@echo "===== WiSH LIST ====="
	@cat "PYINTERP_TESTS_WISHLIST" $(TAIL)
	@echo ""
	rm -f PYINTERP_TESTS_ESSENTIAL
	rm -f PYINTERP_TESTS_WISHLIST

# Compare CPython and pyinterp.js results
zp-no-trace-tests: venv
	@echo "Comparing CPython and pyinterp.js results..."
	-cd must_pass && $(PYTHON38) ../run.py --cpython "$(PYTHON38) ../exec_as_pyinterp.py " --pyinterp "node ../../../../etc/zp/zp_no_trace.js " >../PYINTERPJS_TESTS_ESSENTIAL 2>&1
	-cd wishlist && $(PYTHON38) ../run.py --cpython "$(PYTHON38) ../exec_as_pyinterp.py " --pyinterp "node ../../../../etc/zp/zp_no_trace.js " >../PYINTERPJS_TESTS_WISHLIST 2>&1
	@echo "Test results:"
	@echo ""
	@echo "===== ESSENTIAL TESTS ======"
	@cat "PYINTERPJS_TESTS_ESSENTIAL" $(TAIL)
	@echo ""
	@echo "===== WiSH LIST ====="
	@cat "PYINTERPJS_TESTS_WISHLIST" $(TAIL)
	@echo ""
	rm -f PYINTERPJS_TESTS_ESSENTIAL
	rm -f PYINTERPJS_TESTS_WISHLIST

zp-tests: zp-trace-tests zp-no-trace-tests venv
