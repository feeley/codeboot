//=============================================================================

// File: "scanner.js"

// Copyright (c) 2010-2012 by Marc Feeley, All Rights Reserved.

//=============================================================================

// This is a scanner for the JavaScript tokens.

// Note: the scanner is incomplete.  It currently lacks support for:
//
//  - some string escapes
//  - hexadecimal numbers
//  - floating point numbers
//  - Unicode syntax
//
// Performance-wise, the scanner processes about 100,000 lines of code
// per second on a 2.8 GHz Intel Core 2 Duo (when running in V8).

//-----------------------------------------------------------------------------


function Scanner(port, error, line0, column0)
{
    this.port             = port;
    this.error            = error;
    this.current_line     = (line0 === void 0) ? 0 : line0;
    this.current_char_pos = (column0 === void 0) ? 0 : column0;
    this.current_line_pos = 0;
    this.peeked_char      = null;
    this.peeked_char_pos  = null;
    this.pos_window       = [null, null, null, null, null];
    this.char_window      = [null, null, null, null, null];
    this.window_size      = 0;
    this.crossed_eol      = false;
}


// method syntax_error(loc, msg)

Scanner.prototype.syntax_error = function (loc, msg)
{
    this.error(loc, "syntax error -- ", msg);
    throw "syntax error";
};


// method syntax_warning(loc, msg)

Scanner.prototype.syntax_warning = function (loc, msg)
{
    this.error(loc, "warning -- ", msg);
};


// method read_char()

Scanner.prototype.read_char = function ()
{
    var c = this.port.read_char();
    if (c !== EOF)
        this.current_char_pos++;
    return c;
};


// method get_char()

Scanner.prototype.get_char = function ()
{
    var c = this.peeked_char;

    if (c !== null)
        this.peeked_char = null;
    else
        c = this.read_char();

    if (c === LF_CH)
    {
        this.current_line++;
        this.current_line_pos = this.current_char_pos;
        return EOL_CH;
    }
    else if (c === CR_CH)
    {
        this.current_line++;
        this.current_line_pos = this.current_char_pos;
        this.peeked_char_pos = this.current_char_pos;
        var next = this.read_char();
        if (next === LF_CH)
            this.current_line_pos = this.current_char_pos;
        else
            this.peeked_char = next; // remember for next time
        return EOL_CH;
    }
    else
        return c;
};


// method advance(i)

Scanner.prototype.advance = function (i)
{
    var j = 0;
    this.fill_window(i);
    while (i < this.window_size)
    {
        var p = this.pos_window[i];
        var c = this.char_window[i];
        //delete this.pos_window[i];
        //delete this.char_window[i];
        this.pos_window[j] = p;
        this.char_window[j] = c;
        i++;
        j++;
    }
    this.window_size = j;
};


// method lookahead_pos(i)

Scanner.prototype.lookahead_pos = function (i)
{
    this.fill_window(i+1);
    return this.pos_window[i];
};


// method lookahead_char(i)

Scanner.prototype.lookahead_char = function (i)
{
    this.fill_window(i+1);
    return this.char_window[i];
};


// method fill_window(n)

Scanner.prototype.fill_window = function (n)
{
    // fill first n entries of the lookahead window
    var s = this.window_size;
    if (s < n)
    {
        var i = s;
        while (i < n)
        {
            var cp = (this.peeked_char === null)
                     ? this.current_char_pos
                     : this.peeked_char_pos;
            this.pos_window[i] =
                line0_and_column0_to_position(this.current_line,
                                              cp - this.current_line_pos);
            this.char_window[i] = this.get_char();
            i++;
        }
        this.window_size = i;
    }
};


// method get_token()

