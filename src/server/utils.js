/// Author: Leonid Shlyapnikov
/// LGPL Licencsed
// @flow strict
import _ from "underscore"
import log4js from 'log4js'

function updateArrayElements<A>(arr: Array<A>, convertOneElement: A => A): void {
  if (!Array.isArray(arr)) {
    throw new Error("InvalidArgument: Array arr is either undefined or empty")
  }

  if (typeof convertOneElement !== "function") {
    throw new Error("InvalidArgument: convertOneElement argument should be a function with one argument")
  }

  var i = 0
  for (i = 0; i < arr.length; i++) {
    arr[i] = convertOneElement(arr[i])
  }
}

function updateMatrixElements<A>(matrix: Array<Array<A>>, convertOneElement: A => A): void {
  if (!Array.isArray(matrix)) {
    throw new Error("InvalidArgument:  matrix is either undefined or empty")
  }

  if (typeof convertOneElement !== "function") {
    throw new Error("InvalidArgument: convertOneElement argument should be a function with one argument")
  }

  const m = matrix.length
  const n = matrix[0].length

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
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
function generateRandomWeightsMatrix(rowNum: number, colNum: number): Array<Array<number>> {
  if ("number" !== typeof rowNum || rowNum <= 0) {
    throw new Error("Invalid argument rowNum: " + rowNum + ", must be > 0")
  }

  if ("number" !== typeof colNum || colNum <= 1) {
    throw new Error("Invalid argument colNum: " + colNum + ", must be > 1")
  }

  var matrix: Array<Array<number>> = new Array(rowNum)

  for (let i = 0; i < rowNum; i++) {
    const vector: Array<number> = new Array(colNum)
    var sum: number = 0
    // generate random numbers
    for (let j = 0; j < colNum; j++) {
      vector[j] = Math.random()
      sum += vector[j]
    }
    // normalize all numbers, so vector sum equals 1
    for (let j = 0; j < colNum; j++) {
      vector[j] /= sum
    }
    matrix[i] = vector
  }

  return matrix
}

function strToNumber(str: string): number {
  return Number(str)
}

function noop(str: string): string {
  return str
}

function toFixedNumber (num: number, fractionDigits: number): number {
  const multiplier = Math.pow(10, fractionDigits)
  return Math.round(num * multiplier) / multiplier
}

exports.toFixedNumber = toFixedNumber

function setMatrixElementsScale(matrix: Array<Array<number>>, scale: number): Array<Array<number>> {
  updateMatrixElements(matrix, (num: number) => toFixedNumber(num, scale))
  return matrix
}

exports.setMatrixElementsScale = setMatrixElementsScale

exports.setArrayElementsScale = function (arr: Array<number>, scale: number) {
  updateArrayElements(arr, (num: number) =>  toFixedNumber(num, scale))
  return arr
}

exports.newArrayWithScale = function (arr: Array<number>, scale: number): Array<number> {
  if (!Array.isArray(arr)) {
    throw new Error("InvalidArgument: arr must be a non-empty array object")
  }

  var n: number = arr.length
  var result: Array<number> = new Array(n)

  for (let i = 0; i < n; i++) {
    result[i] = toFixedNumber(arr[i], scale)
  }

  return result
}

exports.logger = function (category: string): log4js.Logger {
  const logger: log4js.Logger = log4js.getLogger(category)
  logger.level = log4js.levels.INFO
  return logger
}

exports.generateRandomWeightsMatrix = generateRandomWeightsMatrix
exports.strToNumber = strToNumber
exports.noop = noop
