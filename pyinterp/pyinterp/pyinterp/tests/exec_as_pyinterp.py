import argparse

parser = argparse.ArgumentParser(description='Mimics the execution of file by pyinterp')
parser.add_argument('file')

if __name__ == "__main__":
    args = parser.parse_args()
    file = args.file

    import math
    scope = {"math": math, "__builtins__": __builtins__, "__name__": "__main__"}

    with open(file, 'r') as f:
        source = f.read()
        exec(source, scope)