Scanner.prototype.get_token = function (include_comments)
{
    if (include_comments === void 0)
        include_comments = false;

    var c = this.lookahead_char(0);

    this.crossed_eol = false;

    for (;;)
    {
        if (c === EOF)
            return this.simple_token(EOI_CAT, 0);
        else if (c <= SPACE_CH || c === NBSPACE_CH) // if (c === SPACE_CH || c === EOL_CH || c === TAB_CH)
        {
            if (c === EOL_CH)
                this.crossed_eol = true;
            this.advance(1);
            c = this.lookahead_char(0);
        }
        else if (this.identifier_class(c))
            return this.parse_identifier();
        else if (this.decimal_class(c))
            return this.parse_number();
        else if (c === PERIOD_CH)
        {
            if (this.decimal_class(this.lookahead_char(1)))
                return this.parse_number();
            else
                return this.simple_token(PERIOD_CAT, 1);
        }
        else if (c === EXCL_CH)
        {
            if (this.lookahead_char(1) === EQUAL_CH)
            {
                if (this.lookahead_char(2) === EQUAL_CH)
                    return this.simple_token(STRNEQ_CAT, 3);
                else
                    return this.simple_token(NE_CAT, 2);
            }
            else
                return this.simple_token(EXCL_CAT, 1);
        }
        else if (c === PERCENT_CH)
        {
            if (this.lookahead_char(1) === EQUAL_CH)
                return this.simple_token(MODEQUAL_CAT, 2);
            else
                return this.simple_token(MOD_CAT, 1);
        }
        else if (c === AMPERSAND_CH)
        {
            var x = this.lookahead_char(1);
            if (x === AMPERSAND_CH)
                return this.simple_token(AND_CAT, 2);
            else if (x === EQUAL_CH)
                return this.simple_token(BITANDEQUAL_CAT, 2);
            else
                return this.simple_token(BITAND_CAT, 1);
        }
        else if (c === STAR_CH)
        {
            if (this.lookahead_char(1) === EQUAL_CH)
                return this.simple_token(MULTEQUAL_CAT, 2);
            else
                return this.simple_token(MULT_CAT, 1);
        }
        else if (c === PLUS_CH)
        {
            var x = this.lookahead_char(1);
            if (x === PLUS_CH)
                return this.simple_token(PLUSPLUS_CAT, 2);
            else if (x === EQUAL_CH)
                return this.simple_token(PLUSEQUAL_CAT, 2);
            else
                return this.simple_token(PLUS_CAT, 1);
        }
        else if (c === MINUS_CH)
        {
            var x = this.lookahead_char(1);
            if (x === MINUS_CH)
                return this.simple_token(MINUSMINUS_CAT, 2);
            else if (x === EQUAL_CH)
                return this.simple_token(MINUSEQUAL_CAT, 2);
            else
                return this.simple_token(MINUS_CAT, 1);
        }
        else if (c === SLASH_CH)
        {
            var start_pos = this.lookahead_pos(0);
            var x = this.lookahead_char(1);
            if (x === SLASH_CH)
            {
                this.advance(2);
                for (;;)
                {
                    c = this.lookahead_char(0);
                    if (c === EOL_CH || c === EOF)
                    {
                        this.crossed_eol = true;
                        break;
                    }
                    this.advance(1);
                }
                if (include_comments)
                    return this.valued_token(COMMENT_CAT, COMMENT_CAT, start_pos);
            }
            else if (x === STAR_CH)
            {
                var start_pos = this.lookahead_pos(0);
                this.advance(2);
                for (;;)
                {
                    c = this.lookahead_char(0);
                    if (c === EOF)
                        this.syntax_error(new Location(this.port.container,
                                                       start_pos,
                                                       this.lookahead_pos(1)),
                                          "*/ missing at end of comment");
                    if (c === STAR_CH && this.lookahead_char(1) === SLASH_CH)
                        break;
                    if (c === EOL_CH)
                        this.crossed_eol = true;
                    this.advance(1);
                }
                this.advance(2);
                if (include_comments)
                    return this.valued_token(COMMENT_CAT, COMMENT_CAT, start_pos);
                c = this.lookahead_char(0);
            }
            else if (x === EQUAL_CH)
                return this.simple_token(DIVEQUAL_CAT, 2);
            else
                return this.simple_token(DIV_CAT, 1);
        }
        else if (c === COLON_CH)
            return this.simple_token(COLON_CAT, 1);
        else if (c === EQUAL_CH)
        {
            if (this.lookahead_char(1) === EQUAL_CH)
            {
                if (this.lookahead_char(2) === EQUAL_CH)
                    return this.simple_token(STREQ_CAT, 3);
                else
                    return this.simple_token(EQEQ_CAT, 2);
            }
            else
                return this.simple_token(EQUAL_CAT, 1);
        }
        else if (c === LT_CH)
        {
            var x = this.lookahead_char(1);
            if (x === LT_CH)
            {
                if (this.lookahead_char(2) === EQUAL_CH)
                    return this.simple_token(LSHIFTEQUAL_CAT, 3);
                else
                    return this.simple_token(LSHIFT_CAT, 2);
            }
            else if (x === EQUAL_CH)
                return this.simple_token(LE_CAT, 2);
            else
                return this.simple_token(LT_CAT, 1);
        }
        else if (c === GT_CH)
        {
            var x = this.lookahead_char(1);
            if (x === GT_CH)
            {
                var y = this.lookahead_char(2);
                if (y === GT_CH)
                {
                    if (this.lookahead_char(3) === EQUAL_CH)
                        return this.simple_token(URSHIFTEQUAL_CAT, 4);
                    else
                        return this.simple_token(URSHIFT_CAT, 3);
                }
                else if (y === EQUAL_CH)
                    return this.simple_token(RSHIFTEQUAL_CAT, 3);
                else
                    return this.simple_token(RSHIFT_CAT, 2);
            }
            else if (x === EQUAL_CH)
                return this.simple_token(GE_CAT, 2);
            else
                return this.simple_token(GT_CAT, 1);
        }
        else if (c === QUESTION_CH)
            return this.simple_token(QUESTION_CAT, 1);
        else if (c === CARET_CH)
        {
            if (this.lookahead_char(1) === EQUAL_CH)
                return this.simple_token(BITXOREQUAL_CAT, 2);
            else
                return this.simple_token(BITXOR_CAT, 1);
        }
        else if (c === LPAREN_CH)
            return this.simple_token(LPAREN_CAT, 1);
        else if (c === RPAREN_CH)
            return this.simple_token(RPAREN_CAT, 1);
        else if (c === COMMA_CH)
            return this.simple_token(COMMA_CAT, 1);
        else if (c === SEMICOLON_CH)
            return this.simple_token(SEMICOLON_CAT, 1);
        else if (c === LBRACK_CH)
            return this.simple_token(LBRACK_CAT, 1);
        else if (c === VBAR_CH)
        {
            var x = this.lookahead_char(1);
            if (x === VBAR_CH)
                return this.simple_token(OR_CAT, 2);
            else if (x === EQUAL_CH)
                return this.simple_token(BITOREQUAL_CAT, 2);
            else
                return this.simple_token(BITOR_CAT, 1);
        }
        else if (c === RBRACK_CH)
            return this.simple_token(RBRACK_CAT, 1);
        else if (c === LBRACE_CH)
            return this.simple_token(LBRACE_CAT, 1);
        else if (c === RBRACE_CH)
            return this.simple_token(RBRACE_CAT, 1);
        else if (c === TILDE_CH)
            return this.simple_token(BITNOT_CAT, 1);
        else if (c === DOUBLEQUOTE_CH || c === QUOTE_CH)
            return this.parse_string();
        else
        {
            this.syntax_error(new Location(this.port.container,
                                           this.lookahead_pos(0),
                                           this.lookahead_pos(1)),
                              "illegal token");
        }
    }
};

var COMMENT_CAT = -1;


// method identifier_class()

Scanner.prototype.identifier_class = function (c)
{
    return Scanner.prototype.letter_class(c) ||
           c === UNDERSCORE_CH ||
           c === DOLLAR_CH;
};


// method letter_class()

