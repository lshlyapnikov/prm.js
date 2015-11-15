/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

/* global angular, alert */

(function () {
  var app = angular.module("prm", ["ui.bootstrap"])

  app.controller("PrmController", () => {
    var self = this

    this.symbols = null

    this.startDate = new Date()
    this.startDateOpened = false

    this.endDate = new Date()
    this.endDateOpened = false

    this.openStartDate = ($event) => {
      $event.preventDefault()
      $event.stopPropagation()
      self.startDateOpened = true
    }

    this.openEndDate = ($event) => {
      $event.preventDefault()
      $event.stopPropagation()
      self.endDateOpened = true
    }

    this.submit = () => {
      alert("symbools: " + this.symbols + ", startDate: " + self.startDate + ", endDate: " + self.endDate)
    }
  })
})()
