#!/bin/sh
sed -e "s#<script>cb.query(null);</script>#<script>cb.query(\"$1\");</script>#" index.html

