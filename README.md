# prm.js

# Requirements

- Node v12.x.x https://nodejs.org/en/download/
- Alpha Vantage API key: https://www.alphavantage.co/support/#api-key

# Build Instructions

Save Alpha Vantage API key in `test-config.js` in project directory, see `test-config.js.sample`.

## Yarn

```shell
$ yarn install
$ yarn global add flow-typed
$ flow-typed update
$ yarn test-all
$ yarn build-all
$ yarn start-cli --help
$ yarn start-cli --stocks=IBM,MSFT --start-date=2020-01-01 --end-date=2020-03-01 --delay-millis=0 --annual-risk-free-interest-rate=1 --api-key=<Alphavantage API key>
```

## NPM
```
$ npm install
$ npm run test-all
$ npm run build-all
$ node --experimental-modules ./build-cli/cli/prm.js --help
$ node --experimental-modules ./build-cli/cli/prm.js --stocks=IBM,MSFT --years=3 --delay-millis=0 --annual-risk-free-interest-rate=1 --api-key=<Alphavantage API key>
```

# Running Tests

- Request free Alphavantage API Key: https://www.alphavantage.co/support/#api-key
- > cp ./.test-config.js.sample ./.test-config.js
- Update `alphavantage.apiKey` in `./.test-config.js`
- > yarn test

# How to Run One Test

https://facebook.github.io/jest/docs/en/cli.html#testnamepattern-regex

```
> yarn test --testNamePattern=.*linear.*
```

# Notes

## Market Data Providers

### Alpha Advantage https://www.alphavantage.co/ (Free API Key, JSON, CSV)

Daily Time Series with Splits and Dividend Events (daily adjusted close price):
see `"5. adjusted close"`
https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=MSFT&apikey=demo
Frequency call limit: 5 calls/minute, else consider a Premium Membership (100 calls/minute)
