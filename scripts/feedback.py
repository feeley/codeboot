#!/bin/python

import os

new = "cb.feedback(String.raw`{}`)".format(os.environ["CONTENT"])

print(os.environ["FILE"].replace("cb.feedback(null)", new))
