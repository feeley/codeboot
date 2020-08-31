//=============================================================================

// File: "float.js"

// Copyright (c) 2020 by Marc Feeley, All Rights Reserved.

//=============================================================================

// This library implements common floating point operations.

//-----------------------------------------------------------------------------

function float_instance(val) {
    // assumes ints are a separate type such as BigInt (see int.js)
    return typeof val === 'number';
}

function float_from_num(n) {
    return n;
}

function float_to_num(float_a) {
    return float_a;
}

function float_is_finite(float_a) {
    return isFinite(float_a);
}

function float_is_infinite(float_a) {
    return float_a === Infinity || float_a === -Infinity;
}

function float_is_nan(float_a) {
    return isNaN(float_a);
}

function float_is_zero(float_a) {
    return float_a === 0.0;
}

function float_is_pos(float_a) {
    return float_a > 0.0;
}

function float_is_neg(float_a) {
    return float_a < 0.0;
}

function float_is_nonneg(float_a) {
    return float_a >= 0.0;
}

function float_eq(float_a, float_b) {
    return float_a === float_b;
}

function float_ne(float_a, float_b) {
    return float_a !== float_b;
}

function float_lt(float_a, float_b) {
    return float_a < float_b;
}

function float_le(float_a, float_b) {
    return float_a <= float_b;
}

function float_gt(float_a, float_b) {
    return float_a > float_b;
}

function float_ge(float_a, float_b) {
    return float_a >= float_b;
}

function float_abs(float_a) {
    return Math.abs(float_a);
}

function float_neg(float_a) {
    return -float_a;
}

function float_add(float_a, float_b) {
    return float_a+float_b;
}

function float_sub(float_a, float_b) {
    return float_a-float_b;
}

function float_mul(float_a, float_b) {
    return float_a*float_b;
}

function float_div(float_a, float_b) {
    return float_a/float_b;
}

function float_mod(float_a, float_b) {
    return float_a%float_b;
}

function float_round(float_a) {
    return Math.round(float_a);
}

function float_round_to_digits(float_a, ndigits) {
    try {
        return parseFloat(float_a.toFixed(ndigits));
    } catch (e) {
        if (float_is_nonneg(ndigits) && (e instanceof RangeError)) {
            if (float_is_nonneg(float_a)) {
                return float_from_float(0.0);
            } else {
                return float_from_float(-0.0);
            }
        } else {
            throw e;
        }
    }
}

function float_mod_floor(float_a, float_b){
    return float_a - float_floor(float_a / float_b) * float_b
}

function float_trunc(float_a) {
    return Math.trunc(float_a);
}

function float_floor(float_a) {
    return Math.floor(float_a);
}

function float_ceil(float_a) {
    return Math.ceil(float_a);
}

function float_exp(float_a) {
    return Math.exp(float_a);
}

function float_expm1(float_a) {
    return Math.expm1(float_a);
}

function float_log(float_a) {
    return Math.log(float_a);
}

function float_log1p(float_a) {
    return Math.log1p(float_a);
}

function float_pow(float_a, float_b) {
    return Math.pow(float_a, float_b);
}

function float_sqrt(float_a) {
    return Math.sqrt(float_a);
}

function float_sin(float_a) {
    return Math.sin(float_a);
}

function float_cos(float_a) {
    return Math.cos(float_a);
}

function float_tan(float_a) {
    return Math.tan(float_a);
}

function float_asin(float_a) {
    return Math.asin(float_a);
}

function float_acos(float_a) {
    return Math.acos(float_a);
}

function float_atan(float_a) {
    return Math.atan(float_a);
}

function float_atan2(float_a, float_b) {
    return Math.atan2(float_a, float_b);
}

function float_pi() {
    return Math.PI;
}

function float_e() {
    return Math.E;
}

function float_inf() {
    return Infinity;
}

function float_nan() {
    return NaN;
}

function float_to_string(float_a) {
    if (isNaN(float_a)) {
        return 'nan';
    } else if (!isFinite(float_a)) {
        return (float_a < 0) ? '-inf' : 'inf';
    } else if (float_a === 0) {
        return (1/float_a < 0) ? '-0.0' : '0.0';
    } else {
        var str_a = float_a + '';
        if (str_a.includes('.') || str_a.includes('e'))
            return str_a;
        else
            return str_a + ".0";
    }
}

function float_from_string(str) {
    return parseFloat(str);
}

//-----------------------------------------------------------------------------
