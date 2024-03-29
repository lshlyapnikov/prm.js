// @flow strict
import { prettyPrint } from "numeric"
import { Observable, from } from "rxjs"
import * as assert from "assert"

import { mvef } from "./mvef"
import { type Matrix, transpose } from "./linearAlgebra"
import { vector } from "./vector"
import { assertEqualMatrices } from "./matrixAssert"
import { toFixedNumber, newArrayWithScale, logger } from "./utils"
import { PortfolioStats, calculateReturnRatesFromPriceMatrix, mean, covariance } from "./portfolioStats"
import * as testData from "./testData"

const log = logger("mvefTest")

describe("mvef", () => {
  describe("#mvef()", () => {
    it("step by step", () => {
      const pricesMxN: Matrix<number> = transpose([testData.NYX, testData.INTC])

      // Return Rate Matrix Calculation
      // prettier-ignore
      const nyxR: Array<number> = [
        -0.0205761316872428,
        0.164705882352941,
        0.308802308802309,
        -0.0573318632855567,
        -0.0953216374269006,
        -0.0116354234001294,
        -0.0562459123610203,
        0.836451836451837,
        0.0569811320754718,
        0.132809710817565,
        0.0381342578001891,
        -0.0601092896174863,
        0.0494186046511629,
        0.212065250846414,
        0.149060436769934,
        -0.0990055248618784,
        0.136865342163355,
        0.131175836030205,
        0.232500476826245,
        -0.162178891983906,
        -0.0993719985223495,
        0.144995898277277,
        -0.091706967580154,
        -0.046539144153027,
        0.260599793174767,
        -0.00935192780968008,
        0.351606492215965,
        -0.0289180247518687,
        0.0286435331230284,
        -0.150883218842002,
        0.104305114128864,
        -0.100470957613815,
        -0.0148342059336826,
        -0.1108650723354,
        0.0461564004648847,
        -0.0555467386129186,
        0.0920853638044026,
        0.182489613786736,
        -0.0749512036434612,
        0.0163173442115627,
        -0.104498269896194,
        -0.164451313755796,
        -0.0566037735849056,
        0.0711764705882354,
        -0.0329489291598024,
        -0.203482869581677,
        -0.0674904942965778,
        -0.140672782874618,
        -0.0269869513641755,
        -0.229807985370314,
        -0.210922041946973,
        0.162988966900702,
        -0.196636481241915,
        -0.232420826623725,
        0.079020979020979,
        0.294232015554115,
        0.294942413620431,
        -0.0823665893271461,
        -0.0109565950273915,
        0.0515551768214744,
        0.030388978930308,
        -0.105387337790012,
        -0.021978021978022,
        0.0125842696629215,
        -0.0745672436750998,
        0.126618705035971,
        0.134525329927629,
        0.102063789868668,
        -0.121212121212121,
        -0.0259589306470359,
        0.0485282418456643,
        -0.0424886191198787,
        0.0404120443740097,
        0.0723533891850723,
        -0.108309659090909,
        0.108323377140581,
        0.0610851598993893,
        0.163223840162547,
        -0.0413391557496361,
        0.138779228666869,
        -0.0909333333333332,
        -0.0504546787914346,
        -0.0237874575223972,
        -0.184493670886076,
        -0.138145129996119,
        0.143628995947771,
        0.0748031496062993,
        -0.0761904761904763,
        0.0178429817605077,
        0.120763537202961,
        0.0184219673270769,
        -0.1419795221843,
        -0.0556881463802705,
        0.0652906486941871,
        -0.00395413206801098,
        -0.0170702659785629,
        -0.00444264943457207,
        -0.0344827586206896
      ]
      // prettier-ignore
      const intcR: Array<number> = [
        -0.0576368876080692,
        0.110091743119266,
        0.00716253443526194,
        0.0448577680525164,
        -0.0403141361256546,
        0.0725586470267323,
        -0.0315361139369278,
        0.0120798319327731,
        0.150492994291645,
        -0.0347316193053677,
        0.0429906542056075,
        -0.0497311827956989,
        -0.0414898632720416,
        -0.0467289719626168,
        0.139318885448916,
        -0.0647644927536232,
        -0.14818401937046,
        -0.0261512222853895,
        -0.0554582603619381,
        0.0265760197775031,
        -0.0933172787477423,
        0.0544488711819389,
        -0.0528967254408061,
        0.09375,
        0.0510638297872341,
        0.0375939849624061,
        0.00724637681159424,
        -0.0536801328168234,
        0.0350877192982455,
        -0.0474576271186441,
        -0.0367734282325031,
        0.124384236453202,
        0.0366922234392113,
        0.0702588483888009,
        -0.00493583415597243,
        0.0952380952380951,
        0.00407608695652195,
        0.0405953991880919,
        -0.0264412657130472,
        0.0222617987533393,
        -0.208623693379791,
        -0.0478811227297744,
        0.0606936416184971,
        0.0506811989100817,
        0.0477178423236513,
        -0.0732673267326733,
        0.0331196581196582,
        0.0372285418821097,
        -0.180957128614157,
        -0.144248326232502,
        -0.131578947368421,
        0.0622440622440623,
        -0.120277563608327,
        -0.00175284837861522,
        0.17910447761194,
        0.0498883097542815,
        0.00496453900709226,
        0.0529287226534934,
        0.162868632707775,
        0.0634005763688759,
        -0.0368563685636856,
        -0.0236353404614518,
        0.0121037463976943,
        0.0626423690205011,
        -0.0487674169346195,
        0.0664788732394366,
        0.0855784469096672,
        0.0248175182481751,
        -0.0555555555555555,
        -0.0920060331825039,
        0.0592469545957919,
        -0.135912179822269,
        0.0865093768905021,
        0.0445434298440981,
        0.0634328358208953,
        -0.00601503759398503,
        0.0206757438224912,
        0.00889328063241113,
        -0.0602350636630754,
        0.146951537258989,
        -0.0199909132212631,
        -0.0152990264255912,
        0.00753295668549914,
        -0.0897196261682243,
        0.0600616016427105,
        0.150121065375303,
        0.024,
        -0.0263157894736842,
        0.089527027027027,
        0.0251937984496124,
        0.0465028355387525,
        0.00975433526011549,
        -0.0833631484794275,
        0.0312256049960968,
        -0.0355791067373202,
        -0.0255102040816327,
        -0.0873942811115586,
        -0.05207413945278
      ]
      const expectedReturnRatesMatrix = transpose([nyxR, intcR])
      const returnRatesMatrix = calculateReturnRatesFromPriceMatrix(pricesMxN)
      assertEqualMatrices(returnRatesMatrix, expectedReturnRatesMatrix, 6)
      assertEqualMatrices(returnRatesMatrix, expectedReturnRatesMatrix, 6)

      // Mean Return Rate Calculation
      const expectedMeanReturnRatesMatrix = [[0.01674256058568205], [0.00504504938397936]]
      const meanReturnRatesMatrix = mean(returnRatesMatrix)
      assertEqualMatrices(meanReturnRatesMatrix, expectedMeanReturnRatesMatrix, 6)

      // Covariance Matrix Calculation
      const expectedReturnRatesCovariance: Matrix<number> = [
        [0.02268916431463616, 0.00324263433660444],
        [0.00324263433660444, 0.0057115697552338]
      ]
      const returnRatesCovariance = covariance(returnRatesMatrix)
      assertEqualMatrices(returnRatesCovariance, expectedReturnRatesCovariance, 6)
    })
    it("should load historical prices using the specified provider and return MVEF numbers", (done) => {
      // GIVEN (I believe I took those numbers from the R examples in the lecture notes)
      const prices = { NYX: testData.NYX, INTC: testData.INTC }
      const expectedMinRisk = 7.37
      const expectedReturnRate = 0.64
      const expectedWeights = [0.11, 0.89]
      const numOfRandomWeights = 5000

      function mockHistoricalPricesProvider(symbol: string): Observable<number> {
        return from(prices[symbol])
      }

      // WHEN
      mvef(mockHistoricalPricesProvider, vector(2, ["NYX", "INTC"]), numOfRandomWeights, false).then(
        (array: Array<PortfolioStats>) => {
          // THEN
          assert.strictEqual(array.length, numOfRandomWeights)

          const [minStdDev, minStdDevIndx]: [number, number] = array.reduce(
            (state: [number, number], p: PortfolioStats, currentIndex: number) => {
              if (p.stdDev < state[0]) {
                return [p.stdDev, currentIndex]
              } else {
                return state
              }
            },
            [Number.MAX_VALUE, -1]
          )

          assert.notStrictEqual(minStdDevIndx, -1)

          const actualMinRisk = minStdDev * 100
          const actualReturnRate = array[minStdDevIndx].expectedReturnRate * 100
          const actualWeights = array[minStdDevIndx].weights

          log.debug("min StdDev, %: ", actualMinRisk)
          log.debug("return rate, %: ", actualReturnRate)
          log.debug("weights: ", prettyPrint(actualWeights))

          assert.strictEqual(toFixedNumber(actualMinRisk, 2), expectedMinRisk)
          assert.strictEqual(toFixedNumber(actualReturnRate, 2), expectedReturnRate)
          assert.deepStrictEqual(newArrayWithScale(actualWeights, 2), expectedWeights)

          done()
        }
      )
    })
  })
})
