// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global describe, it */

//var portfolioStats = require("../../main/server/mvef.js");
//var utils = require("../../main/server/utils");
//var assert = require("assert");
//var numeric = require("numeric");

describe("mvef", function() {
    describe("#mvefFromHistoricalPrices()", function() {
        it("[1] should calculate mvef", function() {
            // // GIVEN
            // var weightsMxN = [
            //     [1.0, 0.0, 0.0],
            //     [0.0, 1.0, 0.0],
            //     [0.0, 0.0, 0.0],
            //     [0.5, 0.5, 0.0],
            //     [0.5, 0.0, 0.5],
            //     [0.0, 0.5, 0.5],
            //     [0.2, 0.4, 0.4],
            //     [0.4, 0.2, 0.4]
            // ];
            // var covarianceNxN = [
            //     [0.036224, 0.032980, 0.047716],
            //     [0.032980, 0.150345, 0.021842],
            //     [0.047716, 0.021842, 0.814886]
            // ];
            // var expected = 0.4193;
            // // WHEN
            // var actual = portfolioStats.portfolioStdDev(weights1xN, covarianceNxN);
            // // THEN
            // assert.equal(expected.toFixed(4), actual.toFixed(4));
        });
    });
});

