// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* global console, exports */

function route(handle, pathname) {
    console.log("About to route a request for " + pathname);
    var handleFunction = handle[pathname];
    if (typeof handleFunction === 'function') {
        handleFunction();
    } else {
        console.log("No request handler found for " + pathname);
    }
}

exports.route = route;
