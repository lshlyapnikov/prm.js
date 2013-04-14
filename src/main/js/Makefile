JS_SRC 	:= $(CURDIR)
JSHINT	:= jshint --verbose

.PHONY: all clean run js-validation clean-all

all: js-validation

clean-all:
	rm -rf ./*~

run:
	node ./index.js

js-validation:
	$(JSHINT) $(JS_SRC)/*.js
