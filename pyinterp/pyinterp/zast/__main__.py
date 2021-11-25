from pyinterp._runtime import *
from pyinterp.zast import *

@nocompile
def main():
    import sys
    with open(sys.argv[1], "r") as f:
        source = f.read()
    show_ast(parse(source))

if __name__ == "__main__":
    main()
