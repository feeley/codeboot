# zp is built to work with python3.8 ast module be careful if changing PYTHON38
PYTHON38 = python3.8

venv: venv/bin/activate

clean-venv:
	rm -rf venv

venv/bin/activate: requirements.txt
	test -d venv || $(PYTHON38) -m venv venv
	venv/bin/pip install -e . && venv/bin/pip install -r requirements.txt
	touch venv/bin/activate
