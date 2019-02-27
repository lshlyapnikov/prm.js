prm.js
======

# Requirements
Node v4.2.0 <TODO: ???>

# How to Start <TODO: ????>
```shell
> yarn install
> node ./src/main/server/app.js 8080 ./src/main/client
<browser> http://localhost:8080/
```

# Build instructions
> flow-typed update
> yarn test-all

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
