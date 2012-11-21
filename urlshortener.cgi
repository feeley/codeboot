#!/bin/sh

KEY="AIzaSyD8hbgcobWvBNlOAO3QlC-NSfFcJrATfS8"

LOG="/Users/codeboot/codeboot-urlshortener.log"

if [ "$REQUEST_METHOD" = "POST" ] ; then

  TEMP="/tmp/codeboot-$$.tmp"

  rm -f $TEMP

  echo `sed -e '1! d' -e 's/%/\\\\x/g' -e 's/^longUrl=/{"longUrl":"/' -e 's/$/"}/'` | curl --header "Content-Type: application/json" --data @- "https://www.googleapis.com/urlshortener/v1/url?key=$KEY" > $TEMP

  tr -d '\n' < $TEMP | sed -e 's/$//' >> $LOG

  echo "Content-Type: application/json"
  echo ""
  cat $TEMP

  rm -f $TEMP

else

  exit 1

fi

