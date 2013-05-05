JS_SRC 	:= $(CURDIR)
JSHINT	:= jshint --verbose
MOCHA	:= mocha --reporter list
MOCHA_DEBUG := mocha --timeout 36000000 --debug --debug-brk

.PHONY: all clean test js-validation clean-all

all: js-validation test

clean-all:
	rm -rf ./*~

test:
	$(MOCHA) *.js

test-debug:
	$(MOCHA_DEBUG) $(test) &

js-validation:
	$(JSHINT) $(JS_SRC)/*.js
