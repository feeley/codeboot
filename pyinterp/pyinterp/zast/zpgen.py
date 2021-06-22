#! /usr/bin/env python3

import sys
import os
import functools
import pyinterp.zast.ztoken as token
import pyinterp.zast.ztokenizer as tok

debug_level = 0

def block(content):
    if content == '':
        return ''
    if content[-1] == '\n':
        content = content[:-1]
    return '\n'.join(list(map(lambda x:'    '+x,content.split('\n'))))+'\n'

# AST of grammar rules

class Rule():
    def __init__(self, name, rhs, start, end):
        self.name = name
        self.rhs = rhs
        self.start = start
        self.end = end

class Alt():
    def __init__(self, seqs, start, end):
        self.seqs = seqs
        self.start = start
        self.end = end

class Seq():
    def __init__(self, items, start, end):
        self.items = items
        self.start = start
        self.end = end

class Opt():
    def __init__(self, alt, start, end):
        self.alt = alt
        self.start = start
        self.end = end

class Star():
    def __init__(self, atom, start, end):
        self.atom = atom
        self.start = start
        self.end = end

class Plus():
    def __init__(self, atom, start, end):
        self.atom = atom
        self.start = start
        self.end = end

class Term():
    def __init__(self, name, start, end):
        self.name = name
        self.start = start
        self.end = end

class NTerm():
    def __init__(self, name, start, end):
        self.name = name
        self.start = start
        self.end = end

def show_token(ts):
    t = ts.token
    name = token.tok_name[t]
    if t == token.NAME or t == token.STRING or t == token.NUMBER:
        print('### ' + name + ' ' + str_from_bytes(ts.buf[ts.start:ts.end]))
    else:
        print('### ' + name)

def str_from_bytes(b):
    return b
    #return b.decode('utf-8')

def str_to_bytes(s):
    return s
    #return s.encode('utf-8')

def advance(ts):
    ts.previous_end = ts.end
    tok.get_token(ts)
    if debug_level >= 3:
        show_token(ts)

def encode_NAME(ts):
    bs = ts.buf[ts.start:ts.end]
    #print('NAME=' + str_from_bytes(bs))
    if bs == 'NAME':
        return token.NAME
    elif bs == 'NUMBER':
        return token.NUMBER
    elif bs == 'STRING':
        return token.STRING
    elif bs == 'ASYNC':
        return token.ASYNC
    elif bs == 'INDENT':
        return token.INDENT
    elif bs == 'DEDENT':
        return token.DEDENT
    elif bs == 'AWAIT':
        return token.AWAIT
    elif bs == 'NEWLINE':
        return token.NEWLINE
    elif bs == 'ENDMARKER':
        return token.ENDMARKER
    elif bs == 'TYPE_COMMENT':
        return token.TYPE_COMMENT
    else:
        return str_from_bytes(bs)

def encode_STRING(ts):
    bs = ts.buf[ts.start:ts.end]
    #print('STRING=' + str_from_bytes(bs))
    bs_unquoted = bs[1:-1]
    #print('# => ' + str_from_bytes(bs_unquoted))
    if bs_unquoted == 'NAME':
        return token.NAME
    elif bs_unquoted == 'NUMBER':
        return token.NUMBER
    elif bs_unquoted == 'STRING':
        return token.STRING
    elif bs_unquoted == 'ASYNC':
        return token.ASYNC
    elif bs_unquoted == 'AWAIT':
        return token.AWAIT
    elif bs_unquoted == 'NEWLINE':
        return token.NEWLINE
    elif bs_unquoted == 'ENDMARKER':
        return token.ENDMARKER
    elif bs_unquoted == 'TYPE_COMMENT':
        return token.TYPE_COMMENT
    else:
        ts = tok.TokenizerState(bs_unquoted, False)
        tok.get_token(ts)
        if ts.token == token.NAME:
            return str_from_bytes(bs_unquoted)
        else:
            return ts.token

def parse_grammar(ts):
    rules = []
    while ts.token != token.ENDMARKER:
        if ts.token == token.NEWLINE:
            advance(ts)
        else:
            rule = parse_rule(ts)
            rules.append(rule)
    return rules

