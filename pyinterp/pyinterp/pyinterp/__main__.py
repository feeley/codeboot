import sys
import argparse

from pyinterp.pyinterp import interp_file

def main():
    parse = argparse.ArgumentParser(description='interp_file')
    parse.add_argument('file', help='source file')
    parse.add_argument('--trace', action="store_true", default=False, help='print the trace of the execution of the program')
    parse.add_argument('--no_sfs', action="store_true", default=False, help='run the interpreter in non-safe-for-space mode')
    args = parse.parse_args()
    options = {}
    options["trace"] = args.trace
    options["safe_for_space"] = not args.no_sfs
    interp_file(args.file, options)

if __name__ == '__main__':
    main()
