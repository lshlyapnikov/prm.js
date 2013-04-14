// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global console, exports */

function index() {
    console.log("requestHandler.index()");
}

function load() {
    console.log("requestHandler.load()");
}

exports.index = index;
exports.load = load;
