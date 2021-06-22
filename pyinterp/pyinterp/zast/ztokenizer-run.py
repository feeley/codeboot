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
        show_token(ts)
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

def main():

    i = 1

    tokenizer.init_stats() # stats not used, but need to init

    while i < len(sys.argv):
        parse_file(sys.argv[i])
        i += 1

if __name__ == '__main__':
    main()
