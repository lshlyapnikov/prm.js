/// Author: Leonid Shlyapnikov
/// LGPL Licencsed

var _ = require("underscore")
var log4js = require('log4js')

function convertArrayElements(arr, convertOneElement) {
  if (!Array.isArray(arr)) {
    throw new Error("Array arr is either undefined or empty")
  }

  if (typeof convertOneElement !== "function") {
    throw new Error("convertOneElement argument should be a function with one argument")
  }

  var length = arr.length
  var result = new Array(length)

  var i
  for (i = 0; i < length; i++) {
    result[i] = convertOneElement(arr[i])
  }

  return result
}

function updateArrayElements(arr, convertOneElement) {
  if (!Array.isArray(arr)) {
    throw new Error("InvalidArgument: Array arr is either undefined or empty")
  }

  if (typeof convertOneElement !== "function") {
    throw new Error("InvalidArgument: convertOneElement argument should be a function with one argument")
  }

  var i
  for (i = 0; i < arr.length; i++) {
    arr[i] = convertOneElement(arr[i])
  }
}

function updateMatrixElements(matrix, convertOneElement) {
  if (!Array.isArray(matrix)) {
    throw new Error("InvalidArgument:  matrix is either undefined or empty")
  }

  if (typeof convertOneElement !== "function") {
    throw new Error("InvalidArgument: convertOneElement argument should be a function with one argument")
  }

  var m = matrix.length
  var n = matrix[0].length

  var i, j
  for (i = 0; i < m; i++) {
    for (j = 0; j < n; j++) {
      matrix[i][j] = convertOneElement(matrix[i][j])
    }
  }
}

/**
 * Generates random weights matrix. Sum of all elements in the row equals 1.
 * Valid arguments: rowNum > 0 and colNum > 1
 *
 * @param {Integer} rowNum   Number of rows, number of random weight sets, must be > 0.
 * @param {Integer} colNum   Number of columns, number of stock weights per set, must be > 1.
 * @throws {Object} {name: "InvalidArgument", message: "description"}   when invalid argument passed.
 * @return {Array}          rowNum x colNum matrix, where one row is one random set of weights.
 */
function generateRandomWeightsMatrix(rowNum, colNum) {
  if ("number" !== typeof rowNum || rowNum <= 0) {
    throw new Error("Invalid argument rowNum: " + rowNum + ", must be > 0")
  }

  if ("number" !== typeof colNum || colNum <= 1) {
    throw new Error("Invalid argument colNum: " + colNum + ", must be > 1")
  }

  var matrix = new Array(rowNum)

  var i, j
  var vector
  var sum
  for (i = 0; i < rowNum; i++) {
    vector = new Array(colNum)
    sum = 0
    // generate random numbers
    for (j = 0; j < colNum; j++) {
      vector[j] = Math.random()
      sum += vector[j]
    }
    // normalize all numbers, so vector sum equals 1
    for (j = 0; j < colNum; j++) {
      vector[j] /= sum
    }
    matrix[i] = vector
  }

  return matrix
}

function strToNumber(str) {
  return Number(str)
}

function noop(str) {
  return str
}

exports.setMatrixElementsScale = function (matrix, scale) {
  updateMatrixElements(matrix, function (num) {
    return num.toFixed(scale)
  })
  return matrix
}

exports.setArrayElementsScale = function (arr, scale) {
  updateArrayElements(arr, function (num) {
    return num.toFixed(scale)
  })
  return arr
}

exports.newArrayWithScale = function (arr, scale) {
  if (!Array.isArray(arr)) {
    throw new Error("InvalidArgument: arr must be a non-empty array object")
  }

  var n = arr.length
  var result = new Array(n)

  var i
  for (i = 0; i < n; i++) {
    result[i] = arr[i].toFixed(scale);
  }

  return result
}

function getFieldIndexes(csvHeader, fields) {
  var headerFields = csvHeader.split(",")
  var i = 0
  var result = _(headerFields).reduce((acc, field) => {
    if (_(fields).contains(field)) {
      acc.push(i)
    }
    i++
    return acc
  }, [])

  if (result.length !== fields.length) {
    throw new Error("InvalidState: csvHeader: '" + csvHeader +
    "' does not contain some of the requested fields: " + fields)
  } else {
    return result
  }
}

function parseLineAndKeepFieldsWithIndexes(line, fieldIndexes, fieldConverters) {
  const values = line.split(",")
  const result = []
  for (var i = 0; i < fieldIndexes.length; i++) {
    var fieldIndex = fieldIndexes[i]
    var fieldConverter = fieldConverters[i]
    var value = values[fieldIndex].trim()
    result.push(fieldConverter(value))
  }
  return result
}

exports.parseCsvStr = function parseCsvStr(csvStr, fieldNames, fieldConverters) {
  var lines = csvStr.split("\n").filter(line => !_.isEmpty(line))
  if (_.isEmpty(lines)) {
    return []
  } else {
    var fieldIndexes = getFieldIndexes(lines[0], fieldNames)
    var valueLines = lines.slice(1)
    return _(valueLines).map(line => {
      return parseLineAndKeepFieldsWithIndexes(line, fieldIndexes, fieldConverters)
    })
  }
}

exports.logger = function (category) {
  var logger = log4js.getLogger(category)
  logger.setLevel(log4js.levels.INFO)
  return logger
}

exports.convertArrayElements = convertArrayElements
exports.updateArrayElements = updateArrayElements
exports.updateMatrixElements = updateMatrixElements
exports.generateRandomWeightsMatrix = generateRandomWeightsMatrix
exports.strToNumber = strToNumber
exports.noop = noop
