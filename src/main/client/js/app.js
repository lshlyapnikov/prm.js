/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

/* global angular, alert */

(function () {
  var app = angular.module("prm", ["ui.bootstrap"])

  app.controller("PrmController", function() {
    var self = this

    this.symbols = null

    this.startDate = new Date()
    this.startDateOpened = false

    this.endDate = new Date()
    this.endDateOpened = false

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
