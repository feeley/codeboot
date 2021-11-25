print("hello")

if x == "hello \x23 \U00001234 \u1234 \713":
    print("yes \x12")
else:
    print("no \U00001234")
