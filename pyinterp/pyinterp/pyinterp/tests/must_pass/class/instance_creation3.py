class Point:
    def __new__(cls, x, y):
        return "SOMETHING OF WRONG TYPE"

    def __init__(self, x, y):
        print("this should not be called")
        self.x = x
        self.y = y


print(Point(1, 2))
print(Point("bar", "foo"))