def parse_rule(ts):

    attribs = []

    #print(ts.buf[ts.start:ts.end])
    if ts.token != token.NAME:
        return syntax_error(ts)
    name = encode_NAME(ts)
    start = ts.start # start of rule

    advance(ts)

    if ts.token == token.LBRACE:
        advance(ts)
        if ts.token == token.NAME:
            attribs.append(encode_NAME(ts))
            advance(ts)
            while ts.token == token.COMMA:
                advance(ts)
                if ts.token != token.NAME:
                    return syntax_error(ts)
                attribs.append(encode_NAME(ts))
                advance(ts)
        if ts.token != token.RBRACE:
            return syntax_error(ts)
        advance(ts)
        # print('# ' + repr(attribs))

    if ts.token != token.COLON:
        return syntax_error(ts)
    advance(ts)

    alt = parse_alt(ts)

    end = ts.previous_end # end of rule

    if ts.token != token.NEWLINE:
        return syntax_error(ts)

    advance(ts)

    return Rule(name, alt, start, end)

def parse_alt(ts):
    start = ts.start
    seqs = []
    seq = parse_seq(ts)
    seqs.append(seq)
    while ts.token == token.VBAR:
        advance(ts)
        seq = parse_seq(ts)
        seqs.append(seq)
    if len(seqs) == 1:
        return seqs[0]
    else:
        return Alt(seqs, start, ts.previous_end)

def parse_seq(ts):
    start = ts.start
    items = []
    item = parse_item(ts)
    items.append(item)
    while ts.token in (token.LSQB, token.LPAR, token.NAME, token.STRING):
        item = parse_item(ts)
        items.append(item)
    if len(items) == 1:
        return item
    else:
        return Seq(items, start, ts.previous_end)

def parse_item(ts):
    start = ts.start
    if ts.token == token.LSQB:
        advance(ts)
        alt = parse_alt(ts)
        if ts.token == token.RSQB:
            advance(ts)
            return Opt(alt, start, ts.previous_end)
        else:
            return syntax_error(ts)
    else:
        atom = parse_atom(ts)
        if ts.token == token.STAR:
            advance(ts)
            return Star(atom, start, ts.previous_end)
        elif ts.token == token.PLUS:
            advance(ts)
            return Plus(atom, start, ts.previous_end)
        else:
            return atom

def parse_atom(ts):
    start = ts.start
    if ts.token == token.LPAR:
        advance(ts)
        alt = parse_alt(ts)
        if ts.token == token.RPAR:
            advance(ts)
            alt.start = start
            alt.end = ts.previous_end
            return alt
        else:
            return syntax_error(ts)
    elif ts.token == token.NAME:
        name = encode_NAME(ts)
        advance(ts)
        return resolve_name(name, start, ts.previous_end)
    elif ts.token == token.STRING:
        string = encode_STRING(ts)
        advance(ts)
        return resolve_string(string, start, ts.previous_end)
    else:
        return syntax_error(ts)

def syntax_error(ts):
    print('syntax error')
    print((token.tok_name[ts.token],ts.buf[ts.start:ts.end]))
    print(ts.end)
    raise SyntaxError('invalid syntax')

def resolve_name(name, start, end):
    if type(name) == int or name.isupper():
        return Term(name, start, end)
    else:
        return NTerm(name, start, end)

def resolve_string(string, start, end):
    return Term(string, start, end)

def first(x, follow):

    if isinstance(x, Alt):
        first_x = frozenset()
        for y in x.seqs:
            first_x |= first(y, follow)
        return first_x

    elif isinstance(x, Seq):
        first_x = follow
        for y in reversed(x.items):
            first_x = first(y, first_x)
        return first_x

    elif isinstance(x, Opt):
        first_x = follow | first(x.alt, follow)
        return first_x

    elif isinstance(x, Star):
        first_x = follow | first(x.atom, follow)
        return first_x

    elif isinstance(x, Plus):
        first_x = first(x.atom, follow)
        return first_x

    elif isinstance(x, Term):
        first_x = frozenset((x.name,))
        return first_x

    elif isinstance(x, NTerm):
        first_x = first_nt[x.name]
        return first_x
    else:
        fatal_error('unhandled syntax form')

def setup_first_nt(rules):
    global first_nt
    first_nt = {x.name: frozenset() for x in rules}
    old_size = 0
    while True:
        new_size = 0
        for rule in rules:
            f = first(rule.rhs, universal_set())
            first_nt[rule.name] = f
            new_size += len(f)
        if new_size == old_size:
            break
        old_size = new_size

token_access = '' # 'token.'
tok_access = '' # 'tok.'
gen_prefix = ''
gen_parse_prefix = 'parse_'