Scanner.prototype.letter_class = function (c)
{
    return (c < 128)
           ? ((c >= LOWER_A_CH && c <= LOWER_Z_CH) ||
              (c >= UPPER_A_CH && c <= UPPER_Z_CH))
           : (c === 0xAA ||
              c === 0xB5 ||
              c === 0xBA ||
              (c >= 0xC0 && c <= 0xD6) ||
              (c >= 0xD8 && c <= 0xF6) ||
              (c >= 0xF8 && c <= 0x02C1) ||
              (c >= 0x02C6 && c <= 0x02D1) ||
              (c >= 0x02E0 && c <= 0x02E4) ||
              (c >= 0x02EC) ||
              (c >= 0x02EE) ||
              (c >= 0x0370 && c <= 0x0374) ||
              (c >= 0x0376) ||
              (c >= 0x0377) ||
              (c >= 0x037A && c <= 0x037D) ||
              (c >= 0x0386) ||
              (c >= 0x0388 && c <= 0x038A) ||
              (c >= 0x038C) ||
              (c >= 0x038E && c <= 0x03A1) ||
              (c >= 0x03A3 && c <= 0x03F5) ||
              (c >= 0x03F7 && c <= 0x0481) ||
              (c >= 0x048A && c <= 0x0527) ||
              (c >= 0x0531 && c <= 0x0556) ||
              (c >= 0x0559) ||
              (c >= 0x0561 && c <= 0x0587) ||
              (c >= 0x05D0 && c <= 0x05EA) ||
              (c >= 0x05F0 && c <= 0x05F2) ||
              (c >= 0x0620 && c <= 0x064A) ||
              (c >= 0x066E) ||
              (c >= 0x066F) ||
              (c >= 0x0671 && c <= 0x06D3) ||
              (c >= 0x06D5) ||
              (c >= 0x06E5) ||
              (c >= 0x06E6) ||
              (c >= 0x06EE) ||
              (c >= 0x06EF) ||
              (c >= 0x06FA && c <= 0x06FC) ||
              (c >= 0x06FF) ||
              (c >= 0x0710) ||
              (c >= 0x0712 && c <= 0x072F) ||
              (c >= 0x074D && c <= 0x07A5) ||
              (c >= 0x07B1) ||
              (c >= 0x07CA && c <= 0x07EA) ||
              (c >= 0x07F4) ||
              (c >= 0x07F5) ||
              (c >= 0x07FA) ||
              (c >= 0x0800 && c <= 0x0815) ||
              (c >= 0x081A) ||
              (c >= 0x0824) ||
              (c >= 0x0828) ||
              (c >= 0x0840 && c <= 0x0858) ||
              (c >= 0x08A0) ||
              (c >= 0x08A2 && c <= 0x08AC) ||
              (c >= 0x0904 && c <= 0x0939) ||
              (c >= 0x093D) ||
              (c >= 0x0950) ||
              (c >= 0x0958 && c <= 0x0961) ||
              (c >= 0x0971 && c <= 0x0977) ||
              (c >= 0x0979 && c <= 0x097F) ||
              (c >= 0x0985 && c <= 0x098C) ||
              (c >= 0x098F) ||
              (c >= 0x0990) ||
              (c >= 0x0993 && c <= 0x09A8) ||
              (c >= 0x09AA && c <= 0x09B0) ||
              (c >= 0x09B2) ||
              (c >= 0x09B6 && c <= 0x09B9) ||
              (c >= 0x09BD) ||
              (c >= 0x09CE) ||
              (c >= 0x09DC) ||
              (c >= 0x09DD) ||
              (c >= 0x09DF && c <= 0x09E1) ||
              (c >= 0x09F0) ||
              (c >= 0x09F1) ||
              (c >= 0x0A05 && c <= 0x0A0A) ||
              (c >= 0x0A0F) ||
              (c >= 0x0A10) ||
              (c >= 0x0A13 && c <= 0x0A28) ||
              (c >= 0x0A2A && c <= 0x0A30) ||
              (c >= 0x0A32) ||
              (c >= 0x0A33) ||
              (c >= 0x0A35) ||
              (c >= 0x0A36) ||
              (c >= 0x0A38) ||
              (c >= 0x0A39) ||
              (c >= 0x0A59 && c <= 0x0A5C) ||
              (c >= 0x0A5E) ||
              (c >= 0x0A72 && c <= 0x0A74) ||
              (c >= 0x0A85 && c <= 0x0A8D) ||
              (c >= 0x0A8F && c <= 0x0A91) ||
              (c >= 0x0A93 && c <= 0x0AA8) ||
              (c >= 0x0AAA && c <= 0x0AB0) ||
              (c >= 0x0AB2) ||
              (c >= 0x0AB3) ||
              (c >= 0x0AB5 && c <= 0x0AB9) ||
              (c >= 0x0ABD) ||
              (c >= 0x0AD0) ||
              (c >= 0x0AE0) ||
              (c >= 0x0AE1) ||
              (c >= 0x0B05 && c <= 0x0B0C) ||
              (c >= 0x0B0F) ||
              (c >= 0x0B10) ||
              (c >= 0x0B13 && c <= 0x0B28) ||
              (c >= 0x0B2A && c <= 0x0B30) ||
              (c >= 0x0B32) ||
              (c >= 0x0B33) ||
              (c >= 0x0B35 && c <= 0x0B39) ||
              (c >= 0x0B3D) ||
              (c >= 0x0B5C) ||
              (c >= 0x0B5D) ||
              (c >= 0x0B5F && c <= 0x0B61) ||
              (c >= 0x0B71) ||
              (c >= 0x0B83) ||
              (c >= 0x0B85 && c <= 0x0B8A) ||
              (c >= 0x0B8E && c <= 0x0B90) ||
              (c >= 0x0B92 && c <= 0x0B95) ||
              (c >= 0x0B99) ||
              (c >= 0x0B9A) ||
              (c >= 0x0B9C) ||
              (c >= 0x0B9E) ||
              (c >= 0x0B9F) ||
              (c >= 0x0BA3) ||
              (c >= 0x0BA4) ||
              (c >= 0x0BA8 && c <= 0x0BAA) ||
              (c >= 0x0BAE && c <= 0x0BB9) ||
              (c >= 0x0BD0) ||
              (c >= 0x0C05 && c <= 0x0C0C) ||
              (c >= 0x0C0E && c <= 0x0C10) ||
              (c >= 0x0C12 && c <= 0x0C28) ||
              (c >= 0x0C2A && c <= 0x0C33) ||
              (c >= 0x0C35 && c <= 0x0C39) ||
              (c >= 0x0C3D) ||
              (c >= 0x0C58) ||
              (c >= 0x0C59) ||
              (c >= 0x0C60) ||
              (c >= 0x0C61) ||
              (c >= 0x0C85 && c <= 0x0C8C) ||
              (c >= 0x0C8E && c <= 0x0C90) ||
              (c >= 0x0C92 && c <= 0x0CA8) ||
              (c >= 0x0CAA && c <= 0x0CB3) ||
              (c >= 0x0CB5 && c <= 0x0CB9) ||
              (c >= 0x0CBD) ||
              (c >= 0x0CDE) ||
              (c >= 0x0CE0) ||
              (c >= 0x0CE1) ||
              (c >= 0x0CF1) ||
              (c >= 0x0CF2) ||
              (c >= 0x0D05 && c <= 0x0D0C) ||
              (c >= 0x0D0E && c <= 0x0D10) ||
              (c >= 0x0D12 && c <= 0x0D3A) ||
              (c >= 0x0D3D) ||
              (c >= 0x0D4E) ||
              (c >= 0x0D60) ||
              (c >= 0x0D61) ||
              (c >= 0x0D7A && c <= 0x0D7F) ||
              (c >= 0x0D85 && c <= 0x0D96) ||
              (c >= 0x0D9A && c <= 0x0DB1) ||
              (c >= 0x0DB3 && c <= 0x0DBB) ||
              (c >= 0x0DBD) ||
              (c >= 0x0DC0 && c <= 0x0DC6) ||
              (c >= 0x0E01 && c <= 0x0E30) ||
              (c >= 0x0E32) ||
              (c >= 0x0E33) ||
              (c >= 0x0E40 && c <= 0x0E46) ||
              (c >= 0x0E81) ||
              (c >= 0x0E82) ||
              (c >= 0x0E84) ||
              (c >= 0x0E87) ||
              (c >= 0x0E88) ||
              (c >= 0x0E8A) ||
              (c >= 0x0E8D) ||
              (c >= 0x0E94 && c <= 0x0E97) ||
              (c >= 0x0E99 && c <= 0x0E9F) ||
              (c >= 0x0EA1 && c <= 0x0EA3) ||
              (c >= 0x0EA5) ||
              (c >= 0x0EA7) ||
              (c >= 0x0EAA) ||
              (c >= 0x0EAB) ||
              (c >= 0x0EAD && c <= 0x0EB0) ||
              (c >= 0x0EB2) ||
              (c >= 0x0EB3) ||
              (c >= 0x0EBD) ||
              (c >= 0x0EC0 && c <= 0x0EC4) ||
              (c >= 0x0EC6) ||
              (c >= 0x0EDC && c <= 0x0EDF) ||
              (c >= 0x0F00) ||
              (c >= 0x0F40 && c <= 0x0F47) ||
              (c >= 0x0F49 && c <= 0x0F6C) ||
              (c >= 0x0F88 && c <= 0x0F8C) ||
              (c >= 0x1000 && c <= 0x102A) ||
              (c >= 0x103F) ||
              (c >= 0x1050 && c <= 0x1055) ||
              (c >= 0x105A && c <= 0x105D) ||
              (c >= 0x1061) ||
              (c >= 0x1065) ||
              (c >= 0x1066) ||
              (c >= 0x106E && c <= 0x1070) ||
              (c >= 0x1075 && c <= 0x1081) ||
              (c >= 0x108E) ||
              (c >= 0x10A0 && c <= 0x10C5) ||
              (c >= 0x10C7) ||
              (c >= 0x10CD) ||
              (c >= 0x10D0 && c <= 0x10FA) ||
              (c >= 0x10FC && c <= 0x1248) ||
              (c >= 0x124A && c <= 0x124D) ||
              (c >= 0x1250 && c <= 0x1256) ||
              (c >= 0x1258) ||
              (c >= 0x125A && c <= 0x125D) ||
              (c >= 0x1260 && c <= 0x1288) ||
              (c >= 0x128A && c <= 0x128D) ||
              (c >= 0x1290 && c <= 0x12B0) ||
              (c >= 0x12B2 && c <= 0x12B5) ||
              (c >= 0x12B8 && c <= 0x12BE) ||
              (c >= 0x12C0) ||
              (c >= 0x12C2 && c <= 0x12C5) ||
              (c >= 0x12C8 && c <= 0x12D6) ||
              (c >= 0x12D8 && c <= 0x1310) ||
              (c >= 0x1312 && c <= 0x1315) ||
              (c >= 0x1318 && c <= 0x135A) ||
              (c >= 0x1380 && c <= 0x138F) ||
              (c >= 0x13A0 && c <= 0x13F4) ||
              (c >= 0x1401 && c <= 0x166C) ||
              (c >= 0x166F && c <= 0x167F) ||
              (c >= 0x1681 && c <= 0x169A) ||
              (c >= 0x16A0 && c <= 0x16EA) ||
              (c >= 0x1700 && c <= 0x170C) ||
              (c >= 0x170E && c <= 0x1711) ||
              (c >= 0x1720 && c <= 0x1731) ||
              (c >= 0x1740 && c <= 0x1751) ||
              (c >= 0x1760 && c <= 0x176C) ||
              (c >= 0x176E && c <= 0x1770) ||
              (c >= 0x1780 && c <= 0x17B3) ||
              (c >= 0x17D7) ||
              (c >= 0x17DC) ||
              (c >= 0x1820 && c <= 0x1877) ||
              (c >= 0x1880 && c <= 0x18A8) ||
              (c >= 0x18AA) ||
              (c >= 0x18B0 && c <= 0x18F5) ||
              (c >= 0x1900 && c <= 0x191C) ||
              (c >= 0x1950 && c <= 0x196D) ||
              (c >= 0x1970 && c <= 0x1974) ||
              (c >= 0x1980 && c <= 0x19AB) ||
              (c >= 0x19C1 && c <= 0x19C7) ||
              (c >= 0x1A00 && c <= 0x1A16) ||
              (c >= 0x1A20 && c <= 0x1A54) ||
              (c >= 0x1AA7) ||
              (c >= 0x1B05 && c <= 0x1B33) ||
              (c >= 0x1B45 && c <= 0x1B4B) ||
              (c >= 0x1B83 && c <= 0x1BA0) ||
              (c >= 0x1BAE) ||
              (c >= 0x1BAF) ||
              (c >= 0x1BBA && c <= 0x1BE5) ||
              (c >= 0x1C00 && c <= 0x1C23) ||
              (c >= 0x1C4D && c <= 0x1C4F) ||
              (c >= 0x1C5A && c <= 0x1C7D) ||
              (c >= 0x1CE9 && c <= 0x1CEC) ||
              (c >= 0x1CEE && c <= 0x1CF1) ||
              (c >= 0x1CF5) ||
              (c >= 0x1CF6) ||
              (c >= 0x1D00 && c <= 0x1DBF) ||
              (c >= 0x1E00 && c <= 0x1F15) ||
              (c >= 0x1F18 && c <= 0x1F1D) ||
              (c >= 0x1F20 && c <= 0x1F45) ||
              (c >= 0x1F48 && c <= 0x1F4D) ||
              (c >= 0x1F50 && c <= 0x1F57) ||
              (c >= 0x1F59) ||
              (c >= 0x1F5B) ||
              (c >= 0x1F5D) ||
              (c >= 0x1F5F && c <= 0x1F7D) ||
              (c >= 0x1F80 && c <= 0x1FB4) ||
              (c >= 0x1FB6 && c <= 0x1FBC) ||
              (c >= 0x1FBE) ||
              (c >= 0x1FC2 && c <= 0x1FC4) ||
              (c >= 0x1FC6 && c <= 0x1FCC) ||
              (c >= 0x1FD0 && c <= 0x1FD3) ||
              (c >= 0x1FD6 && c <= 0x1FDB) ||
              (c >= 0x1FE0 && c <= 0x1FEC) ||
              (c >= 0x1FF2 && c <= 0x1FF4) ||
              (c >= 0x1FF6 && c <= 0x1FFC) ||
              (c >= 0x2071) ||
              (c >= 0x207F) ||
              (c >= 0x2090 && c <= 0x209C) ||
              (c >= 0x2102) ||
              (c >= 0x2107) ||
              (c >= 0x210A && c <= 0x2113) ||
              (c >= 0x2115) ||
              (c >= 0x2119 && c <= 0x211D) ||
              (c >= 0x2124) ||
              (c >= 0x2126) ||
              (c >= 0x2128) ||
              (c >= 0x212A && c <= 0x212D) ||
              (c >= 0x212F && c <= 0x2139) ||
              (c >= 0x213C && c <= 0x213F) ||
              (c >= 0x2145 && c <= 0x2149) ||
              (c >= 0x214E) ||
              (c >= 0x2183) ||
              (c >= 0x2184) ||
              (c >= 0x2C00 && c <= 0x2C2E) ||
              (c >= 0x2C30 && c <= 0x2C5E) ||
              (c >= 0x2C60 && c <= 0x2CE4) ||
              (c >= 0x2CEB && c <= 0x2CEE) ||
              (c >= 0x2CF2) ||
              (c >= 0x2CF3) ||
              (c >= 0x2D00 && c <= 0x2D25) ||
              (c >= 0x2D27) ||
              (c >= 0x2D2D) ||
              (c >= 0x2D30 && c <= 0x2D67) ||
              (c >= 0x2D6F) ||
              (c >= 0x2D80 && c <= 0x2D96) ||
              (c >= 0x2DA0 && c <= 0x2DA6) ||
              (c >= 0x2DA8 && c <= 0x2DAE) ||
              (c >= 0x2DB0 && c <= 0x2DB6) ||
              (c >= 0x2DB8 && c <= 0x2DBE) ||
              (c >= 0x2DC0 && c <= 0x2DC6) ||
              (c >= 0x2DC8 && c <= 0x2DCE) ||
              (c >= 0x2DD0 && c <= 0x2DD6) ||
              (c >= 0x2DD8 && c <= 0x2DDE) ||
              (c >= 0x2E2F) ||
              (c >= 0x3005) ||
              (c >= 0x3006) ||
              (c >= 0x3031 && c <= 0x3035) ||
              (c >= 0x303B) ||
              (c >= 0x303C) ||
              (c >= 0x3041 && c <= 0x3096) ||
              (c >= 0x309D && c <= 0x309F) ||
              (c >= 0x30A1 && c <= 0x30FA) ||
              (c >= 0x30FC && c <= 0x30FF) ||
              (c >= 0x3105 && c <= 0x312D) ||
              (c >= 0x3131 && c <= 0x318E) ||
              (c >= 0x31A0 && c <= 0x31BA) ||
              (c >= 0x31F0 && c <= 0x31FF) ||
              (c >= 0x3400 && c <= 0x4DB5) ||
              (c >= 0x4E00 && c <= 0x9FCC) ||
              (c >= 0xA000 && c <= 0xA48C) ||
              (c >= 0xA4D0 && c <= 0xA4FD) ||
              (c >= 0xA500 && c <= 0xA60C) ||
              (c >= 0xA610 && c <= 0xA61F) ||
              (c >= 0xA62A) ||
              (c >= 0xA62B) ||
              (c >= 0xA640 && c <= 0xA66E) ||
              (c >= 0xA67F && c <= 0xA697) ||
              (c >= 0xA6A0 && c <= 0xA6E5) ||
              (c >= 0xA717 && c <= 0xA71F) ||
              (c >= 0xA722 && c <= 0xA788) ||
              (c >= 0xA78B && c <= 0xA78E) ||
              (c >= 0xA790 && c <= 0xA793) ||
              (c >= 0xA7A0 && c <= 0xA7AA) ||
              (c >= 0xA7F8 && c <= 0xA801) ||
              (c >= 0xA803 && c <= 0xA805) ||
              (c >= 0xA807 && c <= 0xA80A) ||
              (c >= 0xA80C && c <= 0xA822) ||
              (c >= 0xA840 && c <= 0xA873) ||
              (c >= 0xA882 && c <= 0xA8B3) ||
              (c >= 0xA8F2 && c <= 0xA8F7) ||
              (c >= 0xA8FB) ||
              (c >= 0xA90A && c <= 0xA925) ||
              (c >= 0xA930 && c <= 0xA946) ||
              (c >= 0xA960 && c <= 0xA97C) ||
              (c >= 0xA984 && c <= 0xA9B2) ||
              (c >= 0xA9CF) ||
              (c >= 0xAA00 && c <= 0xAA28) ||
              (c >= 0xAA40 && c <= 0xAA42) ||
              (c >= 0xAA44 && c <= 0xAA4B) ||
              (c >= 0xAA60 && c <= 0xAA76) ||
              (c >= 0xAA7A) ||
              (c >= 0xAA80 && c <= 0xAAAF) ||
              (c >= 0xAAB1) ||
              (c >= 0xAAB5) ||
              (c >= 0xAAB6) ||
              (c >= 0xAAB9 && c <= 0xAABD) ||
              (c >= 0xAAC0) ||
              (c >= 0xAAC2) ||
              (c >= 0xAADB && c <= 0xAADD) ||
              (c >= 0xAAE0 && c <= 0xAAEA) ||
              (c >= 0xAAF2 && c <= 0xAAF4) ||
              (c >= 0xAB01 && c <= 0xAB06) ||
              (c >= 0xAB09 && c <= 0xAB0E) ||
              (c >= 0xAB11 && c <= 0xAB16) ||
              (c >= 0xAB20 && c <= 0xAB26) ||
              (c >= 0xAB28 && c <= 0xAB2E) ||
              (c >= 0xABC0 && c <= 0xABE2) ||
              (c >= 0xAC00 && c <= 0xD7A3) ||
              (c >= 0xD7B0 && c <= 0xD7C6) ||
              (c >= 0xD7CB && c <= 0xD7FB) ||
              (c >= 0xF900 && c <= 0xFA6D) ||
              (c >= 0xFA70 && c <= 0xFAD9) ||
              (c >= 0xFB00 && c <= 0xFB06) ||
              (c >= 0xFB13 && c <= 0xFB17) ||
              (c >= 0xFB1D) ||
              (c >= 0xFB1F && c <= 0xFB28) ||
              (c >= 0xFB2A && c <= 0xFB36) ||
              (c >= 0xFB38 && c <= 0xFB3C) ||
              (c >= 0xFB3E) ||
              (c >= 0xFB40) ||
              (c >= 0xFB41) ||
              (c >= 0xFB43) ||
              (c >= 0xFB44) ||
              (c >= 0xFB46 && c <= 0xFBB1) ||
              (c >= 0xFBD3 && c <= 0xFD3D) ||
              (c >= 0xFD50 && c <= 0xFD8F) ||
              (c >= 0xFD92 && c <= 0xFDC7) ||
              (c >= 0xFDF0 && c <= 0xFDFB) ||
              (c >= 0xFE70 && c <= 0xFE74) ||
              (c >= 0xFE76 && c <= 0xFEFC) ||
              (c >= 0xFF21 && c <= 0xFF3A) ||
              (c >= 0xFF41 && c <= 0xFF5A) ||
              (c >= 0xFF66 && c <= 0xFFBE) ||
              (c >= 0xFFC2 && c <= 0xFFC7) ||
              (c >= 0xFFCA && c <= 0xFFCF) ||
              (c >= 0xFFD2 && c <= 0xFFD7) ||
              (c >= 0xFFDA && c <= 0xFFDC));
};


