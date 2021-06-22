print(1.5)

# Add

print(100.2 + 3)
print(4.24 + 239)
print(3.23 + 1030.4)
print(0. + 4.)

print(100.2 + -3)
print(4.24 + -239)
print(3.23 + -1030.4)
print(0. + -4.)

print(-100.2 + -3)
print(-4.24 + -239)
print(-3.23 + -1030.4)
print(-0. + -4.)

print(-100.2 + 3)
print(-4.24 + 239)
print(-3.23 + 1030.4)
print(-0. + 4.)

# Sub

print(100.2 - 3)
print(4.24 - 239)
print(3.23 - 1030.4)
print(0. - 4.)

print(100.2 - -3)
print(4.24 - -239)
print(3.23 - -1030.4)
print(0. - -4.)

print(-100.2 - -3)
print(-4.24 - -239)
print(-3.23 - -1030.4)
print(-0. - -4.)

print(-100.2 - 3)
print(-4.24 - 239)
print(-3.23 - 1030.4)
print(-0. - 4.)

# mul

print(100.2 * 3)
print(4.24 * 239)
print(3.23 * 1030.4)
print(0. * 5.)


print(10. * 0)
print(10. * 0.)
print(10 * 0.)
print(1 * 2)
print(1 * 2.)
print(1. * 2)
print(1. * 2.)

print(-10. * 0)
print(-10. * 0.)
print(-10 * 0.)
print(-1 * 2.)
print(-1. * 2)
print(-1. * 2.)

print(10. * -0)
print(10. * -0.)
print(10 * -0.)
print(1 * -2.)
print(1. * -2)
print(1. * -2.)

print(-10. * -0)
print(-10. * -0.)
print(-10 * -0.)
print(-1 * -2.)
print(-1. * -2)
print(-1. * -2.)


# div


print(1 / 2)
print(1 / 2.)
print(1. / 2)
print(1. / 2.)

print(-1 / 2.)
print(-1. / 2)
print(-1. / 2.)

print(1 / -2.)
print(1. / -2)
print(1. / -2.)

print(-1 / -2.)
print(-1. / -2)
print(-1. / -2.)

# mod

print(1 % 2)
print(1 % 2.)
print(1. % 2)
print(1. % 2.)

print(-1 % 2.)
print(-1. % 2)
print(-1. % 2.)

print(1 % -2.)
print(1. % -2)
print(1. % -2.)

print(-1 % -2.)
print(-1. % -2)
print(-1. % -2.)

# floordiv

print(1 // 2)
print(1 // 2.)
print(1. // 2)
print(1. // 2.)

print(-1 // 2.)
print(-1. // 2)
print(-1. // 2.)

print(1 // -2.)
print(1. // -2)
print(1. // -2.)

print(-1 // -2.)
print(-1. // -2)
print(-1. // -2.)

print(3.5 // 0.1)
print(-3.5 // 0.1)
print(3.5 // -0.1)
print(-3.5 // -0.1)


# abs

print(abs(-1.))
print(abs(1.2))
print(abs(0.0))
print(abs(-0.))
print(abs(-7568978657476787909.0))

# bool

print(bool(0.))
print(bool(1.))
print(bool(0.00000000001))
print(bool(182482083.0))
print(bool(-01282930.0))

print((0.).__bool__())
print((1.).__bool__())
print((0.00000000001).__bool__())
print((182482083.0).__bool__())
print((-01282930.0).__bool__())

# float

print(float(1.2))
print(float(0.1))
print(0.1.__float__())

print(float(0))
print(float(0.0))

# comparisions

x=1.
y=2.
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=1.
y=2
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=1
y=2.
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )

x=1.
y=1.
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=1.
y=1
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=1
y=1.
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )

x=1.0000001
y=1.0000002
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=1.000000001
y=1
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=1
y=1.000000001
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=-45167829376123.19238981346879
y=0
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=1.172387128794671982740
y=1
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )


x=-1.0
y=0.12746178248978174296867617
print( x == y )
print( x > y  )
print( x < y  )
print( x <= y )
print( x >= y )
print( x != y )
z = x == y
print(z)

# int

print(int(0.1))
print(int(1.2010203))
print(int(12301123123.))
print(int(-1927391823.212831273))
print(int(-21209381023.123123124))
print(int(-0.))

print(0.1.__int__())
print(1.2010203.__int__())
print(12301123123.0.__int__())
print(-1927391823.212831273.__int__())
print(-21209381023.123123124.__int__())
print(-0.0.__int__())

# neg / pos

print(-0.0)
print(-(-(-0.1)))
print(--90.)
print(--+-+--+++-+-+0.1)
print(-+++---+++++----+++--+++++---++-10029301.12341)
print(+3.9)
print(+++++++++75.45)

# pow

print(10. ** 0)
print(10. ** 0.)
print(10 ** 0.)
print(1 ** 2)
print(1 ** 2.)
print(1. ** 2)
print(1. ** 2.)

print(-10. ** 0)
print(-10. ** 0.)
print(-10 ** 0.)
print(-1 ** 2.)
print(-1. ** 2)
print(-1. ** 2.)

print(10. ** -0)
print(10. ** -0.)
print(10 ** -0.)
print(1 ** -2.)
print(1. ** -2)
print(1. ** -2.)

print(-10. ** -0)
print(-10. ** -0.)
print(-10 ** -0.)
print(-1 ** -2.)
print(-1. ** -2)
print(-1. ** -2.)

print(0 ** 0)
print(-1029832104 ** 397)

# repr

print(0.1)
print(0.1.__repr__())
print(0.0.__repr__())

# round

print(round(0.))
print(round(1.))
print(round(0.00000000001))
print(round(182482083.387429834))
print(round(-01282930.134134))

print((0.).__round__())
print((1.).__round__())
print((0.00000000001).__round__())
print((182482083.134).__round__())
print((-01282930.6789).__round__())


# trunc

print((0.).__trunc__())
print((1.).__trunc__())
print((0.00000000001).__trunc__())
print((182482083.124124).__trunc__())
print((-01282930.124124).__trunc__())

# is integer

print(0.1.is_integer())
print(0.0.is_integer())
print(0.118723891230.is_integer())
print(-19201930.1313.is_integer())
print(-2341289414124.000000000000000000000000.is_integer())
print(-1023801932.0000000000000000000000001.is_integer())
print(0.999999999999999.is_integer())
