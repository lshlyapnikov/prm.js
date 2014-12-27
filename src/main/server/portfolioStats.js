/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

var linearAlgebra = require("./linearAlgebra");
var numeric = require("numeric");

function PortfolioStats() {
  return {
    weights: NaN,
    expectedReturnRate: NaN,
    stdDev: NaN
  };
}

function meanValue(arr){
  if(arr === undefined || 0 === arr.length){
    throw new Error("InvalidArgument: Array arr is either undefined or empty");
  }

  var sum = 0;
  var length = arr.length;
  for(var i = 0; i < length; i++){
    sum += arr[i];
  }

  return sum / length;
}

/**
 * Calculates a vector of expected values (mean values).
 *
 * @param {Array} matrix   M x N matrix with data sets in columns. Each dataset contains M elemetns, N datasets total.
 * @returns {Array}   Returns a vector of N elements (N x 1 matrix). Each element is an expected value for the
 *                    corresponding column in the matrix argument.
 */
function mean(matrix){
  if(matrix === undefined || 0 === matrix.length){
    throw new Error("InvalidArgument: matrix is either undefined or empty");
  }

  var dimension = linearAlgebra.dim(matrix);
  var m = dimension[0];
  var n = dimension[1];

  if(undefined === m || undefined === n){
    throw new Error("InvalidArgument: " +
      "argument matrix has to be a matrix (2-dimensional array)");
  }

  var mu = linearAlgebra.matrix(n, 1, 0);

  var i, j;

  for(i = 0; i < m; i++){
    for(j = 0; j < n; j++){
      mu[j][0] += matrix[i][j];
    }
  }

  for(j = 0; j < n; j++){
    mu[j][0] = mu[j][0] / m;
  }

  return mu;
}

/**
 * Calculates variance of a population or a sample.
 *
 * @param {Array} arr   Population or sample.
 * @param {bool} isPopulation   Optional parameter. If true, isPopulation variance returned, else sample variance.
 */
function variance(arr, isPopulation){
  var mu = meanValue(arr);

  var sum = 0;
  var length = arr.length;
  for(var i = 0; i < length; i++){
    sum += Math.pow(arr[i] - mu, 2);
  }

  if(true === isPopulation){
    return sum / length;
  }else{
    return sum / (length - 1);
  }
}

function covariance(matrix, isPopulation){
  linearAlgebra.validateMatrix(matrix);

  var rowNum = matrix.length;
  var colNum = matrix[0].length;

  if("number" !== typeof rowNum || "number" !== typeof colNum){
    throw new Error("InvalidArgument: " +
      "covariance(maxtrix, isPopulation) -- 1st argument must be a matrix");
  }

  // create an empty result matrix (colNum x colNum)
  var result = linearAlgebra.matrix(colNum, colNum, 0);

  // calculate medians (Mx1 matrix)
  var muMx1 = mean(matrix);

  // calculate the covariance matrix

  var i, j, k;

  var divisor = true === isPopulation ? rowNum : (rowNum - 1);

  // calculate the diagonal elements and the half that is below the diagonal
  for(j = 0; j < colNum; j++){
    for(k = 0; k <= j; k++){
      for(i = 0; i < rowNum; i++){
        result[j][k] += (matrix[i][j] - muMx1[j][0]) * (matrix[i][k] - muMx1[k][0]);
      }
      result[j][k] = result[j][k] / divisor;
    }
  }

  // copy the half from under the diagonal to the part that is above the diagonal
  for(j = 0; j < colNum; j++){
    for(k = 0; k < j; k++){
      result[k][j] = result[j][k];
    }
  }

  linearAlgebra.validateMatrix(result);

  // that's it, now we have the covariance matrix
  return result;
}

/**
 * Calculates return rates for every period.
 *
 * @param {Array} prices
 * @returns {Array} return ratess for every price interval.
 */
function calculateReturnRatesFromPrices(prices){
  if(prices === undefined || 0 === prices.length){
    throw new Error("InvalidArgument: " +
      "Array prices argument is either undefined or empty");
  }

  var result = new Array(prices.length - 1);
  var i;
  for(i = 0; i < (prices.length - 1); i++){
    result[i] = prices[i + 1] / prices[i] - 1;
  }

  return result;
}

/**
 * Calculates return rates M x N matrix. Where M is the number of historical intervals
 * and N is the number of stocks in portfolio.
 *
 * @param {Array} priceMatrix   M x N matrix of prices. Stock prices in columns. N columns -- N stocks.
 * @returns {Array}  M-1 x N matrix of return rates.
 */
function calculateReturnRatesFromPriceMatrix(priceMatrix){
  var dimensions = linearAlgebra.dim(priceMatrix);
  var m = dimensions[0];
  var n = dimensions[1];

  var result = linearAlgebra.matrix(m - 1, n);

  var i, j;
  for(i = 0; i < (m - 1); i++){
    for(j = 0; j < n; j++){
      result[i][j] = priceMatrix[i + 1][j] / priceMatrix[i][j] - 1;
    }
  }

  return result;
}

