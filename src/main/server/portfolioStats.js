/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var numeric = require("numeric");

function mean(arr) {
    if (arr === undefined || 0 === arr.length) {
        throw {
            name: "TypeError",
            message: "Array arr is either undefined or empty"
        };
    }

    var sum = 0;
    var length = arr.length;
    for (var i = 0; i < length; i++) {
        sum += arr[i];
    }

    return sum/length;
}

/**
 * Calculates variance of a population or a sample.
 *
 * @param {Array} arr   Population or sample.
 * @param {bool} isPopulation   Optional parameter. If true, isPopulation variance returned, else sample variance.
 */
function variance(arr, isPopulation) {
    var mu = mean(arr);
    
    var sum = 0;
    var length = arr.length;
    for (var i = 0; i < length; i++) {
        sum += Math.pow(arr[i] - mu, 2);
    }

    if (true === isPopulation) {
        return sum/length;
    } else {
        return sum/(length - 1);
    }
}

function covariance(matrix, isPopulation) {
    if (matrix === undefined || 0 === matrix.length) {
        throw {
            name: "TypeError",
            message: "matrix is either undefined or empty"
        };
    }

    var rowNum = matrix.length;
    var colNum = matrix[0].length;

    if (undefined === rowNum || undefined === colNum) {
        throw {
            name: "TypeError",
            message: "covariance(maxtrix, isPopulation) -- 1st argument must be a matrix"
        };
    }

    // create an empty result matrix (colNum x colNum)
    var result = numeric.rep([colNum, colNum], 0);

    // create an empty matrix for median values, need it for covariance calculation
    var mu = numeric.rep([colNum], 0);

    var i, j, k;

    // calculate medians

    for(i = 0; i < rowNum; i++) {
        for(j = 0; j < colNum; j++) {
            mu[j] += matrix[i][j];
        }
    }

    for (j = 0; j < colNum; j++) {
        mu[j] = mu[j]/rowNum;
    }

    // calculate the covariance matrix

    // calculate the diagonal elements and the half that is below the diagonal
    for (j = 0; j < colNum; j++) {
        for (k = 0; k <= j; k++) {
            for (i = 0; i < rowNum; i++) {
                result[j][k] += (matrix[i][j] - mu[j]) * (matrix[i][k] - mu[k]);
            }
            if (true === isPopulation) {
                result[j][k] = result[j][k] / rowNum;
            } else {
                result[j][k] = result[j][k] / (rowNum - 1);
            }
        }
    }

    // copy the half from under the diagonal to the part that is above the diagonal
    for (j = 0; j < colNum; j++) {
        for (k = 0; k < j; k++) {
            result[k][j] = result[j][k];
        }
    }

    // that's it, now we have the covariance matrix
    return result;
}

function calculateReturnsFromPrices(prices) {
    if (prices === undefined || 0 === prices.length) {
        throw {
            name: "TypeError",
            message: "Array prices argument is either undefined or empty"
        };
    }

    var result = new Array(prices.length - 1);
    var i;
    for (i = 0; i < (prices.length - 1); i++) {
        result[i] = prices[i+1] / prices[i] - 1;
    }

    return result;
}

exports.mean = mean;
exports.variance = variance;
exports.covariance = covariance;
exports.calculateReturnsFromPrices = calculateReturnsFromPrices;
