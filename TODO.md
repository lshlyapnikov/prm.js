# TODO

1.  [x] alphavantage returns closing prices in the descending order, reverse it before calcuations,
        `src/alphavantage/DailyAdjusted.test.js` has a test case for this
2.  [x] replace yahoFinanceApi with alphavantage/DailyAdjusted
3.  [x] enable all skipped prmController tests, search for '.skip'
4.  [x] add `// @flow` to `server/utils.js`
5.  [x] remove `// flowlint-next-line untyped-import:off` in `src/alphavantage/DailyAdjusted.js`
6.  [x] replace console.log with util.log
7.  [x] add `// @flow` to the rest of the files
8.  [x] fix `mvef.js` and add types
9.  [ ] allow loading `Prices` directly in the `prmController`
10. [x] add ESLint
    - https://www.npmjs.com/package/eslint-plugin-react
    - https://github.com/joarwilk/flowgen/blob/master/.eslintrc
11. [ ] [UI] switch to using react hooks:
    - https://reactjs.org/docs/hooks-state.html
    - https://reactjs.org/docs/hooks-rules.html
12. [ ] either remove `server/app.js` or add `// @flow strict` to it
13. [x] implement prm.js CLI before the GUI
    [ ] cache/memoize on disk `loadHistoricalPricesAsArray(s, startDate, endDate)` call
        src/server/prmController.js:87
        memoize the raw closing prices, the entire stream
    [x] Change `--years` to `--start-date` and `--end-date`
    [x] allow specifying risk free daily interest rate, currently hardcoded.
    [x] risk free interest rate, is it daily or annual in the formula??? Has to be daily, daily prices, daily return rates
    [ ] validate the output from the CLI
    [x] yarn start-cli --api-key=<KEY> --years=1 --stocks=ACB,F,GOOG,XOM,AA,ARNC,BAC,INTC,JCP,PG
14. [x] fix the warning that happens every time I add a dependency (actually last time it was a dev dependency)
    ```
    warning "react-scripts > pnp-webpack-plugin > ts-pnp@1.0.0" has unmet peer dependency "typescript@*".
    warning " > eslint-config-standard@12.0.0" has unmet peer dependency "eslint-plugin-import@>=2.13.0".
    warning " > eslint-config-standard@12.0.0" has unmet peer dependency "eslint-plugin-node@>=7.0.0".
    warning " > eslint-config-standard@12.0.0" has unmet peer dependency "eslint-plugin-promise@>=4.0.0".
    warning " > eslint-config-standard@12.0.0" has unmet peer dependency "eslint-plugin-standard@>=4.0.0".
    ```
15. riskFreeRate should be a ratio not percents, 1.0 in the below looks wrong:
    `analyzeUsingPortfolioHistoricalPrices(["NYX", "INTC"], new Date("1111/11/11"), new Date("1111/11/11"), 1.0)`
    also it is daily risk free return rate, not annual
16. [ ] [UI] Give an option to load stock prices in Yahoo CSV format
17. [ ] [UI] Give an option to load stock prices in Google Finance CSV format
18. [ ] [UI] Give an option to load stock prices in Alphavantage CSV format
19. [ ] Set up GCP App Engine, use free tier.
    - https://cloud.google.com/free/docs/gcp-free-tier
    - https://cloud.google.com/appengine/docs/standard/python3/config/appref#automatic_scaling
    app.yaml setting:
    ```
    runtime: nodejs10
    instance_class: F1
    automatic_scaling:
        min_instances: 0
        max_instances: 1
        max_concurrent_requests: 50
    ```
20. [ ] Add a check that all symbols have the same number of prices in the price matrix
        e.g. if there is not enough market data some symbols might have wrong number of rows (closing prices)