def init_fn_names():

    global todo, nt_fn_names, nt_fn_nbs

    todo = []
    nt_fn_names = dict()
    nt_fn_nbs = dict()

def get_nt_fn_name(nt_known):
    nt_known = (nt_known[0], universal_set()) # FIXME!
    if nt_known in nt_fn_names:
        return nt_fn_names[nt_known]
    else:
        todo.append(nt_known)
        nt = nt_known[0]
        if nt not in nt_fn_nbs:
            n = 1
        else:
            n = nt_fn_nbs[nt] + 1
        nt_fn_nbs[nt] = n
        fn_name = gen_parse_prefix + nt + (('_' + str(n)) if n > 1 else '')
        nt_fn_names[nt_known] = fn_name
        return fn_name

def rule_num(nt):
    for i in range(len(rules)):
        if rules[i].name == nt:
            return i
    return -1

def at_start(x):
    return at_position(x.start)

def at_end(x):
    return at_position(x.end)

last_position = ''
is_new_position = False

def at_position(pos):
    alt = section(current_alt.start, current_alt.end)
    p = pos - current_alt.start
    return section(current_rule.start, current_rule.rhs.start) + ' '.join((alt[:p] + '.' + alt[p:]).replace('\n',' ').split())

def mark_position(position):
    global last_position, is_new_position
    is_new_position = position != last_position
    last_position = position
    if debug_level == 0 or not is_new_position:
        return ''
    else:
        return '# ' + position + '\n'
    
def section(start, end):
    return tok.source(current_ts, start, end)

def universal_set():
    return frozenset(range(93)).difference(frozenset({53}))

def next_sub_index():
    global current_sub_index
    current_sub_index += 1
    return current_sub_index

def next_var(name):
    if name not in current_var_nbs:
        n = 1
    else:
        n = current_var_nbs[name] + 1
    current_var_nbs[name] = n
    return name + str(n)

def read_grammar(filename):

    global current_ts, rules

    #WAS: with open(filename, 'rb') as f:
    with open(filename, 'r') as f:
        content = f.read()

    tok.init_stats()

    current_ts = tok.TokenizerState(content, False)
    advance(current_ts)

    rules = parse_grammar(current_ts)

def read_grammar_and_generate_sample(filename):

    global actions

    read_grammar(filename)

    code = generate_sample()

    print(code)

def generate_sample():
    global sample_indent, sample_code, sample_nl
    start_rule_name = rules[0].name
    sample_code = ''
    while sample_code.rstrip() == '':
        sample_code = ''
        sample_nl = True
        sample_indent = 0
        samp_rule(start_rule_name)
    return sample_code

def samp_out(x):
    global sample_indent, sample_code, sample_nl
    if x == '\n':
        sample_nl = True
    elif sample_nl:
        sample_code += ' '*(4*max(0,sample_indent))
        sample_nl = False
    else:
        sample_code += ' '
    sample_code += x

current_nt = ''

def samp_rule(nt):
    global current_nt
    #print('----------',nt);
    save = current_nt
    current_nt = nt
    rule = rules[rule_num(nt)]
    samp(rule.rhs)
    current_nt = save

import random

def samp(x):

    global sample_indent

    if isinstance(x, Alt):
        samp(x.seqs[random.randrange(len(x.seqs))])

    elif isinstance(x, Seq):
        for i in range(len(x.items)):
            samp(x.items[i])

    elif isinstance(x, Opt):
        if random.randrange(100) < 10:
            samp(x.alt)

    elif isinstance(x, Star):
        while random.randrange(100) < 10:
            samp(x.atom)

    elif isinstance(x, Plus):
        samp(x.atom)
        while random.randrange(100) < 10:
            samp(x.atom)

    elif isinstance(x, Term):
        t = x.name
        if t == token.INDENT:
            sample_indent = sample_indent+1
        elif t == token.DEDENT:
            sample_indent = max(0,sample_indent-1)
        elif t == token.NAME:
            samp_out(['x','y','_z'][random.randrange(3)])
        elif t == token.STRING:
            samp_out(['""','"a"','"abc"'][random.randrange(3)])
        elif t == token.NUMBER:
            samp_out(str(random.randrange(10)))
        else:
            samp_out(token.tok_source[t])

    elif isinstance(x, NTerm):
        samp_rule(x.name)

    else:
        fatal_error('unhandled syntax form')

