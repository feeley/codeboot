ZIPI_BRANCH = master
PYTHON38 = python3

zipi:
	git clone https://github.com/udem-dlteam/zipi $@
	cd zipi && git checkout $(ZIPI_BRANCH)

.PHONY: zipi-pull
zipi-pull: zipi
	@cd zipi && git pull

pyinterp: zipi-pull
	@echo "Running make on the parser..."
	cd zipi/parser && $(MAKE)
	@echo "Running make on zp..."
	cd zipi/etc/bootstrap && $(MAKE) copy_files && $(PYTHON38) zp.py -f _tmpdir/pyinterp.py
	@echo "Copying pyinterp.js..."
	cp --backup=numbered zipi/etc/bootstrap/_tmpdir/pyinterp.js ./include/lang/py/pyinterp.js
	@echo "Done."

.PHONY: serve
serve: pyinterp
	$(PYTHON38) -m http.server 8999 --bind 127.0.0.1

clean:
	rm -rf ./zipi
