// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var utils = require("../../main/server/utils");
var assert = require("assert");

describe("utils", function() {
    describe("#convertArrayElements()", function() {

        it("should convert array of object to array of numbers", function() {
            // GIVEN

            var objArray = [
            {Date: "2013-04-12", Open: "37.86", High: "38.05", Low: "37.76", Close: "38.05", Volume: "783400",  "Adj Close": "38.05"},
            {Date: "2013-04-11", Open: "37.97", High: "38.18", Low: "37.81", Close: "37.99", Volume: "931200",  "Adj Close": "37.99"},
            {Date: "2013-04-10", Open: "37.57", High: "37.99", Low: "37.46", Close: "37.93", Volume: "1043600", "Adj Close": "37.93"}];

            var expected = [38.05, 37.99, 37.93];

            // WHEN
            var actual = utils.convertArrayElements(objArray, function(obj) {
                return Number(obj["Adj Close"]);
            });

            // THEN
            assert.deepEqual(expected, actual);
        });
    });
});
