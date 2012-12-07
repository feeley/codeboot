#!/bin/sh

if [ "$REQUEST_METHOD" = "POST" ] ; then

  #echo `sed -e '1! d' -e 's/%/\\\\x/g' -e 's/^longUrl=/{"longUrl":"/' -e 's/$/"}/'` | curl --header "Content-Type: application/json" --data @- "https://www.googleapis.com/urlshortener/v1/url?key=$KEY" > $TEMP

  echo "Content-Type: application/json"
  echo ""
  echo "{ content: \"function cube(n) { return n*n*n; }\" }"

fi
