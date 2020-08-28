# If you run the latest code:
> yarn start-cli --stocks=CWH,FSLY,VXRT,GRPN,VSLR,LVGO,SRNE,OSTK,RUN,VBIV,LL,FSK,ODP,CZR,CZR,OPK,SHYF,AVNT,CHX,RCEL,SWBI,NK,WKHS,NVAX,ACB,LOVE,ANGI,DVAX,HOME,FVRR,ACMR,QDEL,INO,CVNA,TSLA,APPS,LRN,MFA,MDP,BKD,AINV,NCLH,PBF,KEX,RWT,DDS,M,OSW,VET,PK,PLCE,PLAY,IVR --start-date=2017-08-27 --end-date=2020-08-27 --delay-millis=12000 --annual-risk-free-interest-rate=1.0 --api-key=<key>
you would get this error:
[2020-08-27T20:27:02.731] [ERROR] cli/prm.js - Cannot build a price matrix. Invalid number of prices for symbols: ["FSLY","VXRT","LVGO","CHX","RCEL","LOVE","FVRR","ACMR","OSW"]. All symbols must have the same number of price entries: 756.

which tells you that the following symbols don't have enough price entries:["FSLY","VXRT","LVGO","CHX","RCEL","LOVE","FVRR","ACMR","OSW"]

# Removing the symbols that don't have enough price entries

> yarn start-cli --stocks=CWH,GRPN,VSLR,SRNE,OSTK,RUN,VBIV,LL,FSK,ODP,CZR,CZR,OPK,SHYF,AVNT,SWBI,NK,WKHS,NVAX,ACB,ANGI,DVAX,HOME,QDEL,INO,CVNA,TSLA,APPS,LRN,MFA,MDP,BKD,AINV,NCLH,PBF,KEX,RWT,DDS,M,VET,PK,PLCE,PLAY,IVR --start-date=2017-08-27 --end-date=2020-08-27 --delay-millis=0 --annual-risk-free-interest-rate=1.0 --api-key=<key>

```
[2020-08-27T20:35:49.445] [INFO] cli/prm.js - Symbol cache found: ./.cache/IVR-2017-08-27-2020-08-27.txt
[2020-08-27T20:35:49.511] [ERROR] cli/prm.js - TypeError: Cannot read property '12' of undefined
    at Object.inv (/home/lshlyapnikov/Projects/prm.js/node_modules/numeric/numeric-1.2.6.js:806:15)
    at TangencyPortfolio.calculateWeights (/home/lshlyapnikov/Projects/prm.js/build-cli/server/portfolioTheory.js:73:54)
    at TangencyPortfolio.calculate (/home/lshlyapnikov/Projects/prm.js/build-cli/server/portfolioTheory.js:66:27)
    at PrmController.analyzeUsingPortfolioStatistics (/home/lshlyapnikov/Projects/prm.js/build-cli/server/prmController.js:95:170)
    at MergeMapSubscriber.project (/home/lshlyapnikov/Projects/prm.js/build-cli/server/prmController.js:89:27)
    at MergeMapSubscriber._tryNext (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/operators/mergeMap.js:69:27)
    at MergeMapSubscriber._next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/operators/mergeMap.js:59:18)
    at MergeMapSubscriber.Subscriber.next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/Subscriber.js:66:18)
    at DefaultIfEmptySubscriber._next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/operators/defaultIfEmpty.js:41:26)
    at DefaultIfEmptySubscriber.Subscriber.next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/Subscriber.js:66:18)
```

Better error now

```
[2020-08-27T21:49:07.894] [ERROR] cli/prm.js - Error: Return rate covariance matrix (returnRatesCovarianceNxN) is NOT invertible. Use numeric methods to calculate optimal portfolio.
    at TangencyPortfolio.calculateWeights (/home/lshlyapnikov/Projects/prm.js/build-cli/server/portfolioTheory.js:74:13)
    at TangencyPortfolio.calculate (/home/lshlyapnikov/Projects/prm.js/build-cli/server/portfolioTheory.js:66:27)
    at PrmController.analyzeUsingPortfolioStatistics (/home/lshlyapnikov/Projects/prm.js/build-cli/server/prmController.js:95:170)
    at MergeMapSubscriber.project (/home/lshlyapnikov/Projects/prm.js/build-cli/server/prmController.js:89:27)
    at MergeMapSubscriber._tryNext (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/operators/mergeMap.js:69:27)
    at MergeMapSubscriber._next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/operators/mergeMap.js:59:18)
    at MergeMapSubscriber.Subscriber.next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/Subscriber.js:66:18)
    at DefaultIfEmptySubscriber._next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/operators/defaultIfEmpty.js:41:26)
    at DefaultIfEmptySubscriber.Subscriber.next (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/Subscriber.js:66:18)
    at TakeLastSubscriber._complete (/home/lshlyapnikov/Projects/prm.js/node_modules/rxjs/internal/operators/takeLast.js:71:29)
```