import sys
import os
import ztoken as token
import ztokenizer as tokenizer

def parse_file(filename):
    with open(filename, 'r') as f:
        content = f.read()
    return parse(content)

def parse(buf):
    ts = tokenizer.TokenizerState(buf)
    tokenizer.get_first_token(ts)
    while ts.token != token.ENDMARKER:
        # show_token(ts)
        tokenizer.get_token(ts)
    return True

def show_token(ts):
    t = ts.token
    name = token.tok_name[t]
    if t == token.NAME or t == token.STRING or t == token.NUMBER:
        print('token.' + name + ' ' + get_source(ts))
    else:
        print('token.' + name)

def get_source(ts):
    return ts.buf[ts.start:ts.end]

def run_tests(tests):
    for test in tests:
        print('--------------------- '+test)
        if not parse_file(test):
            print('--------------------- '+test+' ERROR')

def get_tests(dirs):

    tests = []

    def visit(path, ignore):
        if path in ignore:
            return
        if os.path.isdir(path):
            py_file = os.path.join(path, os.path.basename(path)+'.py')
            if os.path.exists(py_file):
                tests.append(py_file)
            else:
                new_ignore = []
                ignore_file = os.path.join(path, '.ignore')
                if os.path.exists(ignore_file):
                    with open(ignore_file, 'r') as f:
                        new_ignore = list(map(lambda x: os.path.join(path, x),
                                              f.read().splitlines()))
                for f in os.listdir(path):
                    visit(os.path.join(path, f), ignore + new_ignore)
        elif path.endswith('.py'):
            tests.append(path)

    for dir in dirs:
        visit(dir, [])

    return tests

def main():

    dirs = []

    i = 1

    while i < len(sys.argv):
        arg = sys.argv[i]
        i += 1
        dirs.append(arg)

    tokenizer.init_stats()

    run_tests(get_tests(dirs))

    tokenizer.show_stats()

if __name__ == '__main__':
    main()