// method decimal_class()

Scanner.prototype.decimal_class = function (c)
{
    return c >= ZERO_CH && c <= NINE_CH;
};

// method hexadecimal_class()

Scanner.prototype.hexadecimal_class = function (c)
{
    return Scanner.prototype.decimal_class(c) ||
           (c >= LOWER_A_CH && c <= LOWER_F_CH) ||
           (c >= UPPER_A_CH && c <= UPPER_F_CH);
};

// method get_keyword(id)

Scanner.prototype.get_keyword = function (id)
{
    var h = 0;
    for (var i=0; i<id.length; i++)
        h = (h * HASH_MULT + id.charCodeAt(i)) % HASH_MOD;
    var x = keyword_hashtable[h];
    if (x === null || x.id !== id)
        return null;
    else
        return x;
};

// method parse_identifier()

Scanner.prototype.parse_identifier = function ()
{
    var start_pos = this.lookahead_pos(0);
    var id = this.parse_identifier_string();
    var x = this.get_keyword(id);
    if (x !== null && x.enabled === true)
        return this.valued_token(x.cat, id, start_pos);
    else if (x !== null)
        return this.valued_token(IDENT_CAT, id + "_", start_pos);
    else
        return this.valued_token(IDENT_CAT, id, start_pos);
};

Scanner.prototype.parse_identifier_string = function ()
{
    return String.fromCharCode.apply(null,
                                     this.parse_identifier_string_loop(0));
};

