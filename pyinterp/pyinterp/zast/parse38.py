import ast
import sys
import zast

sys.tracebacklimit = 0

def show_ast(x):
    print(zast.dump2(x, annotate_fields=True, include_attributes=True))

def read_file(filename):
    with open(filename, "r") as f:
        content = f.read()
    return content

def main():
    show_ast(ast.parse(read_file(sys.argv[1]),'','exec'))

if __name__ == "__main__":
    main()
