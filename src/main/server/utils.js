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
            name: "TypeError",
            message: "Array arr is either undefined or empty"
        };
    }

    if (typeof convertOneElement != "function") {
        throw {
            name: "TypeError",
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
            name: "TypeError",
            message: "Array arr is either undefined or empty"
        };
    }

    if (typeof convertOneElement != "function") {
        throw {
            name: "TypeError",
            message: "convertOneElement argument should be a function with one argument"
        };
    }

    var i;
    for (i = 0; i < arr.length; i++) {
        arr[i] = convertOneElement(arr[i]);
    }
}

exports.convertArrayElements = convertArrayElements;
exports.updateArrayElements = updateArrayElements;
