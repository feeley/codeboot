ZIPI_REPO = https://github.com/udem-dlteam/zipi
ZIPI_BRANCH = master
PYTHON38 = python3

zipi:
	git clone $(ZIPI_REPO) $@
	cd zipi && git checkout $(ZIPI_BRANCH)

.PHONY: zipi-pull
zipi-pull: zipi
	@cd zipi && git pull

pyinterp: zipi-pull
	@echo "Running make on the parser..."
	cd zipi/parser && $(MAKE)
	@echo "Running make on zp..."
	cd zipi/etc/bootstrap && $(MAKE) pyinterp
	@echo "Backing up old pyinterp.js..."
	cp ./include/lang/py/pyinterp.js ./include/lang/py/pyinterp.js.bk
	@echo "Copying pyinterp.js..."
	cp zipi/etc/bootstrap/_tmpdir/pyinterp.js ./include/lang/py/pyinterp.js
	@echo "Done."

.PHONY: serve
serve: pyinterp
	$(PYTHON38) -m http.server 8999 --bind 127.0.0.1

clean:
	rm -rf ./zipi
