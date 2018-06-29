#!/usr/bin/env python

DEBUG = False

import sys
import cgi
import urllib2

if DEBUG:
    import cgitb
    cgitb.enable();

request = cgi.FieldStorage()
response = urllib2.urlopen(request.getvalue("url"))
fileData = response.read()

print "Content-Type: text/html"     # HTML is following
print "Content-Length:", len(fileData)
print                               # blank line, end of headers
sys.stdout.write(fileData)
sys.stdout.flush()