tokenset_dict = {}
tokenset_count = 0
modes = {}
start_fn_names = {}

def read_grammar_and_generate_parser(filename):

    global actions, gen_prefix, gen_parse_prefix, tokenset_dict, tokenset_count, modes

    read_grammar(filename)

    actions_filename = os.path.splitext(filename)[0]+'_actions.py'

    with open(actions_filename, 'r') as f:
        actions = eval(f.read())

    gen_prefix = actions.get('gen_prefix','')
    gen_parse_prefix = actions.get('gen_parse_prefix','parse_')
    modes = actions.get('allowed_modes', {None:rules[0].name})

    setup_first_nt(rules)

    tokenset_dict = {}
    tokenset_count = 0

    print('import sys')
    print('from pyinterp._runtime import *')

    if token_access == '':
        print('from pyinterp.zast.ztoken import *')
    else:
        print('import pyinterp.zast.ztoken as ' + token_access[:-1])

    if tok_access == '':
        print('from pyinterp.zast.ztokenizer import *')
    else:
        print('import pyinterp.zast.ztokenizer as ' + tok_access[:-1])

    print(actions.get('prelude',''))

    # A subcall to gen_rule calls print:
    generate_parse_functions()

    print()
    print('@nocompile')
    print('def ' + gen_prefix + 'tokenset(*elements):')
    print('    return elements')
    print()

    for s in tokenset_dict:
        print(tokenset_dict[s] + ' = ' + tokenset_construct(s))

    print()
    if None in modes:
        print('def ' + gen_prefix + 'parse(source, context):')
    else:
        print('def ' + gen_prefix + 'parse(source, mode, context):')
        print()
        print('    # mode = '+('/'.join(list(map(repr,modes.keys())))))
    print()
    print('    init_stats()')
    print('    ts = ' + tok_access + 'TokenizerState(source, context)')
    print('    ' + gen_prefix + 'advance(ts)')
    print()

    if None in modes:
        start_fn_name = start_fn_names[None]
        f = first_nt[modes[None]]
        c, yes, no = gen_in(f, universal_set())
        print('    if ' + c + ':')
        print('        return ' + start_fn_name + '(ts)')
        print('    else:')
        print('        ' + gen_error())
    else:
        first_mode = True
        for mode in modes:
            start_fn_name = start_fn_names[mode]
            f = first_nt[modes[mode]]
            print('    ' + ('if' if first_mode else 'elif') + ' mode == ' + repr(mode) + ':')
            c, yes, no = gen_in(f, universal_set())
            print('        if ' + c + ':')
            print('            return ' + start_fn_name + '(ts)')
            print('        else:')
            print('            ' + gen_error())
            first_mode = False
    print()
    print('def ' + gen_prefix + 'syntax_error(ts, msg):')
    print('    if msg is None:')
    print('        msg = "invalid syntax"')
    print('    if ts.context and dict_has(ts.context, "syntaxError"):')
    print('        ts.context.syntaxError(' + tok_access + 'get_lineno(ts)-1, ' + tok_access + 'get_col_offset(ts), ' + tok_access + 'get_end_lineno(ts)-1, ' + tok_access + 'get_end_col_offset(ts), msg);')
    print('        return')
    print('    line_num = ts.line_num')
    print('    line_start = 0')
    print('    while line_num > 0:')
    print('        line_start = 1+ts.buf.find("\\n", line_start)')
    print('        line_num -= 1')
    print('    line_end = ts.buf.find("\\n", line_start)')
    print('    line = source(ts, line_start, line_end)')
    print('    stripped_line = line.lstrip()')
    print('    print("  File \\"" + "unknown.py" + "\\", line " + str(ts.line_num+1))')
    print('    print("    " + stripped_line)')
    print('    print("    " + " "*(ts.start - line_start - (len(line) - len(stripped_line))) + "^")')
    print('    # print("SyntaxError: " + msg)')
    print('    # exit()')
    print('    raise SyntaxError(msg)')
    print()
    print('def ' + gen_prefix + 'advance(ts):')
    print('    ts.prev_end_lineno = ' + tok_access + 'get_end_lineno(ts)')
    print('    ts.prev_end_col_offset = ' + tok_access + 'get_end_col_offset(ts)')
    print('    ' + tok_access + 'get_token(ts)')
    print('    # ' + gen_prefix + 'show_token(ts)')
    print()
    print('def ' + gen_prefix + 'show_token(ts):')
    print('    t = ts.token')
    print('    name = ' + token_access + 'tok_name[t]')
    print('    if t == ' + token_access + 'NAME or t == ' + token_access + 'STRING or t == ' + token_access + 'NUMBER:')
    print('        print(name + " " + token(ts))')
    print('    else:')
    print('        print(name)')

