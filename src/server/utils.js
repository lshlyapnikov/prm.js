/// Author: Leonid Shlyapnikov
/// LGPL Licensed
// @flow strict
import log4js from "log4js"
import { LocalDate, DateTimeFormatter } from "@js-joda/core"

type Success<A> = {| success: true, value: A |}
type Failure = {| success: false, error: Error |}
export type Result<A> = Failure | Success<A>

export type JestDoneFn = {|
  (): void,
  fail: (error: Error) => void
|}

export function logger(category: string): log4js.Logger {
  const logger: log4js.Logger = log4js.getLogger(category)
  logger.level = log4js.levels.INFO
  return logger
}

function updateArrayElements<A>(arr: Array<A>, convertOneElement: (A) => A): void {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = convertOneElement(arr[i])
  }
}

function updateMatrixElements<A>(matrix: Array<Array<A>>, convertOneElement: (A) => A): void {
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
export function generateRandomWeightsMatrix(rowNum: number, colNum: number): Array<Array<number>> {
  if (rowNum <= 0) {
    throw new Error("Invalid argument rowNum: " + rowNum + ", must be > 0")
  }

  if (colNum <= 1) {
    throw new Error("Invalid argument colNum: " + colNum + ", must be > 1")
  }

  const matrix: Array<Array<number>> = new Array(rowNum)

  for (let i = 0; i < rowNum; i++) {
    matrix[i] = generateRandomWeights(colNum)
  }

  return matrix
}

export function generateRandomWeights(n: number): Array<number> {
  const vector: Array<number> = new Array(n)
  var sum: number = 0

  // generate random numbers
  for (let j = 0; j < n; j++) {
    vector[j] = Math.random()
    sum += vector[j]
  }

  // normalize all numbers, so vector sum equals 1
  for (let j = 0; j < n; j++) {
    vector[j] /= sum
  }

  return vector
}

export function strToNumber(str: string): number {
  return Number(str)
}

export function id<A>(a: A): A {
  return a
}

export function toFixedNumber(num: number, fractionDigits: number): number {
  const multiplier = Math.pow(10, fractionDigits)
  return Math.round(num * multiplier) / multiplier
}

export function setMatrixElementsScale(matrix: Array<Array<number>>, scale: number): Array<Array<number>> {
  updateMatrixElements(matrix, (num: number) => toFixedNumber(num, scale))
  return matrix
}

export function setArrayElementsScale(arr: Array<number>, scale: number): Array<number> {
  updateArrayElements(arr, (num: number) => toFixedNumber(num, scale))
  return arr
}

export function newArrayWithScale(arr: Array<number>, scale: number): Array<number> {
  return arr.map((a: number) => toFixedNumber(a, scale))
}

export function parseDate(str: string): LocalDate {
  return LocalDate.parse(str)
}

export function parseDateSafe(str: string): Result<LocalDate> {
  try {
    const d = parseDate(str)
    return { success: true, value: d }
  } catch (e) {
    return { success: false, error: e }
  }
}

const formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

export function formatDate(date: LocalDate): string {
  return date.format(formatter)
}

export function today(): LocalDate {
  return LocalDate.now()
}

export function cumulativeReturnRate(returnRate: number, periods: number): number {
  return Math.pow(1 + returnRate, periods) - 1
}

export function periodReturnRate(returnRate: number, periods: number): number {
  return Math.pow(returnRate + 1.0, 1.0 / periods) - 1
}
