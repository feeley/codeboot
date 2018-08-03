#!/bin/sh


# Export content as env variable, so that the python script can fetch
# it easily
export CONTENT=$($ZCAT $CB_FEEDBACKS/$1.gz)

if [ $? -eq 0 ]; then
   export FILE="$(cat index.html)"
   python "$CB_SCRIPTS/feedback.py"
fi





