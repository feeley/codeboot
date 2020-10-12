ZIPI_REPO ?= git@github.com:udem-dlteam/zipi
ZIPI_BRANCH ?=
ZIPI_FOR_CODEBOOT = zipi-for-codeboot
PYTHON38 ?= $(ZIPI_FOR_CODEBOOT)/venv/bin/python

all: bundle

$(ZIPI_FOR_CODEBOOT):
	rm -rf ./$(ZIPI_FOR_CODEBOOT)
	@if test "$(ZIPI_BRANCH)" != "" || echo $(ZIPI_REPO) | grep "^\(http://\|https://\|git@\)" > /dev/null; then \
	  echo "git clone $(ZIPI_REPO) ./$(ZIPI_FOR_CODEBOOT)"; \
	  git clone $(ZIPI_REPO) ./$(ZIPI_FOR_CODEBOOT); \
	  echo "cd ./$(ZIPI_FOR_CODEBOOT) && git checkout $(if $(ZIPI_BRANCH),$(ZIPI_BRANCH),master)"; \
	  cd ./$(ZIPI_FOR_CODEBOOT) && git checkout $(if $(ZIPI_BRANCH),$(ZIPI_BRANCH),master); \
	else \
	  echo "cp -r $(ZIPI_REPO) ./$(ZIPI_FOR_CODEBOOT)"; \
	  cp -r $(ZIPI_REPO) ./$(ZIPI_FOR_CODEBOOT); \
	fi

.PHONY: zipi-pull
zipi-pull: $(ZIPI_FOR_CODEBOOT)
	@if test "$(ZIPI_BRANCH)" != "" || echo $(ZIPI_REPO) | grep "^\(http://\|https://\|git@\)" > /dev/null; then \
	  echo "cd ./$(ZIPI_FOR_CODEBOOT) && git pull"; \
	  cd ./$(ZIPI_FOR_CODEBOOT) && git pull; \
	else \
	  echo "rm -rf ./$(ZIPI_FOR_CODEBOOT)"; \
	  rm -rf ./$(ZIPI_FOR_CODEBOOT); \
	  echo "cp -r $(ZIPI_REPO) ./$(ZIPI_FOR_CODEBOOT)"; \
	  cp -r $(ZIPI_REPO) ./$(ZIPI_FOR_CODEBOOT); \
	fi

include/lang/py/pyinterp.js: zipi-pull
	@echo "*** Building include/lang/py/pyinterp.js:"
	@echo "***   Running make on pyinterp"
	cd ./$(ZIPI_FOR_CODEBOOT) && $(MAKE) clean-venv  # Delete the venv, may have absolute references to copied folder
	cd ./$(ZIPI_FOR_CODEBOOT)/etc/zp && $(MAKE) zipi-venv && $(MAKE) pyinterp
	@echo "***   Backing up old include/lang/py/pyinterp.js"
	cp ./include/lang/py/pyinterp.js ./include/lang/py/pyinterp.js.bk
	@echo "***   Creating include/lang/py/pyinterp.js"
	cp ./$(ZIPI_FOR_CODEBOOT)/etc/zp/_tmpdir/pyinterp.js ./include/lang/py/pyinterp.js

include/lang/py/style.js: zipi-pull
	@echo "*** Building include/lang/py/style.js:"
	@echo "***   Running make on style"
	cd ./$(ZIPI_FOR_CODEBOOT)/etc/zp && $(MAKE) style
	@echo "***   Backing up old include/lang/py/style.js"
	cp ./include/lang/py/style.js ./include/lang/py/style.js.bk
	@echo "***   Creating include/lang/py/style.js"
	cp ./$(ZIPI_FOR_CODEBOOT)/etc/zp/_tmpdir/style.js ./include/lang/py/style.js

include/lang/py/exercice2f.js: zipi-pull include/lang/py/style.js
	@echo "*** Building include/lang/py/exercice2f.js:"
	@echo "***   Running make on exercice2f"
	@echo "***   Backing up old include/lang/py/exercice2f.js"
	cp ./include/lang/py/exercice2f.js ./include/lang/py/exercice2f.js.bk
	@echo "***   Creating include/lang/py/exercice2f.js"
	cp ./$(ZIPI_FOR_CODEBOOT)/etc/zp/_tmpdir/exercice2f.js ./include/lang/py/exercice2f.js

.PHONY: serve
serve: bundle
	$(PYTHON38) -m http.server 8999 --bind 127.0.0.1

bundle: codeboot.bundle.css codeboot.bundle.js

codeboot.bundle.css: include/bootstrap-4.5.0-dist/css/bootstrap.min.css include/codemirror-5.56.0/lib/codemirror.css include/codemirror-5.56.0/addon/dialog/dialog.css include/codeboot.css
	@echo "*** Building codeboot.bundle.css"
	@rm -f $@
	@touch $@
	@for f in $+; do \
	  cat $$f >> $@; \
	  echo >> $@; \
	done

codeboot.bundle.js: include/jquery-3.2.1.min.js include/jquery.clippy.min.js include/bootstrap-4.5.0-dist/js/bootstrap.bundle.min.js include/popper.min.js include/tippy-bundle.umd.min.js include/codemirror-5.56.0/lib/codemirror.js include/codemirror-5.56.0/addon/edit/matchbrackets.js include/codemirror-5.56.0/addon/display/rulers.js include/codemirror-5.56.0/addon/search/searchcursor.js include/codemirror-5.56.0/addon/search/search.js include/codemirror-5.56.0/addon/comment/comment.js include/codemirror-5.56.0/addon/dialog/dialog.js include/codemirror-5.56.0/keymap/emacs.js include/codemirror-5.56.0/mode/javascript/javascript.js include/codemirror-5.56.0/mode/python/python.js include/download.js include/lang.js include/lang/js/num.js include/int.js include/float.js include/lang/js/js.js include/lang/js/system.js include/lang/js/scanner.js include/lang/js/parser.js include/lang/js/pp.js include/lang/js/ast-passes.js include/lang/js/eval.js include/lang/js/builtins.js include/lang/py/py.js include/lang/py/pyinterp.js include/lang/py/style.js include/lang/py/exercice2f.js include/codeboot.js include/drawing.js include/actions.js include/editors.js include/fs.js include/storage.js include/tutorial.js include/jquery.visibility.js
	@echo "*** Building codeboot.bundle.js"
	@rm -f $@
	@touch $@
	@for f in $+; do \
	  cat $$f >> $@; \
	  echo >> $@; \
	done

clean:
	rm -rf ./$(ZIPI_FOR_CODEBOOT) codeboot.bundle.js codeboot.bundle.css