/**
 * Calculates portfolio's Return Rate Standard Deviation.
 *
 * @param {Array} weights1xN   vector of stock weights in the portfolio;
 * @param {Array} covarianceNxN   portfolio covariance matrix.
 *
 * @return {Number}   Portfolio's Standard Deviation.
 */
function portfolioStdDev(weights1xN, covarianceNxN){
  var transposedWeightsNx1 = linearAlgebra.transpose(weights1xN);
  var tmp1xN = linearAlgebra.multiplyMatrices(weights1xN, covarianceNxN);
  var tmp1x1 = linearAlgebra.multiplyMatrices(tmp1xN, transposedWeightsNx1);
  var result = tmp1x1[0][0];
  result = Math.sqrt(result);
  return result;
}

/**
 * Calculates Global Minimum Variance Portfolio.
 *
 * @param {Array} returnRatesKxN   K x N return rates matrix, where
 *                                 K is the number of historical intervals,
 *                                 N is the number of stocks in portfolio;
 */
function globalMinVariancePortfolioFromReturnRates(returnRatesKxN){
  var returnRatesCovarianceNxN = covariance(returnRatesKxN);
  var weightsN = exports.globalMinVariancePortfolioWeightsFromReturnRatesCovariance(returnRatesCovarianceNxN);
  var weights1xN = [weightsN];
  var meanRrNx1 = mean(returnRatesKxN);
  var rr1x1 = linearAlgebra.multiplyMatrices(weights1xN, meanRrNx1);

  var portfolio = PortfolioStats();
  portfolio.weights = weightsN;
  portfolio.stdDev = portfolioStdDev(weights1xN, returnRatesCovarianceNxN);
  portfolio.expectedReturnRate = rr1x1[0][0];

  return portfolio;
}

/**
  * @param returnRatesCovarianceNxN
 * @returns {Array} an array of N elements. Every element is a stock weight in the portfolio.
 */
function globalMinVariancePortfolioWeightsFromReturnRatesCovariance(returnRatesCovarianceNxN){
  var b = linearAlgebra.dim(returnRatesCovarianceNxN)[0] + 1;
  var aMatrix = createAMatrix(returnRatesCovarianceNxN);
  var bMatrix = createBMatrix(b);
  var zMatrix = numeric.solve(aMatrix, bMatrix);
  return zMatrix.slice(0, b - 1);
}

function createAMatrix(returnRatesCovarianceNxN){
  var n = linearAlgebra.dim(returnRatesCovarianceNxN)[0];
  var a = n + 1;
  var twoBySigmaNxN = numeric.mul(2, returnRatesCovarianceNxN);
  var aMatrix = linearAlgebra.matrix(a, a, 0);
  aMatrix = linearAlgebra.copyMatrixInto(twoBySigmaNxN, aMatrix);
  var i;
  for(i = 0; i < a - 1; i++){
    aMatrix[a - 1][i] = 1;
    aMatrix[i][a - 1] = 1;
  }
  aMatrix[a - 1][a - 1] = 0;
  return aMatrix;
}

function createBMatrix(b){
  var bMatrix = linearAlgebra.matrix(b, 1, 0);
  bMatrix[b - 1][0] = 1;
  return bMatrix;
}

//exports.tangencyPortfolioFrmReturnRates = function(returnRatesKxN){
//  return [1];
//};
//
//exports.efficientPortfolios = function(){
//
//};

function loadPriceMatrix(loadHistoricalPricesFn, symbols) {
  if("function" !== typeof loadHistoricalPricesFn) {
    throw new Error("InvalidArgument: loadHistoricalPricesFn must be a function");
  }
  if(undefined === symbols || 0 === symbols.length) {
    throw new Error("InvalidArgument: symbols array is either undefined or empty");
  }

  var n = symbols.length;
  var transposedPriceMatrix = new Array(n);

  for(var i = 0; i < n; i++) {
    transposedPriceMatrix[i] = loadHistoricalPricesFn(symbols[i]);
  }

  return linearAlgebra.transpose(transposedPriceMatrix);
}

exports.PortfolioStats = PortfolioStats;
exports.meanValue = meanValue;
exports.mean = mean;
exports.variance = variance;
exports.covariance = covariance;
exports.calculateReturnRatesFromPrices = calculateReturnRatesFromPrices;
exports.calculateReturnRatesFromPriceMatrix = calculateReturnRatesFromPriceMatrix;
exports.portfolioStdDev = portfolioStdDev;
exports.globalMinVariancePortfolioFromReturnRates = globalMinVariancePortfolioFromReturnRates;
exports.globalMinVariancePortfolioWeightsFromReturnRatesCovariance = globalMinVariancePortfolioWeightsFromReturnRatesCovariance;
exports.createAMatrix = createAMatrix;
exports.createBMatrix  = createBMatrix;
exports.loadPriceMatrix = loadPriceMatrix;