#!/bin/sh
# Author : Leonard Oest O'Leary
# Small script to rebuild the bundles when a change happens

command -v inotifywait || echo "You need to install inotifywait and have it in PATH to run this script ! \n\n -> see https://github.com/inotify-tools/inotify-tools/wiki"

# I know the loop is not ideal because route needs to be redone everytime... but it works !
# Listen only to "./include"
while inotifywait -e modify -r ./include; do
    make
done


