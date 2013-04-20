/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global exports */

function convertArrayElements(arr, convertOneElement) {
    if (arr === undefined || 0 === arr.length) {
        throw {
            name: "InvalidArgument",
            message: "Array arr is either undefined or empty"
        };
    }

    if (typeof convertOneElement != "function") {
        throw {
            name: "InvalidArgument",
            message: "convertOneElement argument should be a function with one argument"
        };
    }

    var length = arr.length;
    var result = new Array(length);

    var i;
    for (i = 0; i < length; i++) {
        result[i] = convertOneElement(arr[i]);
    }

    return result;
}

function updateArrayElements(arr, convertOneElement) {
    if (arr === undefined || 0 === arr.length) {
        throw {
            name: "InvalidArgument",
            message: "Array arr is either undefined or empty"
        };
    }

    if (typeof convertOneElement != "function") {
        throw {
            name: "InvalidArgument",
            message: "convertOneElement argument should be a function with one argument"
        };
    }

    var i;
    for (i = 0; i < arr.length; i++) {
        arr[i] = convertOneElement(arr[i]);
    }
}

function generateRandomWeightsMatrix(rowNum, colNum) {
    if (rowNum === undefined || rowNum <= 0) {
        throw {
            name: "InvalidArgument",
            message: "Invalid argument rowNum: " + rowNum
        };
    }

    if (colNum === undefined || colNum <= 0) {
        throw {
            name: "InvalidArgument",
            message: "Invalid argument colNum: " + colNum
        };
    }

    var matrix = new Array(rowNum);

    var i, j;
    var vector;
    var sum;
    for (i = 0; i < rowNum; i++) {
        vector = new Array(colNum);
        sum = 0;
        // generate random numbers
        for (j = 0; j < colNum; j++) {
            vector[j] = Math.random();
            sum += vector[j];
        }
        // normailze all numbers, so vector sum equals 1
        for (j = 0; j < colNum; j++) {
            vector[j] /= sum;
        }
        matrix[i] = vector;
    }
    
    return matrix;
}

exports.convertArrayElements = convertArrayElements;
exports.updateArrayElements = updateArrayElements;
exports.generateRandomWeightsMatrix=generateRandomWeightsMatrix;