def generate_parse_functions():

    global start_fn_names

    init_fn_names()

    start_fn_names = {}

    for mode in modes:
        start_rule_name = modes[mode]
        start_fn_name = get_nt_fn_name((start_rule_name, first_nt[start_rule_name]))
        start_fn_names[mode] = start_fn_name

    todo_index = 0
    while todo_index < len(todo):
        nt, known = todo[todo_index]
        todo_index += 1
        gen_rule(nt, known)

def gen_rule(nt, known):

    global current_nt, current_rule, current_sub_index

    current_nt = nt
    current_rule = rules[rule_num(nt)]
    current_sub_index = 0
    fn_name = get_nt_fn_name((nt, known))
    rhs = current_rule.rhs

    #if just_1_term(rhs): print('# ******* RULE: ' + nt + ' ' + repr(just_1_term(rhs)))

    extra_params = actions.get(current_nt, '')
    code = 'def ' + fn_name + '(ts' + extra_params + '):\n'

    if debug_level >= 2:
        code += '    # KNOWN=' + token_list_ref(known) + '\n'

    if isinstance(rhs, Alt):
        seqs = rhs.seqs
    else:
        seqs = [rhs]

    c, k = gen_alt(rhs, seqs, known, True)

    code += block(c)

    print(code)

def gen_alt(x, seqs, known, top):

    global current_alt, current_var_nbs

    code = ''
    first_x = frozenset()
    first_alt = []
    for y in seqs:
        f = first(y, universal_set())
        first_alt.append(f)
        if not f.isdisjoint(first_x):
            #fatal_error('ambiguous first sets in Alt')
            code += '# WARNING! ambiguous first sets in Alt\n'
        first_x |= f

    known_after = frozenset()
    for i in range(len(seqs)):
        c1, yes1, no1 = gen_in(first_alt[i], known)
        y = seqs[i]
        if top:
            current_alt = y
            current_var_nbs = dict()
        if isinstance(y, Seq):
            items = y.items
        else:
            items = [y]
        if c1 == 'True':
            if i==0:
                #code += '# DEBUG 2\n'
                c2, k = gen_seq(y, items, yes1, i+1 if top else 0)
                code += c2
            else:
                code += 'else:\n'
                c2, k = gen_seq(y, items, yes1, i+1 if top else 0)
                code += block(c2)
        else:
            code += ('if ' if i==0 else 'elif ') + c1 + ':\n'
            c2, k = gen_seq(y, items, yes1, i+1 if top else 0)
            code += block(c2)
        known_after |= k
        known = no1

    if known != frozenset():
        code += 'else:\n' + block(gen_error())

    return code, known_after
    
