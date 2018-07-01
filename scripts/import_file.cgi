#!/bin/sh

sha1="$(echo $1 | sha1sum | awk '{print $1}')"

echo $1 > "$CB_FEEDBACKS/$sha1.html"

echo $sha1
