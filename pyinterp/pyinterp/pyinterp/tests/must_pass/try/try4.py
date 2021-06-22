try:
    raise ValueError("foo bar baz")
except ValueError:
    print("in except block")
    raise

# Unreachable
print(1)