Scanner.prototype.parse_identifier_string_loop = function (n)
{
    // This recursive algorithm saves the characters on the stack
    // and allocates an array of the correct size to hold them.
    // It does not generate garbage.

    var chars;
    var c = this.lookahead_char(0);

    if (this.identifier_class(c) || this.decimal_class(c))
    {
        this.advance(1);
        chars = this.parse_identifier_string_loop(n+1);
        chars[n] = c;
    }
    else
    {
        chars = new Array(n);
    }

    return chars;
};


// method parse_number()
// WARNING: The following implementation will not work
//          in a multi-threaded environment because
//          there could be a race condition on that
// TODO: Refactor not to use a closure and assume 
//       private functions will be lambda lifted
//       by the compiler
Scanner.prototype.parse_number = function ()
{
    // Assuming:
    //     digits      := [0-9]+
    //
    // 3 types of numbers can be parsed:
    //     decimal     := digits
    //     hexadecimal := 0(x|X)[0-9a-fA-F]+
    //     float       := [digits][.digits][(e|E)[(+|-)]digits]

    // Workaround to allow private helper functions
    // to access the "this" object
    var scanner;

    var chars;

    // Computes the value of a serie of digit characters
    // as if they are on the "left-hand side" of the decimal point
    var lhs_value = function (accepted_char, base, char_value) 
    {
        var n = 0;
        for (;;)
        {
            var c = scanner.lookahead_char(0);
            if (!accepted_char(c))
                break;
            chars.write_char(c);
            scanner.advance(1);
            n = num_add(num_mul(n, base), char_value(c));
        }
        return n;
    };
    
    // Computes the value of a serie of digit characters
    // as if they are on the "right-hand side" of the decimal point
    var rhs_value = function (accepted_char, base, char_value)
    {
        var n = 0;
        var pos = 1;
        for (;;)
        {
            var c = scanner.lookahead_char(0);
            if (!accepted_char(c))
                break;
            chars.write_char(c);
            scanner.advance(1);
            pos = pos * base;
            n = n * base + char_value(c);
        }
        return n/pos; // FIXME: remove reliance on floating point division
    };

    // Decimal helper functions
    function decimal (c)
    {
        return scanner.decimal_class(c);
    }
    
    function decimal_value (c)
    {
        return c - ZERO_CH;
    }   

    // Hex helper functions
    function hexadecimal (c)
    {
        return scanner.hexadecimal_class(c);
    }

    function hexadecimal_value (c) 
    {
        if (c >= LOWER_A_CH) 
        {
            return (c - LOWER_A_CH) + 10;
        } else if (c >= UPPER_A_CH)
        {
            return (c - UPPER_A_CH) + 10; 
        } else
        {
            return decimal_value(c);
        }
    }

    // parsing function
    return function ()
    {
        // Workaround for passing "this"
        scanner = this;

        chars = new String_output_port("");

        var start_pos = scanner.lookahead_pos(0);
        var n;
        var fst_char = scanner.lookahead_char(0);
        var snd_char = scanner.lookahead_char(1);
        var exp_sign = 1;

        if (fst_char === ZERO_CH &&
            (snd_char === LOWER_X_CH || snd_char === UPPER_X_CH))
        {
            // We got an hex number!
            chars.write_char(fst_char);
            chars.write_char(snd_char);
            scanner.advance(2);
            n = lhs_value(hexadecimal, 16, hexadecimal_value);
        }
        else 
        {
            // TODO: Use Clinger's algorithm:
            // http://portal.acm.org/citation.cfm?id=93542.93557

            // We got a decimal number! This should be
            // zero if the first character is a decimal point.
            n = lhs_value(decimal, 10, decimal_value);

            // We might have numbers after the decimal points
            if (scanner.lookahead_char(0) === PERIOD_CH)
            {
                chars.write_char(PERIOD_CH);
                scanner.advance(1);
                n = n + rhs_value(decimal, 10, decimal_value);
            }

            // Let's check for an exponent
            fst_char = scanner.lookahead_char(0);
            if (fst_char === LOWER_E_CH || fst_char === UPPER_E_CH)
            {
                chars.write_char(fst_char);
                scanner.advance(1);

                // The exponent might have a sign  
                fst_char = scanner.lookahead_char(0);
                if (fst_char === PLUS_CH)
                {
                    exp_sign = 1;
                    chars.write_char(fst_char);
                    scanner.advance(1);
                } else if (fst_char === MINUS_CH)
                {  
                    exp_sign = -1;
                    chars.write_char(fst_char);
                    scanner.advance(1);
                } 

                n = n * Math.pow(10, exp_sign * 
                                     lhs_value(decimal, 10, decimal_value));
            }
        }

        // Use the JavaScript unary + operator to convert token to number
        return scanner.valued_token(NUMBER_CAT, +chars.get_output_string(), start_pos);
    };
}();


