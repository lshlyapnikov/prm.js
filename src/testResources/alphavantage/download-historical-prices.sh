#!/bin/bash -eux

apiKey=$1
symbol=$2

url="https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${apiKey}&datatype=csv&outputsize=full"

curl $url > "./${symbol}.csv"
