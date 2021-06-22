# File: test1.py

# Expressions

x
0
42
0x123
0o123
0b1001011
0.
0.1
.2
1e5
1.e5
.1e5
1e+123
1e-123
"a"
"a" "b"
...
None
True
False

f ( )
f ( x )
f ( x , )
f ( x , y )
f ( x , y , z )
f ( x , y , z , )

t [ x ]
t [ x , ]
t [ x , y ]
t [ x , y , z ]
t [ x , y , z , ]

t [ 1 : 2 : 3 ]
t [ 1 : 2 : 3 , ]
t [ 1 : 2 : 3 , 4 : 5 : 6 ]
t [ 1 , 2 : 3 : 4 ]
t [ 1 : 2 : 3 , 4 ]
t [ 1 : 2 : ]
t [ 1 : 2 ]
t [ : 2 : 3 ]
t [ : 2 : ]
t [ : : ]

obj . x

obj . f ( x ) [ y ] . x

x if y else z

x or y
x or y or z

x and y
x and y and z

not x
not not x

x < y
x > y
x <= y
x >= y
x == y
x != y
#x <> y
x is y
x is not y
x in y
x not in y

x < y > z
x > y < z
x <= y < z
x >= y < z
x == y < z
x != y < z
#x <> y < z
x is y < z
x is not y < z
x in y < z
x not in y < z

x | y
x | y | z

x ^ y
x ^ y ^ z

x & y
x & y & z

x << y
x >> y
x << y >> z

x + y
x - y

x + y - z

x * y
x @ y
x / y
x % y
x // y
x * y @ z / x % y // z

+ x
- x
~ x

x ** y
x ** - y

lambda : x

( )
( x )
( x , )
( x , y )
( x , y , )

[ ]
[ x ]
[ x , ]
[ x , y ]
[ x , y , ]

#{ }
#{ x }
#{ x , }
#{ x , y }
#{ x , y , }

{ }
{ 1 : 2 }
{ 1 : 2 , }
{ 1 : 2 , 3 : 4 }
{ 1 : 2 , 3 : 4 , }

# Expressions in parentheses to check for proper location information

( x )
( 42 )
( "a" )
( "a" "b" )
( ... )
( None )
( True )
( False )

( f ( ) )
( f ( x ) )
( f ( x , ) )
( f ( x , y ) )
( f ( x , y , z ) )
( f ( x , y , z , ) )

( t [ x ] )
( t [ x , ] )
( t [ x , y ] )
( t [ x , y , z ] )
( t [ x , y , z , ] )

( t [ 1 : 2 : 3 ] )
( t [ 1 : 2 : 3 , ] )
( t [ 1 : 2 : 3 , 4 : 5 : 6 ] )
( t [ 1 , 2 : 3 : 4 ] )
( t [ 1 : 2 : 3 , 4 ] )
( t [ 1 : 2 : ] )
( t [ 1 : 2 ] )
( t [ : 2 : 3 ] )
( t [ : 2 : ] )
( t [ : : ] )

( obj . x )

( obj . f ( x ) [ y ] . x )

( x if y else z )

( x or y )
( x or y or z )

( x and y )
( x and y and z )

( not x )
( not not x )

( x < y )
( x > y )
( x <= y )
( x >= y )
( x == y )
( x != y )
#( x <> y )
( x is y )
( x is not y )
( x in y )
( x not in y )

( x < y > z )
( x > y < z )
( x <= y < z )
( x >= y < z )
( x == y < z )
( x != y < z )
#( x <> y < z )
( x is y < z )
( x is not y < z )
( x in y < z )
( x not in y < z )

( x | y )
( x | y | z )

( x ^ y )
( x ^ y ^ z )

( x & y )
( x & y & z )

( x << y )
( x >> y )
( x << y >> z )

( x + y )
( x - y )

( x + y - z )

( x * y )
( x @ y )
( x / y )
( x % y )
( x // y )
( x * y @ z / x % y // z )

( + x )
( - x )
( ~ x )

( x ** y )
( x ** - y )

( lambda : x )

( ( ) )
( ( x ) )
( ( x , ) )
( ( x , y ) )
( ( x , y , ) )

( [ ] )
( [ x ] )
( [ x , ] )
( [ x , y ] )
( [ x , y , ] )

#( { } )
#( { x } )
#( { x , } )
#( { x , y } )
#( { x , y , } )

( { } )
( { 1 : 2 } )
( { 1 : 2 , } )
( { 1 : 2 , 3 : 4 } )
( { 1 : 2 , 3 : 4 , } )

#( yield x )
#( yield from x )

# Statements

#del x
#del x ,
#del x , y

pass
pass ;
pass ; pass
pass ; pass ;
pass ; pass ; pass

break

continue

return
return x
return x , y

#yield
#yield x
#yield x , y
#yield x , y , * z
#yield from x

raise
raise x
raise x from y

x = y
x , y = z

x += y
x -= y
x *= y
x @= y
x /= y
x %= y
x &= y
x |= y
x ^= y
x <<= y
x >>= y
x **= y
x //= y

global x
global x , y

nonlocal x
nonlocal x , y

assert x
assert x , y

import x
import x , y
import x . y . z

import x as a
import x as a , y as b
import x . y . z as a

if x :
    a

if x :
    a
elif y :
    b
elif z :
    c

if x :
    a
elif y :
    b
elif z :
    c
else:
    d

while x :
    a

while x :
    a
else:
    b

while x :
    a
    while y :
        b
        while z :
            c
        d
    e

for x in y :
    a

def x ( ) :
    a

def x ( y ) :
    a

def x ( y , z ) :
    a

def fib(n):
    if n<2:
        return n
    else:
        return fib(n-1) + fib(n-2)

print(fib(30))