def gen_seq(x, items, known, alt_num):

    global current_rule_style, current_alt_num

    if alt_num != 0:  # toplevel alternative of RHS

        # look for patterns for which we know how to generate an AST
        # automatically

        current_rule_style = None
        current_alt_num = alt_num

        if False and (len(items) == 1 and  # rhs = Term
            isinstance(items[0],Term)):
            current_rule_style = TERM
        elif False and (len(items) == 1 and  # rhs = NTerm
              isinstance(items[0],NTerm)):
              current_rule_style = NTERM
        elif False and (len(items) == 2 and # rhs = NTerm Term
              isinstance(items[0],NTerm) and
              isinstance(items[1],Term)):
            current_rule_style = NTERM_TERM
        elif False and (len(items) == 3 and # rhs = Term NTerm Term
              isinstance(items[0],Term) and
              isinstance(items[1],NTerm) and
              isinstance(items[2],Term)):
            current_rule_style = TERM_NTERM_TERM
        elif False and (len(items) == 2 and # rhs = NTerm (1Term NTerm)*
              isinstance(items[0],NTerm) and
              isinstance(items[1],Star) and
              isinstance(items[1].atom,Seq) and
              len(items[1].atom.items) == 2 and
              just_1_term(items[1].atom.items[0]) and
              isinstance(items[1].atom.items[1],NTerm)):
            current_rule_style = NTERM_1TERM_NTERM_STAR
        elif (len(items) >= 3 and # rhs = ANY (1Term ANY)* [1Term] ...
              #isinstance(items[0],NTerm) and
              isinstance(items[1],Star) and
              isinstance(items[1].atom,Seq) and
              len(items[1].atom.items) >= 2 and
              just_1_term(items[1].atom.items[0]) and
              #isinstance(items[1].atom.items[1],NTerm) and
              isinstance(items[2],Opt) and
              just_1_term(items[2].alt) == just_1_term(items[1].atom.items[0])):
            current_rule_style = ANY_1TERM_ANY_STAR_OPT_1TERM_ETC
        #elif just_terms(rhs):
        #    current_rule_style = JUST_TERMS
        #print('# ------- ' + repr(len(items)) + ' ' + repr(current_rule_style))

    # current_rule_style = None
    code = ''
    k = known
    for i in range(len(items)):
        c, k = gen(items[i], k)
        code += c

    if False and alt_num != 0:  # toplevel alternative of RHS

        build = False

        if build:
            code += build[-1] + '\n'
        elif current_rule_style == TERM:
            code += 'return ' + items[0].v + '\n'
        elif current_rule_style == NTERM:
            code += 'return ' + items[0].v + '\n'
        elif current_rule_style == NTERM_TERM:
            code += 'return ' + items[0].v + '\n'
        elif current_rule_style == TERM_NTERM_TERM:
            code += 'return ' + items[1].v + '\n'
        elif current_rule_style == NTERM_1TERM_NTERM_STAR:
            code += 'return ' + items[0].v + '\n'
        elif current_rule_style == JUST_TERMS:
            code += 'return term'
        else:
            code += '# WARNING: don\'t know how to construct AST for rule -- ' + current_rule.name + ': ' + ' '.join((section(x.start, x.end)).replace('\n',' ').split()) + '\n' + 'return None\n'

    return code, k

TERM = 'TERM'
NTERM = 'NTERM'
NTERM_TERM = 'NTERM_TERM'
TERM_NTERM_TERM = 'TERM_NTERM_TERM'
NTERM_1TERM_NTERM_STAR = 'NTERM_1TERM_NTERM_STAR'
JUST_TERMS = 'JUST_TERMS'
ANY_1TERM_ANY_STAR_OPT_1TERM_ETC = 'ANY_1TERM_ANY_STAR_OPT_1TERM_ETC'

