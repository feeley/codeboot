class Point:
    def __new__(cls, x, y):
        p = object.__new__(cls)

        p.z = "test"

        return p

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __repr__(self):
        return "Point" + repr((self.x, self.y, self.z))


print(Point(1, 2))
print(Point("bar", "foo"))