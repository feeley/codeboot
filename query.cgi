#!/bin/sh

echo "Content-Type: text/html"
echo ""
sed -e "s#<script>cp.query(null);</script>#<script>cp.query(\"$QUERY_STRING\");</script>#" index.html
