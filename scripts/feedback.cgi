#!/bin/sh

export CONTENT="$(cat $1)"

if [ $? -eq 0 ]; then
    export FILE="$(cat index.html)"
    python "$CB_SCRIPTS/feedback.py"
fi