// method parse_string()

Scanner.prototype.parse_string = function ()
{
    var scanner = this;
    var start_pos = this.lookahead_pos(0);
    var chars = new String_output_port("");
    var close = this.lookahead_char(0);

    function add_char(c)
    {
        chars.write_char(c);
    }

    function unterminated_string()
    {
        scanner.syntax_error(new Location(scanner.port.container,
                                          start_pos,
                                          scanner.lookahead_pos(1)),
                             (close === DOUBLEQUOTE_CH)
                             ? "\" missing at end of string"
                             : "' missing at end of string");
    }

    this.advance(1);
    for (;;)
    {
        var c = this.lookahead_char(0);
        if (c === EOF || c === EOL_CH)
            unterminated_string();
        this.advance(1);
        if (c === close)
            break;
        else if (c === BACKSLASH_CH)
        {
            c = this.lookahead_char(0);
            if (c === EOF)
                unterminated_string();
            this.advance(1);
            if (c !== LF_CH)
            {
                if (c === LOWER_N_CH)
                    c = LF_CH;
                else if (c === ZERO_CH)
                    c = NUL_CH;
                else if (c === LOWER_B_CH)
                    c = BS_CH;
                else if (c === LOWER_T_CH)
                    c = TAB_CH;
                else if (c === LOWER_V_CH)
                    c = VT_CH;
                else if (c === LOWER_F_CH)
                    c = FF_CH;
                else if (c === LOWER_R_CH)
                    c = CR_CH;
                else if (c === LOWER_X_CH)
                {
                    // Parse \xXX string syntax
                    var value = 0, i = 0;

                    for (; i < 2; ++i)
                    {
                        var hc = this.lookahead_char(i);

                        if (hc >= LOWER_A_CH && hc <= LOWER_F_CH)
                            value = (value * 16) + (hc - 87);
                        else if (hc >= UPPER_A_CH && hc <= UPPER_F_CH)
                            value = (value * 16) + (hc - 55);
                        else if (hc >= ZERO_CH && hc <= NINE_CH)
                            value = (value * 16) + (hc - 48);
                        else
                            break;   
                    }

                    if (i !== 2)
                    {
                        c = LOWER_X_CH;
                    }
                    else
                    {
                        this.advance(2);
                        c = value;
                    }
                }
                else if (c === LOWER_U_CH)
                {
                    // Parse \uXXXX string syntax
                    var value = 0, i = 0;

                    for (; i < 4; ++i)
                    {
                        var hc = this.lookahead_char(i);

                        if (hc >= LOWER_A_CH && hc <= LOWER_F_CH)
                            value = (value * 16) + (hc - 87);
                        else if (hc >= UPPER_A_CH && hc <= UPPER_F_CH)
                            value = (value * 16) + (hc - 55);
                        else if (hc >= ZERO_CH && hc <= NINE_CH)
                            value = (value * 16) + (hc - 48);
                        else
                            break;   
                    }

                    if (i !== 4)
                    {
                        c = LOWER_U_CH;
                    }
                    else
                    {
                        this.advance(4);
                        c = value;
                    }
                }
                add_char(c);
            }
        }
        else
            add_char(c);
    }
    var str = chars.get_output_string();
    return this.valued_token(STRING_CAT, str, start_pos);
};

