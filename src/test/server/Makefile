JS_SRC 	:= $(CURDIR)
JSHINT	:= jshint --verbose
MOCHA	:= mocha --reporter list

.PHONY: all clean test js-validation clean-all

all: js-validation test

clean-all:
	rm -rf ./*~

test:
	$(MOCHA) *.js


js-validation:
	$(JSHINT) $(JS_SRC)/*.js
