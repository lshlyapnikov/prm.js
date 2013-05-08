JS_SRC 	:= $(CURDIR)
JSHINT	:= jshint --verbose
MOCHA	:= mocha --reporter list
MOCHA_DEBUG := mocha --timeout 36000000 --debug --debug-brk

#.PHONY: all release clean test test-all test-debug js-validation clean-all

all: js-validation test

release: js-validation test-all

clean-all:
	rm -rf ./*~

test:
	$(MOCHA) --grep @IntegrationTest --invert *.js
	@echo "Integration Tests *skipped*. To run all tests: make test-all"

test-all:
	$(MOCHA) *.js

test-debug:
	killall -9 node-inspector
	killall -9 node
	$(MOCHA_DEBUG) $(test) &
	node-inspector &

js-validation:
	$(JSHINT) $(JS_SRC)/*.js