Scanner.prototype.parse_regexp = function (div_tok)
{
    var scanner = this;
    var start_pos = this.lookahead_pos(0);
    var regexp_chars = new String_output_port("");
    var pattern_chars = new String_output_port("");
    var flags_chars = new String_output_port("");
    var c;

    function unterminated_regexp()
    {
        scanner.syntax_error(new Location(scanner.port.container,
                                          div_tok.loc.start_pos,
                                          scanner.lookahead_pos(1)),
                             "/ missing at end of regexp");
    }

    function read_char()
    {
        var c = scanner.lookahead_char(0);

        if (c === EOF || c === EOL_CH) // end-of-file or end-of-line
            unterminated_regexp();

        scanner.advance(1);
        regexp_chars.write_char(c);

        return c;
    }

    function read_pattern_char()
    {
        var c = read_char();
        pattern_chars.write_char(c);
        return c;
    }

    regexp_chars.write_char(SLASH_CH);

    if (div_tok.cat === DIVEQUAL_CAT)
    {
        regexp_chars.write_char(EQUAL_CH);
        pattern_chars.write_char(EQUAL_CH);
    }

    for (;;)
    {
        c = read_char();

        if (c === SLASH_CH) // /
            break;

        pattern_chars.write_char(c);
        if (c === BACKSLASH_CH) // \
            read_pattern_char();
        else if (c === LBRACK_CH) // [
        {
            for (;;)
            {
                c = read_pattern_char();

                if (c === RBRACK_CH) // ]
                    break;
                else if (c === BACKSLASH_CH) // \
                    read_pattern_char();
            }
        }
    }

    for (;;)
    {
        c = this.lookahead_char(0);

        if (!(this.identifier_class(c) || this.decimal_class(c)))
            break;

        this.advance(1);
        regexp_chars.write_char(c);
        flags_chars.write_char(c);
    }

    return {
             regexp: regexp_chars.get_output_string(),
             pattern: pattern_chars.get_output_string(),
             flags: flags_chars.get_output_string(),
             loc: new Location(this.port.container,
                               start_pos,
                               this.lookahead_pos(0))
           };
};

// method simple_token(cat, n)

Scanner.prototype.simple_token = function (cat, n)
{
    var loc = new Location(this.port.container,
                           this.lookahead_pos(0),
                           this.lookahead_pos(n));
    this.advance(n);
    return new Token(cat, cat, loc);
};


// method valued_token(cat, value, start_pos)

Scanner.prototype.valued_token = function (cat, value, start_pos)
{
    var loc = new Location(this.port.container,
                           start_pos,
                           this.lookahead_pos(0));
    return new Token(cat, value, loc);
};

// method is_identifier(str)

Scanner.prototype.is_identifier = function (str)
{
    if (str.length === 0) {
        return false;
    }

    for (var i=0; i<str.length; i++) {
        var c = str.charCodeAt(i);
        if (!(Scanner.prototype.identifier_class(c) ||
              (i>0 && Scanner.prototype.decimal_class(c)))) {
            return false;
        }
    }

    return true;
};

// method is_keyword(str)

Scanner.prototype.is_keyword = function (str)
{
    var x = Scanner.prototype.get_keyword(str);
    return x !== null && x.enabled === true;
};

function Token(cat, value, loc)
{
    this.cat   = cat;
    this.value = value;
    this.loc   = loc;
}


Token.prototype.toString = function ()
{
    return this.value.toString();
};


var NUL_CH         =   0;
var BS_CH          =   8;
var TAB_CH         =   9;
var EOL_CH         =  10;
var LF_CH          =  10;
var VT_CH          =  11;
var FF_CH          =  12;
var CR_CH          =  13;
var SPACE_CH       =  32;
var EXCL_CH        =  33;
var DOUBLEQUOTE_CH =  34;
var DOLLAR_CH      =  36;
var PERCENT_CH     =  37;
var AMPERSAND_CH   =  38;
var QUOTE_CH       =  39;
var LPAREN_CH      =  40;
var RPAREN_CH      =  41;
var STAR_CH        =  42;
var PLUS_CH        =  43;
var COMMA_CH       =  44;
var MINUS_CH       =  45;
var PERIOD_CH      =  46;
var SLASH_CH       =  47;
var ZERO_CH        =  48;
var NINE_CH        =  57;
var COLON_CH       =  58;
var SEMICOLON_CH   =  59;
var LT_CH          =  60;
var EQUAL_CH       =  61;
var GT_CH          =  62;
var QUESTION_CH    =  63;
var AT_CH          =  64;
var UPPER_A_CH     =  65;
var UPPER_B_CH     =  66;
var UPPER_D_CH     =  68;
var UPPER_E_CH     =  69;
var UPPER_F_CH     =  70;
var UPPER_S_CH     =  83;
var UPPER_W_CH     =  87;
var UPPER_X_CH     =  88;
var UPPER_Z_CH     =  90;
var LBRACK_CH      =  91;
var BACKSLASH_CH   =  92;
var RBRACK_CH      =  93;
var CARET_CH       =  94;
var UNDERSCORE_CH  =  95;
var LOWER_A_CH     =  97;
var LOWER_B_CH     =  98;
var LOWER_C_CH     =  99;
var LOWER_D_CH     = 100;
var LOWER_E_CH     = 101;
var LOWER_F_CH     = 102;
var LOWER_N_CH     = 110;
var LOWER_R_CH     = 114;
var LOWER_S_CH     = 115;
var LOWER_T_CH     = 116;
var LOWER_U_CH     = 117;
var LOWER_V_CH     = 118;
var LOWER_W_CH     = 119;
var LOWER_X_CH     = 120;
var LOWER_Z_CH     = 122;
var LBRACE_CH      = 123;
var VBAR_CH        = 124;
var RBRACE_CH      = 125;
var TILDE_CH       = 126;
var NBSPACE_CH     = 160;


//-----------------------------------------------------------------------------

// Scanner tables.
//
// *** DO NOT MODIFY THIS SECTION ***
//
// This code was generated by the scripts "yacc2js.scm" and
// "build-keyword-ht.scm".

