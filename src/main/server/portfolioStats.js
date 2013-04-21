/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var numeric = require("numeric");


function meanValue(arr) {
    if (arr === undefined || 0 === arr.length) {
        throw {
            name: "InvalidArgument",
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
 * Calculates a vector of expected values (mean values).
 * 
 * @param {Matrix} matrix   M x N matrix with data sets in columns. Each dataset contains M elemetns, N datasets total.
 * @returns {Array}   Returns a vector of N elemetns (1 x N matrix). Each element is an expected value for the 
 *                    corresponding column in the matrix argument.
 */
function mean(matrix) {
    if (matrix === undefined || 0 === matrix.length) {
        throw {
            name: "InvalidArgument",
            message: "matrix is either undefined or empty"
        };
    }

    var m = matrix.length;
    var n = matrix[0].length;

    if (undefined === n) {
        return [meanValue(matrix)];
    }

    // create an empty vector for median values
    var mu = numeric.rep([n], 0);

    var i, j;

    for(i = 0; i < m; i++) {
        for(j = 0; j < n; j++) {
            mu[j] += matrix[i][j];
        }
    }

    for (j = 0; j < n; j++) {
        mu[j] = mu[j]/m;
    }

    return mu;
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
            name: "InvalidArgument",
            message: "matrix is either undefined or empty"
        };
    }

    var rowNum = matrix.length;
    var colNum = matrix[0].length;

    if (undefined === rowNum || undefined === colNum) {
        throw {
            name: "InvalidArgument",
            message: "covariance(maxtrix, isPopulation) -- 1st argument must be a matrix"
        };
    }

    // create an empty result matrix (colNum x colNum)
    var result = numeric.rep([colNum, colNum], 0);

    // calculate medians
    var mu = mean(matrix);

    // calculate the covariance matrix

    var i, j, k;

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

/**
 * Calculates returns for every period.
 *
 * @param {Array} prices
 * @returns {Array} return ratess for every price interval.
 */
function calculateReturnRatesFromPrices(prices) {
    if (prices === undefined || 0 === prices.length) {
        throw {
            name: "InvalidArgument",
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

/**
 * Calculates return rates M x N matrix. Where M is the number of historical intervals
 * and N is the number of stocks in portfolio.
 * 
 * @param {Matrix} priceMatrix   M x N matrix of prices. Stock prices in columns. N columns -- N stocks.
 * @returns {Matrix}  M-1 x N matrix of return rates.
 */
function calculateReturnRatesFromPriceMatrix(priceMatrix) {
    var dimensions = numeric.dim(priceMatrix);
    var m = dimensions[0];
    var n = dimensions[1];

    var result = numeric.rep([m-1, n], 0);

    var i, j;
    for (i = 0; i < (m - 1); i++) {
        for (j = 0; j < n; j++) {
            result[i][j] = priceMatrix[i+1][j]/priceMatrix[i][j] - 1;
        }
    }

    return result;
}

exports.meanValue = meanValue;
exports.mean = mean;
exports.variance = variance;
exports.covariance = covariance;
exports.calculateReturnRatesFromPrices = calculateReturnRatesFromPrices;
exports.calculateReturnRatesFromPriceMatrix = calculateReturnRatesFromPriceMatrix;

