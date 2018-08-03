#!/bin/sh

# Calculate sha1 of the content
sha1="$(echo $1 | sha1sum | awk '{print $1}')"

# Compress the content with gzip and redirect output to file.
echo $1 | gzip --stdout --test - > "$CB_FEEDBACKS/$sha1.gz"

# Echo back the sha1
echo $sha1
