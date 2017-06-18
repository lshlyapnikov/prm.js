/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

/* global angular, alert */

(function () {
  var app = angular.module("prm", ["ui.bootstrap"])

  app.controller("PrmController", ($scope) => {
    $scope.symbols = null

    $scope.startDate = new Date()
    $scope.startDateOpened = false

    $scope.endDate = new Date()
    $scope.endDateOpened = false

    $scope.riskFreeRateOfReturnPercent = null

    $scope.openStartDate = () => {
      $scope.startDateOpened = true
    }

    $scope.openEndDate = () => {
      $scope.endDateOpened = true
    }

    $scope.submit = () => {
      alert("symbols: " + $scope.symbols + ", startDate: " + $scope.startDate + ", endDate: " + $scope.endDate +
        "riskFreeInterestRatePercent: " + $scope.riskFreeRateOfReturnPercent)
      //
      //$http({
      //  method: "GET",
      //  url: "/analyze",
      //  params: {
      //    symbols: self.symbols,
      //    startDate: self.startDate,
      //    endDate: self.endDate,
      //    riskFreeInterestRatePercent: self.riskFreeInterestRatePercent
      //  }
      //}).then((response) => {
      //  $scope.result = response.data
      //}, (error) => {
      //  $scope.result = error.statusText
      //})
    }
  })
})()
