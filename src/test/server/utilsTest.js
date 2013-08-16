// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var utils = require("../../main/server/utils");
var assert = require("assert");
var numeric = require("numeric");

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
    describe("#generateRandomWeightsMatrix", function() {
        it("should generate a matrix of random weights", function() {
            // GIVEN
            var rowNum = 30;
            var colNum = 10;
            // WHEN
            var weights = utils.generateRandomWeightsMatrix(rowNum, colNum);
            // THEN
            var sum = numeric.sum(weights);
            assert.equal(rowNum, sum);
        });
    });
    describe("#generateRandomWeightsMatrix", function() {
        it("should generate a new weights matrix if called consequently", function() {
            // GIVEN
            var rowNum = 30;
            var colNum = 10;
            // WHEN
            var weights0 = utils.generateRandomWeightsMatrix(rowNum, colNum);
            var weights1 = utils.generateRandomWeightsMatrix(rowNum, colNum);
            // THEN
            var sum0 = numeric.sum(weights0);
            var sum1 = numeric.sum(weights1);
            assert.equal(rowNum, sum0);
            assert.equal(rowNum, sum1);
            assert.notDeepEqual(weights0, weights1);
            var i;
            for (i = 0; i < rowNum; i++) {
                assert.notDeepEqual(weights0[i], weights1[i]);
            }
        });
    });
    describe("#generateRandomWeightsMatrix", function() {
        it("should throw up when invalid arguments passed", function() {
            // GIVEN
            // Valid arguments: rowNum > 0 and colNum > 1
            var invalidArguments = [
                [undefined, undefined],
                [undefined, 10],
                [10, undefined],
                [0, 10],
                [-1, 10],
                [10, 0],
                [10, -1],
                [10, 1]
            ];

            function test(rowNum, colNum) {
                var actualException;
                // WHEN
                try {
                    utils.generateRandomWeightsMatrix(rowNum, colNum);
                } catch (e) {
                    actualException = e;
                }
                // THEN
                var debugMsg = "rowNum: " + rowNum + ", colNum: " + colNum;
                assert.notEqual(undefined, actualException, debugMsg);
                assert.equal("Error", actualException.name, debugMsg);
            }

            var i;
            for (i = 0; i < invalidArguments.length; i++) {
                test(invalidArguments[i][0], invalidArguments[i][1]);
            }
        });
    });
    describe("#defined", function() {
        it("should return true when variable is defined", function() {
            assert.equal(true, utils.defined(10));
            var myVar = 100;
            assert.equal(true, utils.defined(myVar));
        });
    });
    describe("#defined", function() {
        it("should return false when variable is undefined", function() {
            var myVar;
            assert.equal(false, utils.defined(myVar));
        });
    });
    describe("#defined", function() {
        it("should return false when variable is null", function() {
            var myVar = null;
            assert.equal(false, utils.defined(myVar));
            assert.equal(false, utils.defined(null));
        });
    });
});
