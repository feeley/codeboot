x = 1
x += 9
print(x)

lst0 = [1,2,3]
lst0 += range(12)
print(lst0)

lst1 = [1,2,3]
lst1[0] += 2
lst1[-1] += 9
print(lst1)

lst1[0] -= 2
lst1[-1] -= 9
print(lst1)

lst1[0] *= 2
lst1[-1] *= 9
print(lst1)

lst1[0] //= 2
lst1[-1] //= 9
print(lst1)

lst2=[[],[]]
lst2.append(lst2[0])
lst2[0] += [1,2,3]
print(lst2)

# Kind of hacky, but this is the only object which is assignable in both pyinterp and cpython as for now
def f(): pass

f.x = 0
f.x += 1
print(f.x)