# TODO

1.  [x] alphavantage returns closing prices in the descending order, reverse it before calcuations,
        `src/alphavantage/DailyAdjusted.test.js` has a test case for this
2.  [ ] replace yahoFinanceApi with alphavantage/DailyAdjusted
3.  [ ] enable all skipped prmController tests, search for '.skip'
4.  [x] add `// @flow` to `server/utils.js`
5.  [x] remove `// flowlint-next-line untyped-import:off` in `src/alphavantage/DailyAdjusted.js`
6.  [ ] replace console.log with util.log
7.  [ ] add `// @flow` to the rest of the files
8.  [x] fix `mvef.js` and add types
9.  [ ] allow loading `Prices` directly in the `prmController`
10. [ ] add ESLint
    - https://www.npmjs.com/package/eslint-plugin-react
    - https://github.com/joarwilk/flowgen/blob/master/.eslintrc
11. [ ] switch to using react hooks:
    - https://reactjs.org/docs/hooks-state.html
    - https://reactjs.org/docs/hooks-rules.html
