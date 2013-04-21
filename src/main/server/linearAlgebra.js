/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global require, exports */

// for some reason the current numeric.js implementation does not check matrix dimensions before multiplication.
// numeric.dot() does too many assumption/deductions -- don't really like it. Want my functions to throw up
// if vector is passed instead of matrix or if matrix dimensions do not allow multiplication.

var numeric = require("numeric");

function dim(matrix) {
    if (undefined === matrix) {
        throw {
            name: "InvalidArgument",
            message: "Argument matrix is undefined"
        };
    }

    var m = matrix.length;
    if (undefined === m) {
        throw {
            name: "InvalidArgument",
            message: "Argument matrix does not have rows"
        };
    }

    var n = matrix[0].length;
    if (undefined === n) {
        throw {
            name: "InvalidArgument",
            message: "Argument matrix does not have columns"
        };
    }

    return [m, n];
}

function matrix(m, n, initialValue) {
    if (undefined === m || m <= 0) {
        throw {
            name: "InvalidArgument",
            message: "invalid m: " + m
        };
    }
    if (undefined === n || n <= 0) {
        throw {
            name: "InvalidArgument",
            message: "invalid n: " + n
        };
    }

    var result = new Array(m);
    var i,j;
    
    for (i = 0; i < m; i++) {
        result[i] = new Array(n);
    }

    if (undefined !== initialValue) {
        for (i = 0; i < m; i++) {
            for (j = 0; j < n; j++) {
                result[i][j] = initialValue;
            }
        }
    }    

    return result;        
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin???
function transpose(matrixMxN) {
    var dimensions = dim(matrixMxN);
    var m = dimensions[0];
    var n = dimensions[1];

    var resultNxM = matrix(n, m);
    var i, j;
    for (i = 0; i < m; i++) {
        for (j = 0; j < n; j++) {
            resultNxM[j][i] = matrixMxN[i][j];
        }
    }

    return resultNxM;        
}

// TODO(lshlyapnikov) will be slow, C++ Node plugin??, map reduce?? 3rd party library???
function multiplyMatricies(mXn, nXm) {
    if (undefined === mXn) {
        throw {
            name: "InvalidArgument",
            message: "Argument mXn is undefined"
        };
    }

    if (undefined === nXm) {
        throw {
            name: "InvalidArgument",
            message: "Argument nXm is undefined"
        };
    }

    var dim0 = dim(mXn);
    var dim1 = dim(nXm);

    if (dim0[1] !== dim1[0]) {
        throw {
            name: "InvalidArgument",
            message: "Invalid matrix dimensions. Cannot multiply " + dim0 + " matrix by " + dim1
        };
    }

    //var m = dim0[0];
    //var n = dim0[1];

    // delegate to numeric.js
    return numeric.dot(mXn, nXm);    
}

exports.dim = dim;
exports.matrix = matrix;
exports.transpose = transpose;
exports.multiplyMatricies = multiplyMatricies;
