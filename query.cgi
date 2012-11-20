#!/bin/sh

echo "Content-Type: text/html"
echo ""
sed -e "s#<script>cb.query(null);</script>#<script>cb.query(\"$QUERY_STRING\");</script>#" index.html