def gen(x, known):

    # The parameter 'known' is a set of tokens.  It is the set of
    # tokens that can possibly be the value of ts.token (because they
    # have not been eliminated by previous tests).  It is *not* the
    # set of tokens that are expected by the grammar.  This is useful
    # to generate optimized parsing code that doesn't test ts.token
    # redundantly.


    #jt = just_terms(x)
    #if jt:
    #    code += '# JUST_TERMS: ' + repr(jt) + ' ' + section(x.start, x.end) + '\n'

    here = at_start(x)
    build = actions.get(here,False)

    j1t = just_1_term(x)
    if j1t:
        code = mark_position(here)
        #print('====> ' + repr(x.name))
        #x.v = 'current_path'
        c1, yes, no = gen_in(j1t, known)
        c2, k = gen_advance()
        if build:
            c2 = build[-1] + '\n' + c2
        if c1 == 'True':
            code += c2
        else:
            code += 'if ' + c1 + ':\n' + block(c2) + 'else:\n' + block(gen_error())
        here = at_end(x)
        code += mark_position(here)
        if is_new_position:
            build = actions.get(here,False)
            if build:
                code += build[-1] + '\n'
        #code = '# KNOWN=' + token_list_ref(known) + '\n' + code
        return code, k

    if isinstance(x, Alt):
        code = mark_position(here)
        if is_new_position:
            if build:
                code += build[-1] + '\n'
        c, k = gen_alt(x, x.seqs, known, False)
        code += c
        here = at_end(x)
        code += mark_position(here)
        if is_new_position:
            build = actions.get(here,False)
            if build:
                code += build[-1] + '\n'
        return code, k

    elif isinstance(x, Seq):
        return gen_seq(x, x.items, known, 0)

    elif isinstance(x, Opt):
        code = mark_position(here)
        if is_new_position:
            if build:
                code += build[-1] + '\n'
        f = first(x.alt, universal_set())
        c1, yes, no = gen_in(f, known)
        if c1 == 'False':
            c2 = ''
            k = no
        elif c1 == 'True':
            c2, k = gen(x.alt, yes)
            code += c2
        else:
            c2, k = gen(x.alt, yes)
            code += 'if ' + c1 + ':\n' + block(c2)
        here = at_end(x)
        code += mark_position(here)
        if is_new_position:
            build = actions.get(here,False)
            if build:
                code += build[-1] + '\n'
        k = k | no
        return code, k

    elif isinstance(x, Star):
        code = mark_position(here)
        if build and len(build) == 2:
            code += build[0] + '\n'
        f = first(x.atom, universal_set())
        c1, yes, no = gen_in(f, known)
        if current_rule_style == ANY_1TERM_ANY_STAR_OPT_1TERM_ETC:
            items = x.atom.items
            c2, k = gen(items[0], yes)
            c3, _, _ = gen_in(first(items[1], universal_set()), universal_set())
            here = at_end(current_alt.items[2].alt)
            build = actions.get(here,False)
            fallthrough = mark_position(here)
            if is_new_position:
                if build:
                    fallthrough += build[-1] + '\n'
            fallthrough += 'break\n'
            c2 += 'if not (' + c3 + '):\n' + block(fallthrough)
            for i in range(1, len(items)):
                c, k = gen(items[i], k)
                c2 += c
        else:
            c2, k = gen(x.atom, yes)
            if current_rule_style == NTERM_1TERM_NTERM_STAR:
                if build:
                    c2 += build[-1] + '\n'
                else:
                    c2 += current_rule.rhs.items[0].v + ' = (op, ' + current_rule.rhs.items[0].v + ', ' + current_rule.rhs.items[1].atom.items[1].v + ')\n'
        if k == known:
            code += 'while ' + c1 + ':\n' + block(c2)
        else:
            assert False, 'k != known in Star rule'
        here = at_end(x)
        code += mark_position(here)
        if is_new_position:
            build = actions.get(here,False)
            if build:
                code += build[-1] + '\n'
        k = (known | k) - f
        return code, k

    elif isinstance(x, Plus):
        code = mark_position(here)
        if build and len(build) == 2:
            code += build[0] + '\n'
        first_x = first(x.atom, universal_set())
        c1, k = gen(x.atom, known)
        c2, yes, no = gen_in(first_x, k)
        code += 'while True:\n' + block(c1 + 'if not (' + c2 + '):\n' +  block('break'))
        here = at_end(x)
        code += mark_position(here)
        if is_new_position:
            build = actions.get(here,False)
            if build:
                code += build[-1] + '\n'
        return code, universal_set()

    # deprecated
    elif isinstance(x, Term):
        code = mark_position(here)
        #print('====> ' + repr(x.name))
        tname = token.tok_name[x.name]
        x.v = next_var(tname)
        first_x = frozenset((x.name,))
        c1, yes, no = gen_in(first_x, known)
        if (current_rule_style == TERM or
            current_rule_style == NTERM_1TERM_NTERM_STAR):
            if build:
                code += build[-1] + '\n'
            else:
                code += 'op = \'' + tname + '\'\n'
        elif current_rule_style == JUST_TERMS:
            code += 'term = \'' + tname + '\'\n'
        else:
            code += x.v + ' = ts.token\n'
        if c1 == 'True':
            c2, k = gen_advance()
            code += c2
        else:
            c2, k = gen_advance()
            code += 'if ' + c1 + ':\n' + block(c2) + 'else:\n' + block(gen_error())
        here = at_end(x)
        code += mark_position(here)
        if is_new_position:
            build = actions.get(here,False)
            if build:
                code += build[-1] + '\n'
        #code = '# KNOWN=' + token_list_ref(known) + '\n' + code
        return code, k

    elif isinstance(x, NTerm):
        code = mark_position(here)
        if is_new_position:
            if build:
                code += build[-1] + '\n'
        x.v = next_var(x.name)
        fn_name = get_nt_fn_name((x.name, known))
        extra_params = actions.get(x.name, '')
        code += x.v + ' = ' + fn_name + '(ts' + extra_params + ')\n'
        here = at_end(x)
        code += mark_position(here)
        if is_new_position:
            build = actions.get(here,False)
            if build:
                code += build[-1] + '\n'
        k = universal_set() # FIXME: could be more precise about what is known
        #code = '# KNOWN=' + token_list_ref(known) + '\n' + code
        return code, k

    else:
        fatal_error('unhandled syntax form')

