// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it, console */

var portfolioStats = require("../../main/server/portfolioStats");
var assert = require("assert");

describe("portfolioStats", function() {
    describe("#mean() [1]", function() {
        it("should calculate mean", function() {
            var expectedMean = 2870;
            var actualMean = portfolioStats.mean([123, 456, 789, 10112]);
            assert.equal(expectedMean, actualMean);
        });
    });
    describe("#mean() [2]", function() {
        it("should calculate mean", function() {
            // R:
            // >  a = c(-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234);
            // > mean(a)
            // [1] 397.793
            var expectedMean = 397.793;
            var actualMean = portfolioStats.mean([-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234]);
            assert.equal(expectedMean, actualMean.toFixed(3));
        });
    });
    describe("#mean() [3]", function() {
        it("should throw up when array is undefined", function() {
            var caught;
            try {
                portfolioStats.mean(undefined);
            } catch(e) {
                caught = e;
            }
            assert.equal(true, caught !== undefined);
            assert.equal("TypeError", caught.name);
        });
    });
    describe("#mean() [4]", function() {
        it("should throw up when array is empty", function() {
            var caught;
            try {
                portfolioStats.mean([]);
            } catch(e) {
                caught = e;
            }
            assert.equal(true, caught !== undefined);
            assert.equal("TypeError", caught.name);
        });
    });
    describe("#variance() [1]", function() {
        it("should calculate sample variance", function() {
            // R:
            // >  a = c(-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234);
            // > var(a)
            // [1] 248102.9
            var expected = 248102.9;
            var actual = portfolioStats.variance([-123.456, -234.567, -345.789, 456.789, 567.890, 678.901, 789.0123, 890.123, 901.234]);
            assert.equal(expected, actual.toFixed(1));
        });
    });
    describe("#covariance() [1]", function() {
        it("should calculate sample covariance", function() {
            // R:
            // > m = rbind(c(1,2,3), c(40,50,60), c(7,8,9), c(10, 11, 12), c(13, 14,15));
            // > m
            //      [,1] [,2] [,3]
            // [1,]    1    2    3
            // [2,]   40   50   60
            // [3,]    7    8    9
            // [4,]   10   11   12
            // [5,]   13   14   15
            // > var(m)
            //        [,1]   [,2]   [,3]
            // [1,] 227.70 285.75 343.80
            // [2,] 285.75 360.00 434.25
            // [3,] 343.80 434.25 524.70
            var expected = 248102.9;
            var m = [[1,2,3], [40,50,60], [7,8,9], [10, 11, 12], [13, 14,15]];
            var actual = portfolioStats.covariance(m);
            console.log("actual: " + JSON.stringify(actual));
            assert.equal(expected, actual);
        });
    });
});