//START-OF-SCANNER-TABLES
var EOI_CAT = 0;
var error_CAT = 1;
var AUTOSEMICOLON_CAT = 2;
var NULL_CAT = 3;
var TRUE_CAT = 4;
var FALSE_CAT = 5;
var BREAK_CAT = 6;
var CASE_CAT = 7;
var DEFAULT_CAT = 8;
var FOR_CAT = 9;
var NEW_CAT = 10;
var VAR_CAT = 11;
var CONST_CAT = 12;
var CONTINUE_CAT = 13;
var FUNCTION_CAT = 14;
var RETURN_CAT = 15;
var VOID_CAT = 16;
var DELETE_CAT = 17;
var IF_CAT = 18;
var THIS_CAT = 19;
var DO_CAT = 20;
var WHILE_CAT = 21;
var IN_CAT = 22;
var INSTANCEOF_CAT = 23;
var TYPEOF_CAT = 24;
var SWITCH_CAT = 25;
var WITH_CAT = 26;
var RESERVED_CAT = 27;
var THROW_CAT = 28;
var TRY_CAT = 29;
var CATCH_CAT = 30;
var FINALLY_CAT = 31;
var DEBUGGER_CAT = 32;
var EQEQ_CAT = 33;
var NE_CAT = 34;
var STREQ_CAT = 35;
var STRNEQ_CAT = 36;
var LE_CAT = 37;
var GE_CAT = 38;
var OR_CAT = 39;
var AND_CAT = 40;
var PLUSPLUS_CAT = 41;
var MINUSMINUS_CAT = 42;
var LSHIFT_CAT = 43;
var RSHIFT_CAT = 44;
var URSHIFT_CAT = 45;
var PLUSEQUAL_CAT = 46;
var MINUSEQUAL_CAT = 47;
var MULTEQUAL_CAT = 48;
var DIVEQUAL_CAT = 49;
var LSHIFTEQUAL_CAT = 50;
var RSHIFTEQUAL_CAT = 51;
var URSHIFTEQUAL_CAT = 52;
var BITANDEQUAL_CAT = 53;
var MODEQUAL_CAT = 54;
var BITXOREQUAL_CAT = 55;
var BITOREQUAL_CAT = 56;
var LBRACE_CAT = 57;
var RBRACE_CAT = 58;
var NUMBER_CAT = 59;
var IDENT_CAT = 60;
var STRING_CAT = 61;
var AUTOPLUSPLUS_CAT = 62;
var AUTOMINUSMINUS_CAT = 63;
var CLASS_CAT = 64;
var ENUM_CAT = 65;
var EXPORT_CAT = 66;
var EXTENDS_CAT = 67;
var IMPORT_CAT = 68;
var SUPER_CAT = 69;
var IMPLEMENTS_CAT = 70;
var INTERFACE_CAT = 71;
var LET_CAT = 72;
var PACKAGE_CAT = 73;
var PRIVATE_CAT = 74;
var PROTECTED_CAT = 75;
var PUBLIC_CAT = 76;
var STATIC_CAT = 77;
var YIELD_CAT = 78;
var PLUS_CAT = 79;
var LPAREN_CAT = 80;
var EQUAL_CAT = 81;
var LT_CAT = 82;
var COLON_CAT = 83;
var BITOR_CAT = 84;
var EXCL_CAT = 85;
var LBRACK_CAT = 86;
var RBRACK_CAT = 87;
var DIV_CAT = 88;
var MINUS_CAT = 89;
var COMMA_CAT = 90;
var MULT_CAT = 91;
var RPAREN_CAT = 92;
var GT_CAT = 93;
var BITAND_CAT = 94;
var BITNOT_CAT = 95;
var QUESTION_CAT = 96;
var SEMICOLON_CAT = 97;
var BITXOR_CAT = 98;
var MOD_CAT = 99;
var PERIOD_CAT = 100;
var ELSE_CAT = 101;
var IF_WITHOUT_ELSE_CAT = 102;

var HASH_MOD = 147;
var HASH_MULT = 17;

var keyword_hashtable =
[
 { id: "const", cat: CONST_CAT, enabled: true }
,{ id: "continue", cat: CONTINUE_CAT, enabled: true }
,null
,null
,null
,null
,null
,null
,null
,{ id: "try", cat: TRY_CAT, enabled: true }
,null
,null
,null
,null
,{ id: "finally", cat: FINALLY_CAT, enabled: true }
,null
,null
,null
,null
,{ id: "enum", cat: ENUM_CAT, enabled: true }
,null
,{ id: "for", cat: FOR_CAT, enabled: true }
,null
,null
,{ id: "debugger", cat: DEBUGGER_CAT, enabled: true }
,{ id: "class", cat: CLASS_CAT, enabled: true }
,null
,{ id: "public", cat: PUBLIC_CAT, enabled: true }
,null
,null
,null
,null
,{ id: "switch", cat: SWITCH_CAT, enabled: true }
,null
,null
,null
,null
,null
,{ id: "break", cat: BREAK_CAT, enabled: true }
,{ id: "true", cat: TRUE_CAT, enabled: true }
,null
,null
,{ id: "typeof", cat: TYPEOF_CAT, enabled: true }
,null
,null
,null
,{ id: "this", cat: THIS_CAT, enabled: true }
,{ id: "do", cat: DO_CAT, enabled: true }
,null
,null
,null
,null
,null
,{ id: "throw", cat: THROW_CAT, enabled: true }
,null
,null
,null
,null
,null
,null
,null
,null
,null
,null
,{ id: "implements", cat: IMPLEMENTS_CAT, enabled: true }
,{ id: "case", cat: CASE_CAT, enabled: true }
,null
,null
,null
,{ id: "package", cat: PACKAGE_CAT, enabled: true }
,null
,null
,null
,null
,null
,{ id: "delete", cat: DELETE_CAT, enabled: true }
,null
,null
,{ id: "default", cat: DEFAULT_CAT, enabled: true }
,null
,{ id: "import", cat: IMPORT_CAT, enabled: true }
,{ id: "super", cat: SUPER_CAT, enabled: true }
,null
,{ id: "protected", cat: PROTECTED_CAT, enabled: true }
,{ id: "false", cat: FALSE_CAT, enabled: true }
,null
,null
,null
,{ id: "yield", cat: YIELD_CAT, enabled: true }
,null
,null
,null
,null
,null
,{ id: "null", cat: NULL_CAT, enabled: true }
,{ id: "return", cat: RETURN_CAT, enabled: true }
,null
,null
,null
,null
,null
,null
,null
,null
,{ id: "while", cat: WHILE_CAT, enabled: true }
,null
,null
,null
,null
,{ id: "with", cat: WITH_CAT, enabled: true }
,{ id: "new", cat: NEW_CAT, enabled: true }
,null
,null
,null
,null
,{ id: "private", cat: PRIVATE_CAT, enabled: true }
,null
,{ id: "let", cat: LET_CAT, enabled: true }
,null
,null
,{ id: "void", cat: VOID_CAT, enabled: true }
,{ id: "function", cat: FUNCTION_CAT, enabled: true }
,null
,{ id: "if", cat: IF_CAT, enabled: true }
,null
,{ id: "export", cat: EXPORT_CAT, enabled: true }
,null
,null
,null
,null
,null
,{ id: "in", cat: IN_CAT, enabled: true }
,null
,{ id: "interface", cat: INTERFACE_CAT, enabled: true }
,{ id: "else", cat: ELSE_CAT, enabled: true }
,{ id: "instanceof", cat: INSTANCEOF_CAT, enabled: true }
,null
,null
,null
,null
,null
,{ id: "catch", cat: CATCH_CAT, enabled: true }
,null
,null
,{ id: "var", cat: VAR_CAT, enabled: true }
,{ id: "extends", cat: EXTENDS_CAT, enabled: true }
,{ id: "static", cat: STATIC_CAT, enabled: true }
];
//END-OF-SCANNER-TABLES

//=============================================================================
