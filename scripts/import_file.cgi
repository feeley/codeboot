#!/bin/sh

doc="<!DOCTYPE html>
<html lang=\"en\">
<head>
<title>yolo</title>
<link rel=\"stylesheet\" href=\"include/CodeMirror/lib/codemirror.css\">
<link rel=\"stylesheet\" href=\"include/codeboot.css\">
</head>
<body>
<h1>$1</h1>
<div>$2</div>
</body>
</html>"

sha1="$(echo $doc | sha1sum | awk '{print $1}')"

echo $doc > "$CB_FEEDBACKS/$sha1.html"

echo $sha1
