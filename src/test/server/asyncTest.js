/* global describe, it */

var async = require("../../main/server/async");
var assert = require("assert");

describe("async", function () {
  describe("#assert", function () {
    it("should call doneFunc with defined error when 1st is undefined", function () {
      var doneError;

      function doneFunction(error) {
        doneError = error;
      }

      async.assert(undefined, doneFunction);
      assert.ok(doneError !== undefined);
    });
    it("should call doneFunc with defined error when 1st is false", function () {
      var doneError;

      function doneFunction(error) {
        doneError = error;
      }

      async.assert(false, doneFunction);
      assert.ok(doneError !== undefined);
    });
    it("should NOT call doneFunc when 1st is true", function () {
      var doneError;

      function doneFunction(error) {
        doneError = error;
      }

      async.assert(true, doneFunction);
      assert.ok(doneError === undefined);
    });
  });
});