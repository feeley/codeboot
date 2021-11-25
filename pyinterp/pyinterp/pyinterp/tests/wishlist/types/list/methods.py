# copy
l = [1,2,3]
l2 = l.copy()

# pop
print(l.pop())
print(len(l))
print(l)

print(l.pop(0))
print(len(l))
print(l)

print(l.pop())
print(len(l))
print(l)

# append
l.append(9)
print(len(l))
print(l)

l.append(42)
print(len(l))
print(l)

l.pop(-2)
print(len(l))
print(l)

# clear
l.clear()

print(l)
print(l2)

# count
l2 = [1, 1, 2, 3, 4, 5, 1]
print(l2.count(1))
print(l2.count(2))
print(l2.count(10))

# index
print(l2.index(1))
print(l2.index(5))

l2.pop()
l2.append(2)

print(l2.count(1))
print(l2.count(2))
print(l2.count(10))

l3 = [1, 2, 3, 1, 2, 3, 1, 2, 3]

print(
    l3.index(1),
    l3.index(1, 4),
    l3.index(2, 4, 7),
    l3.index(2, 4, 1000),
    l3.index(2, -1000, 1000))

# remove
l3.remove(1)
print(l3)
l3.remove(1)
print(l3)

# insert
l4 = [1, 2, 3]

l4.insert(1, 42)
l4.insert(-1, 43)
l4.insert(100, 44)
l4.insert(-100, 45)

print(l4)

# extend
l5 = [1, 2, 3]
l5.extend([4, 5, 6])
print(l5)
print(l5.pop())
print(l5)
l5.extend((8, 9, 10))
print(l5)
print(l5.pop())
print(len(l5))
l5.extend([])
print(l5)

l5.extend(range(10))
print(l5)
l5.extend(iter([1, 2, 3, 4]))
print(l5)

# reverse
l6 = [1, 2, 3, 4, 5, 6]
l6.reverse()
print(l6)

# list
l = [1, 2, 3]
t = [1, 2, 3]
r = range(5)

l_copy = list(l)
print(l)
l_copy[0] = 42
print(l, l_copy)

t_copy = list(t)
print(l)
t_copy[0] = 42
print(t, t_copy)

r_copy = list(r)
print(r_copy)