def just_terms(x):

    # A syntax form is 'just_terms' if it is a choice between
    # sequences of terminals or NTs whose RHS is 'just_terms'.  This
    # function returns False or a tuple (min,max) indicating the
    # minimum and maximum number of terms matched by that syntax form.

    return just_terms_no_cycles(x, frozenset())

def just_terms_no_cycles(x, seen):
    if isinstance(x, Alt):
        jt = list(map(lambda y: just_terms_no_cycles(y, seen), x.seqs))
        if all(jt):
            return functools.reduce(lambda mm1,mm2:
                                      (min(mm1[0],mm2[0]),max(mm1[1],mm2[1])),
                                    jt)
        else:
            return False
    elif isinstance(x, Seq):
        jt = list(map(lambda y: just_terms_no_cycles(y, seen), x.items))
        if all(jt):
            return functools.reduce(lambda mm1,mm2:
                                      (mm1[0]+mm2[0],mm1[1]+mm2[1]),
                                    jt)
        else:
            return False
    elif isinstance(x, Opt):
        jt = just_terms_no_cycles(x.alt, seen)
        if jt:
            return (0,jt[1])
        else:
            return False
    elif isinstance(x, Term):
        return (1,1)
    elif isinstance(x, NTerm):
        return False
    elif isinstance(x, NTerm):
        n = rule_num(x.name)
        if n in seen:
            return False
        else:
            rule = rules[n]
            return just_terms_no_cycles(rule.rhs, seen | frozenset({n}))
    else:
        return False

def just_1_term(x):
    return just_1_term_no_cycles(x, frozenset())

def just_1_term_no_cycles(x, seen):
    if isinstance(x, Alt):
        j1t = list(map(lambda y: just_1_term_no_cycles(y, seen), x.seqs))
        if all(j1t):
            return frozenset.union(*j1t)
        else:
            return False
    elif isinstance(x, Seq):
        if len(x.items) == 1:
            return just_1_term_no_cycles(x.items[0], seen)
        else:
            return False
    elif isinstance(x, Term):
        return frozenset({x.name})
    elif isinstance(x, NTerm):
        return False
    elif isinstance(x, NTerm):
        n = rule_num(x.name)
        if n in seen:
            return False
        else:
            rule = rules[n]
            return just_1_term_no_cycles(rule.rhs, seen | frozenset({n}))
    else:
        return False
    
def token_ref(t):
    if type(t) == int:
        return token_access + token.tok_name[t]
    else:
        return str(t)

def token_list_ref(ts):
    return ','.join(map(token_ref,ts))

def tokenset_ref(s):
    if debug_level == 0:
        global tokenset_count
        if s in tokenset_dict:
            tokenset_var = tokenset_dict[s]
        else:
            tokenset_count += 1
            tokenset_var = gen_prefix + 'tokenset_' + str(tokenset_count)
            tokenset_dict[s] = tokenset_var
        return tokenset_var
    else:
        return tokenset_construct(s)

def tokenset_construct(s):
    return gen_prefix + 'tokenset(' + token_list_ref(s) + ')'

def indx(name, index):
    return name + str(index)

def gen_membership_test(expr, s):
    if len(s) <= 2:
        return ' or '.join(list(map(lambda x:expr+' == '+token_ref(x),s)));
    else:
        return expr + ' in ' + tokenset_ref(s)
        
def gen_in(s, known):

    # generates a test for ts.token in s knowing that the tokens
    # in 'known' are the only possible values of ts.token

    if known <= s:
        return 'True', known, frozenset()
    else:
        yes = known & s
        no = known - s
        if yes == frozenset():
            return 'False', yes, no
        else:
            return gen_membership_test('ts.token', yes), yes, no

def gen_advance():
    code = gen_prefix + 'advance(ts)\n'
    k = universal_set() # nothing is known about ts.token after advance(ts)
    return code, k

def gen_error():
    code = 'return ' + gen_prefix + 'syntax_error(ts, None)\n'
    return code

def main():
    parser = True
    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == '-parser':
            parser = True
        elif arg == '-fuzzer':
            parser = False
        else:
            if parser:
                read_grammar_and_generate_parser(arg)
            else:
                read_grammar_and_generate_sample(arg)
        i += 1

if __name__ == '__main__':
    main()

# -*- mode: Python; python-indent-offset: 4; python-guess-indent: nil -*-
