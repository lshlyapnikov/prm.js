// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, describe, it */

var linearAlgebra = require("../../main/server/linearAlgebra");
var assert = require("assert");

describe("linearAlgebra", function() {
    describe("#dim()", function() {
        it("should return matrix dimensions", function() {
            // GIVEN
            var expected = [2, 4];
            // WHEN
            var actual = linearAlgebra.dim([
                [1, 2, 3, 4],
                [6, 7, 8, 9]]);
            // THEN
            assert.deepEqual(actual, expected);
        });
    });
    describe("#transpose()", function() {
        it("should transpose a matrix", function() {
            // GIVEN
            var expected = [
                [1, 6],
                [2, 7],
                [3, 8],
                [4, 9]];
            // WHEN
            var actual = linearAlgebra.transpose([
                [1, 2, 3, 4],
                [6, 7, 8, 9]]);
            // THEN
            assert.deepEqual(actual, expected);
        });
    });
    describe("#multiplyMatricies()", function() {
        it("should multiply two matrices", function() {
            // GIVEN
            var expected = [
                [-2, -7],
                [-22, 11],
                [32, -9]];
            // WHEN
            var actual = linearAlgebra.multiplyMatricies(
                [[4, -1],
                 [-4, -3],
                 [2, 5]],
                [[1, -2],
                 [6, -1]]);
            // THEN
            assert.deepEqual(actual, expected);
        });
    });
});
