/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

// http://jshint.com/docs/#config
/* jshint strict: false */
/* jshint undef: true */
/* jshint unused: true */
/* jshint browser: true */
/* jshint -W033 */
/* jshint -W119 */
/* global angular */

(function () {
  var app = angular.module("prm", ["ui.bootstrap"])

  app.controller("PrmController", function() {
    var self = this

    this.symbols = null

    this.startDate = new Date()
    this.startDateOpened = null

    this.endDate = new Date()
    this.endDateOpened = null

    this.openStartDate = function($event) {
      $event.preventDefault()
      $event.stopPropagation()
      self.startDateOpened = true
    }

    this.openEndDate = function($event) {
      $event.preventDefault()
      $event.stopPropagation()
      self.endDateOpened = true
    }

    this.submit = function() {
      alert("symbools: " + this.symbols + ", startDate: " + self.startDate + ", endDate: " + self.endDate)
    }

  })

})()
