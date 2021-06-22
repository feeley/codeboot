def f():
   for x in range(10):
      if (x==3): continue
      if (x==5): break
      print (x)
   print (x)

f()   
