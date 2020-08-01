"use strict";
var pyinterp = (function() {
    String.prototype.lstrip = function() {
        return this.replace(/^\s+/g, '');
    };

    function isEmpty(obj) {
        if (obj === absent) {
            return true;
        } else {
            return false;
        }
    };

    function make_dict() {
        return {};
    };

    function dict_get(d, key, _default) {
        if (Object.prototype.hasOwnProperty.call(d, key)) {
            return d[key];
        } else {
            return _default;
        }
    };

    function dict_set(d, key, value) {
        d[key] = value;
    };

    function gui_wait_for_click(ast, msg, continue_execution) {
        return { ast: ast, msg: msg, cont: continue_execution };
        //*************** was:
        //console.log('at ' + ast.lineno + '.' + (ast.col_offset + 1) + '-' + ast.end_lineno + '.' + (ast.end_col_offset + 1) + msg)
        //return continue_execution
    };
    const absent = {};
    var AST = (function() {
        function AST() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };

        function mod() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        mod.prototype = Object.create(AST.prototype);
        mod.prototype.constructor = mod;

        function Module(body, type_ignores) {
            this.body = body;
            this.type_ignores = type_ignores;
            this._fields = ["body", "type_ignores"];
            this._attributes = [];
        };
        Module.prototype = Object.create(mod.prototype);
        Module.prototype.constructor = Module;

        function type_ignore() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        type_ignore.prototype = Object.create(AST.prototype);
        type_ignore.prototype.constructor = type_ignore;

        function TypeIgnore(lineno, tag) {
            this.lineno = lineno;
            this.tag = tag;
            this._fields = ["lineno", "tag"];
            this._attributes = [];
        };
        TypeIgnore.prototype = Object.create(type_ignore.prototype);
        TypeIgnore.prototype.constructor = TypeIgnore;

        function Interactive(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Interactive.prototype = Object.create(mod.prototype);
        Interactive.prototype.constructor = Interactive;

        function Expression(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Expression.prototype = Object.create(mod.prototype);
        Expression.prototype.constructor = Expression;

        function FunctionType(argtypes, returns) {
            this.argtypes = argtypes;
            this.returns = returns;
            this._fields = ["argtypes", "returns"];
            this._attributes = [];
        };
        FunctionType.prototype = Object.create(mod.prototype);
        FunctionType.prototype.constructor = FunctionType;

        function Suite(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Suite.prototype = Object.create(mod.prototype);
        Suite.prototype.constructor = Suite;

        function stmt() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        stmt.prototype = Object.create(AST.prototype);
        stmt.prototype.constructor = stmt;

        function FunctionDef(name, args, body, decorator_list, returns, type_comment) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.returns = returns;
            this.type_comment = type_comment;
            this._fields = ["name", "args", "body", "decorator_list", "returns", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        FunctionDef.prototype = Object.create(stmt.prototype);
        FunctionDef.prototype.constructor = FunctionDef;

        function aarguments(args, posonlyargs, vararg, kwonlyargs, kw_defaults, kwarg, defaults) {
            this.args = args;
            this.posonlyargs = posonlyargs;
            this.vararg = vararg;
            this.kwonlyargs = kwonlyargs;
            this.kw_defaults = kw_defaults;
            this.kwarg = kwarg;
            this.defaults = defaults;
            this._fields = ["posonlyargs", "args", "vararg", "kwonlyargs", "kw_defaults", "kwarg", "defaults"];
            this._attributes = [];
        };
        aarguments.prototype = Object.create(AST.prototype);
        aarguments.prototype.constructor = aarguments;

        function arg(arg, annotation, type_comment) {
            this.arg = arg;
            this.annotation = annotation;
            this.type_comment = type_comment;
            this._fields = ["arg", "annotation", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        arg.prototype = Object.create(AST.prototype);
        arg.prototype.constructor = arg;

        function AsyncFunctionDef(name, args, body, decorator_list, returns, type_comment) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.returns = returns;
            this.type_comment = type_comment;
            this._fields = ["name", "args", "body", "decorator_list", "returns", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncFunctionDef.prototype = Object.create(stmt.prototype);
        AsyncFunctionDef.prototype.constructor = AsyncFunctionDef;

        function ClassDef(name, bases, keywords, body, decorator_list) {
            this.name = name;
            this.bases = bases;
            this.keywords = keywords;
            this.body = body;
            this.decorator_list = decorator_list;
            this._fields = ["name", "bases", "keywords", "body", "decorator_list"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ClassDef.prototype = Object.create(stmt.prototype);
        ClassDef.prototype.constructor = ClassDef;

        function Return(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Return.prototype = Object.create(stmt.prototype);
        Return.prototype.constructor = Return;

        function Delete(targets) {
            this.targets = targets;
            this._fields = ["targets"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Delete.prototype = Object.create(stmt.prototype);
        Delete.prototype.constructor = Delete;

        function Assign(targets, value, type_comment) {
            this.targets = targets;
            this.value = value;
            this.type_comment = type_comment;
            this._fields = ["targets", "value", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Assign.prototype = Object.create(stmt.prototype);
        Assign.prototype.constructor = Assign;

        function AugAssign(target, op, value) {
            this.target = target;
            this.op = op;
            this.value = value;
            this._fields = ["target", "op", "value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AugAssign.prototype = Object.create(stmt.prototype);
        AugAssign.prototype.constructor = AugAssign;

        function AnnAssign(target, annotation, value, simple) {
            this.target = target;
            this.annotation = annotation;
            this.value = value;
            this.simple = simple;
            this._fields = ["target", "annotation", "value", "simple"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AnnAssign.prototype = Object.create(stmt.prototype);
        AnnAssign.prototype.constructor = AnnAssign;

        function For(target, iter, body, orelse, type_comment) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.type_comment = type_comment;
            this._fields = ["target", "iter", "body", "orelse", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        For.prototype = Object.create(stmt.prototype);
        For.prototype.constructor = For;

        function AsyncFor(target, iter, body, orelse, type_comment) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.type_comment = type_comment;
            this._fields = ["target", "iter", "body", "orelse", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncFor.prototype = Object.create(stmt.prototype);
        AsyncFor.prototype.constructor = AsyncFor;

        function While(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        While.prototype = Object.create(stmt.prototype);
        While.prototype.constructor = While;

        function If(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        If.prototype = Object.create(stmt.prototype);
        If.prototype.constructor = If;

        function With(items, body, type_comment) {
            this.items = items;
            this.body = body;
            this.type_comment = type_comment;
            this._fields = ["items", "body", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        With.prototype = Object.create(stmt.prototype);
        With.prototype.constructor = With;

        function AsyncWith(items, body, type_comment) {
            this.items = items;
            this.body = body;
            this.type_comment = type_comment;
            this._fields = ["items", "body", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncWith.prototype = Object.create(stmt.prototype);
        AsyncWith.prototype.constructor = AsyncWith;

        function withitem(context_expr, optional_vars) {
            this.context_expr = context_expr;
            this.optional_vars = optional_vars;
            this._fields = ["context_expr", "optional_vars"];
            this._attributes = [];
        };
        withitem.prototype = Object.create(AST.prototype);
        withitem.prototype.constructor = withitem;

        function Raise(exc, cause) {
            this.exc = exc;
            this.cause = cause;
            this._fields = ["exc", "cause"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Raise.prototype = Object.create(stmt.prototype);
        Raise.prototype.constructor = Raise;

        function Try(body, handlers, orelse, finalbody) {
            this.body = body;
            this.handlers = handlers;
            this.orelse = orelse;
            this.finalbody = finalbody;
            this._fields = ["body", "handlers", "orelse", "finalbody"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Try.prototype = Object.create(stmt.prototype);
        Try.prototype.constructor = Try;

        function excepthandler() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        excepthandler.prototype = Object.create(AST.prototype);
        excepthandler.prototype.constructor = excepthandler;

        function ExceptHandler(type, name, body) {
            this.type = type;
            this.name = name;
            this.body = body;
            this._fields = ["type", "name", "body"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ExceptHandler.prototype = Object.create(excepthandler.prototype);
        ExceptHandler.prototype.constructor = ExceptHandler;

        function Assert(test, msg) {
            this.test = test;
            this.msg = msg;
            this._fields = ["test", "msg"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Assert.prototype = Object.create(stmt.prototype);
        Assert.prototype.constructor = Assert;

        function Import(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Import.prototype = Object.create(stmt.prototype);
        Import.prototype.constructor = Import;

        function ImportFrom(module, names, level) {
            this.module = module;
            this.names = names;
            this.level = level;
            this._fields = ["module", "names", "level"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ImportFrom.prototype = Object.create(stmt.prototype);
        ImportFrom.prototype.constructor = ImportFrom;

        function alias(name, asname) {
            this.name = name;
            this.asname = asname;
            this._fields = ["name", "asname"];
            this._attributes = [];
        };
        alias.prototype = Object.create(AST.prototype);
        alias.prototype.constructor = alias;

        function Global(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Global.prototype = Object.create(stmt.prototype);
        Global.prototype.constructor = Global;

        function Nonlocal(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Nonlocal.prototype = Object.create(stmt.prototype);
        Nonlocal.prototype.constructor = Nonlocal;

        function Expr(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Expr.prototype = Object.create(stmt.prototype);
        Expr.prototype.constructor = Expr;

        function Pass() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Pass.prototype = Object.create(stmt.prototype);
        Pass.prototype.constructor = Pass;

        function Break() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Break.prototype = Object.create(stmt.prototype);
        Break.prototype.constructor = Break;

        function Continue() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Continue.prototype = Object.create(stmt.prototype);
        Continue.prototype.constructor = Continue;

        function expr() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        expr.prototype = Object.create(AST.prototype);
        expr.prototype.constructor = expr;

        function expr_context() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        expr_context.prototype = Object.create(AST.prototype);
        expr_context.prototype.constructor = expr_context;

        function Load() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Load.prototype = Object.create(expr_context.prototype);
        Load.prototype.constructor = Load;

        function Store() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Store.prototype = Object.create(expr_context.prototype);
        Store.prototype.constructor = Store;

        function Del() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Del.prototype = Object.create(expr_context.prototype);
        Del.prototype.constructor = Del;

        function AugLoad() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        AugLoad.prototype = Object.create(expr_context.prototype);
        AugLoad.prototype.constructor = AugLoad;

        function AugStore() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        AugStore.prototype = Object.create(expr_context.prototype);
        AugStore.prototype.constructor = AugStore;

        function Param() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Param.prototype = Object.create(expr_context.prototype);
        Param.prototype.constructor = Param;

        function BoolOp(op, values) {
            this.op = op;
            this.values = values;
            this._fields = ["op", "values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        BoolOp.prototype = Object.create(expr.prototype);
        BoolOp.prototype.constructor = BoolOp;

        function boolop() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        boolop.prototype = Object.create(AST.prototype);
        boolop.prototype.constructor = boolop;

        function And() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        And.prototype = Object.create(boolop.prototype);
        And.prototype.constructor = And;

        function Or() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Or.prototype = Object.create(boolop.prototype);
        Or.prototype.constructor = Or;

        function NamedExpr(target, value) {
            this.target = target;
            this.value = value;
            this._fields = ["target", "value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        NamedExpr.prototype = Object.create(expr.prototype);
        NamedExpr.prototype.constructor = NamedExpr;

        function BinOp(left, op, right) {
            this.left = left;
            this.op = op;
            this.right = right;
            this._fields = ["left", "op", "right"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        BinOp.prototype = Object.create(expr.prototype);
        BinOp.prototype.constructor = BinOp;

        function operator() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        operator.prototype = Object.create(AST.prototype);
        operator.prototype.constructor = operator;

        function Add() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Add.prototype = Object.create(operator.prototype);
        Add.prototype.constructor = Add;

        function Sub() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Sub.prototype = Object.create(operator.prototype);
        Sub.prototype.constructor = Sub;

        function Mult() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Mult.prototype = Object.create(operator.prototype);
        Mult.prototype.constructor = Mult;

        function Div() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Div.prototype = Object.create(operator.prototype);
        Div.prototype.constructor = Div;

        function FloorDiv() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        FloorDiv.prototype = Object.create(operator.prototype);
        FloorDiv.prototype.constructor = FloorDiv;

        function Mod() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Mod.prototype = Object.create(operator.prototype);
        Mod.prototype.constructor = Mod;

        function Pow() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Pow.prototype = Object.create(operator.prototype);
        Pow.prototype.constructor = Pow;

        function LShift() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        LShift.prototype = Object.create(operator.prototype);
        LShift.prototype.constructor = LShift;

        function RShift() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        RShift.prototype = Object.create(operator.prototype);
        RShift.prototype.constructor = RShift;

        function BitOr() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitOr.prototype = Object.create(operator.prototype);
        BitOr.prototype.constructor = BitOr;

        function BitXor() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitXor.prototype = Object.create(operator.prototype);
        BitXor.prototype.constructor = BitXor;

        function BitAnd() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitAnd.prototype = Object.create(operator.prototype);
        BitAnd.prototype.constructor = BitAnd;

        function MatMult() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        MatMult.prototype = Object.create(operator.prototype);
        MatMult.prototype.constructor = MatMult;

        function UnaryOp(op, operand) {
            this.op = op;
            this.operand = operand;
            this._fields = ["op", "operand"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        UnaryOp.prototype = Object.create(expr.prototype);
        UnaryOp.prototype.constructor = UnaryOp;

        function unaryop() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        unaryop.prototype = Object.create(AST.prototype);
        unaryop.prototype.constructor = unaryop;

        function UAdd() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        UAdd.prototype = Object.create(unaryop.prototype);
        UAdd.prototype.constructor = UAdd;

        function USub() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        USub.prototype = Object.create(unaryop.prototype);
        USub.prototype.constructor = USub;

        function Not() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Not.prototype = Object.create(unaryop.prototype);
        Not.prototype.constructor = Not;

        function Invert() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Invert.prototype = Object.create(unaryop.prototype);
        Invert.prototype.constructor = Invert;

        function Lambda(args, body) {
            this.args = args;
            this.body = body;
            this._fields = ["args", "body"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Lambda.prototype = Object.create(expr.prototype);
        Lambda.prototype.constructor = Lambda;

        function IfExp(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        IfExp.prototype = Object.create(expr.prototype);
        IfExp.prototype.constructor = IfExp;

        function Dict(keys, values) {
            this.keys = keys;
            this.values = values;
            this._fields = ["keys", "values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Dict.prototype = Object.create(expr.prototype);
        Dict.prototype.constructor = Dict;

        function Set(elts) {
            this.elts = elts;
            this._fields = ["elts"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Set.prototype = Object.create(expr.prototype);
        Set.prototype.constructor = Set;

        function ListComp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ListComp.prototype = Object.create(expr.prototype);
        ListComp.prototype.constructor = ListComp;

        function SetComp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        SetComp.prototype = Object.create(expr.prototype);
        SetComp.prototype.constructor = SetComp;

        function DictComp(key, value, generators) {
            this.key = key;
            this.value = value;
            this.generators = generators;
            this._fields = ["key", "value", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        DictComp.prototype = Object.create(expr.prototype);
        DictComp.prototype.constructor = DictComp;

        function comprehension(target, iter, ifs, is_async) {
            this.target = target;
            this.iter = iter;
            this.ifs = ifs;
            this.is_async = is_async;
            this._fields = ["target", "iter", "ifs", "is_async"];
            this._attributes = [];
        };
        comprehension.prototype = Object.create(AST.prototype);
        comprehension.prototype.constructor = comprehension;

        function GeneratorExp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        GeneratorExp.prototype = Object.create(expr.prototype);
        GeneratorExp.prototype.constructor = GeneratorExp;

        function Await(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Await.prototype = Object.create(expr.prototype);
        Await.prototype.constructor = Await;

        function Yield(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Yield.prototype = Object.create(expr.prototype);
        Yield.prototype.constructor = Yield;

        function YieldFrom(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        YieldFrom.prototype = Object.create(expr.prototype);
        YieldFrom.prototype.constructor = YieldFrom;

        function Compare(left, ops, comparators) {
            this.left = left;
            this.ops = ops;
            this.comparators = comparators;
            this._fields = ["left", "ops", "comparators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Compare.prototype = Object.create(expr.prototype);
        Compare.prototype.constructor = Compare;

        function cmpop() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        cmpop.prototype = Object.create(AST.prototype);
        cmpop.prototype.constructor = cmpop;

        function Eq() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Eq.prototype = Object.create(cmpop.prototype);
        Eq.prototype.constructor = Eq;

        function NotEq() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        NotEq.prototype = Object.create(cmpop.prototype);
        NotEq.prototype.constructor = NotEq;

        function Lt() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Lt.prototype = Object.create(cmpop.prototype);
        Lt.prototype.constructor = Lt;

        function LtE() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        LtE.prototype = Object.create(cmpop.prototype);
        LtE.prototype.constructor = LtE;

        function Gt() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Gt.prototype = Object.create(cmpop.prototype);
        Gt.prototype.constructor = Gt;

        function GtE() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        GtE.prototype = Object.create(cmpop.prototype);
        GtE.prototype.constructor = GtE;

        function Is() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Is.prototype = Object.create(cmpop.prototype);
        Is.prototype.constructor = Is;

        function IsNot() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        IsNot.prototype = Object.create(cmpop.prototype);
        IsNot.prototype.constructor = IsNot;

        function In() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        In.prototype = Object.create(cmpop.prototype);
        In.prototype.constructor = In;

        function NotIn() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        NotIn.prototype = Object.create(cmpop.prototype);
        NotIn.prototype.constructor = NotIn;

        function Call(func, args, keywords) {
            this.func = func;
            this.args = args;
            this.keywords = keywords;
            this._fields = ["func", "args", "keywords"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Call.prototype = Object.create(expr.prototype);
        Call.prototype.constructor = Call;

        function keyword(arg, value) {
            this.arg = arg;
            this.value = value;
            this._fields = ["arg", "value"];
            this._attributes = [];
        };
        keyword.prototype = Object.create(AST.prototype);
        keyword.prototype.constructor = keyword;

        function FormattedValue(value, conversion, format_spec) {
            this.value = value;
            this.conversion = conversion;
            this.format_spec = format_spec;
            this._fields = ["value", "conversion", "format_spec"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        FormattedValue.prototype = Object.create(expr.prototype);
        FormattedValue.prototype.constructor = FormattedValue;

        function JoinedStr(values) {
            this.values = values;
            this._fields = ["values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        JoinedStr.prototype = Object.create(expr.prototype);
        JoinedStr.prototype.constructor = JoinedStr;

        function Constant(value, kind) {
            this.value = value;
            this.kind = kind;
            this._fields = ["value", "kind"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Constant.prototype = Object.create(expr.prototype);
        Constant.prototype.constructor = Constant;

        function Attribute(value, attr, ctx) {
            this.value = value;
            this.attr = attr;
            this.ctx = ctx;
            this._fields = ["value", "attr", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Attribute.prototype = Object.create(expr.prototype);
        Attribute.prototype.constructor = Attribute;

        function Subscript(value, slice, ctx) {
            this.value = value;
            this.slice = slice;
            this.ctx = ctx;
            this._fields = ["value", "slice", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Subscript.prototype = Object.create(expr.prototype);
        Subscript.prototype.constructor = Subscript;

        function slice() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        slice.prototype = Object.create(AST.prototype);
        slice.prototype.constructor = slice;

        function Slice(lower, upper, step) {
            this.lower = lower;
            this.upper = upper;
            this.step = step;
            this._fields = ["lower", "upper", "step"];
            this._attributes = [];
        };
        Slice.prototype = Object.create(slice.prototype);
        Slice.prototype.constructor = Slice;

        function ExtSlice(dims) {
            this.dims = dims;
            this._fields = ["dims"];
            this._attributes = [];
        };
        ExtSlice.prototype = Object.create(slice.prototype);
        ExtSlice.prototype.constructor = ExtSlice;

        function Index(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = [];
        };
        Index.prototype = Object.create(slice.prototype);
        Index.prototype.constructor = Index;

        function Starred(value, ctx) {
            this.value = value;
            this.ctx = ctx;
            this._fields = ["value", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Starred.prototype = Object.create(expr.prototype);
        Starred.prototype.constructor = Starred;

        function Name(id, ctx) {
            this.id = id;
            this.ctx = ctx;
            this._fields = ["id", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Name.prototype = Object.create(expr.prototype);
        Name.prototype.constructor = Name;

        function List(elts, ctx) {
            this.elts = elts;
            this.ctx = ctx;
            this._fields = ["elts", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        List.prototype = Object.create(expr.prototype);
        List.prototype.constructor = List;

        function Tuple(elts, ctx) {
            this.elts = elts;
            this.ctx = ctx;
            this._fields = ["elts", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Tuple.prototype = Object.create(expr.prototype);
        Tuple.prototype.constructor = Tuple;
        var PyCF_ONLY_AST = 1024;
        var PyCF_TYPE_COMMENTS = 4096;
        var PyCF_ALLOW_TOP_LEVEL_AWAIT = 8192;
        return {
            AST: AST,
            mod: mod,
            Module: Module,
            type_ignore: type_ignore,
            TypeIgnore: TypeIgnore,
            Interactive: Interactive,
            Expression: Expression,
            FunctionType: FunctionType,
            Suite: Suite,
            stmt: stmt,
            FunctionDef: FunctionDef,
            arguments: arguments,
            arg: arg,
            AsyncFunctionDef: AsyncFunctionDef,
            ClassDef: ClassDef,
            Return: Return,
            Delete: Delete,
            Assign: Assign,
            AugAssign: AugAssign,
            AnnAssign: AnnAssign,
            For: For,
            AsyncFor: AsyncFor,
            While: While,
            If: If,
            With: With,
            AsyncWith: AsyncWith,
            withitem: withitem,
            Raise: Raise,
            Try: Try,
            excepthandler: excepthandler,
            ExceptHandler: ExceptHandler,
            Assert: Assert,
            Import: Import,
            ImportFrom: ImportFrom,
            alias: alias,
            Global: Global,
            Nonlocal: Nonlocal,
            Expr: Expr,
            Pass: Pass,
            Break: Break,
            Continue: Continue,
            expr: expr,
            expr_context: expr_context,
            Load: Load,
            Store: Store,
            Del: Del,
            AugLoad: AugLoad,
            AugStore: AugStore,
            Param: Param,
            BoolOp: BoolOp,
            boolop: boolop,
            And: And,
            Or: Or,
            NamedExpr: NamedExpr,
            BinOp: BinOp,
            operator: operator,
            Add: Add,
            Sub: Sub,
            Mult: Mult,
            Div: Div,
            FloorDiv: FloorDiv,
            Mod: Mod,
            Pow: Pow,
            LShift: LShift,
            RShift: RShift,
            BitOr: BitOr,
            BitXor: BitXor,
            BitAnd: BitAnd,
            MatMult: MatMult,
            UnaryOp: UnaryOp,
            unaryop: unaryop,
            UAdd: UAdd,
            USub: USub,
            Not: Not,
            Invert: Invert,
            Lambda: Lambda,
            IfExp: IfExp,
            Dict: Dict,
            Set: Set,
            ListComp: ListComp,
            SetComp: SetComp,
            DictComp: DictComp,
            comprehension: comprehension,
            GeneratorExp: GeneratorExp,
            Await: Await,
            Yield: Yield,
            YieldFrom: YieldFrom,
            Compare: Compare,
            cmpop: cmpop,
            Eq: Eq,
            NotEq: NotEq,
            Lt: Lt,
            LtE: LtE,
            Gt: Gt,
            GtE: GtE,
            Is: Is,
            IsNot: IsNot,
            In: In,
            NotIn: NotIn,
            Call: Call,
            keyword: keyword,
            FormattedValue: FormattedValue,
            JoinedStr: JoinedStr,
            Constant: Constant,
            Attribute: Attribute,
            Subscript: Subscript,
            slice: slice,
            Slice: Slice,
            ExtSlice: ExtSlice,
            Index: Index,
            Starred: Starred,
            Name: Name,
            List: List,
            Tuple: Tuple,
            PyCF_ONLY_AST: PyCF_ONLY_AST,
            PyCF_TYPE_COMMENTS: PyCF_TYPE_COMMENTS,
            PyCF_ALLOW_TOP_LEVEL_AWAIT: PyCF_ALLOW_TOP_LEVEL_AWAIT
        }
    })();
    var zast = (function() {
        "\n    zast\n    ~~~~\n\n    Zipi's abstract syntax tree module.\n";
        var ENDMARKER = 0;
        var NAME = 1;
        var NUMBER = 2;
        var STRING = 3;
        var NEWLINE = 4;
        var INDENT = 5;
        var DEDENT = 6;
        var LPAR = 7;
        var RPAR = 8;
        var LSQB = 9;
        var RSQB = 10;
        var COLON = 11;
        var COMMA = 12;
        var SEMI = 13;
        var PLUS = 14;
        var MINUS = 15;
        var STAR = 16;
        var SLASH = 17;
        var VBAR = 18;
        var AMPER = 19;
        var LESS = 20;
        var GREATER = 21;
        var EQUAL = 22;
        var DOT = 23;
        var PERCENT = 24;
        var BACKQUOTE = 25;
        var LBRACE = 26;
        var RBRACE = 27;
        var EQEQUAL = 28;
        var NOTEQUAL = 29;
        var LESSEQUAL = 30;
        var GREATEREQUAL = 31;
        var TILDE = 32;
        var CIRCUMFLEX = 33;
        var LEFTSHIFT = 34;
        var RIGHTSHIFT = 35;
        var DOUBLESTAR = 36;
        var PLUSEQUAL = 37;
        var MINEQUAL = 38;
        var STAREQUAL = 39;
        var SLASHEQUAL = 40;
        var PERCENTEQUAL = 41;
        var AMPEREQUAL = 42;
        var VBAREQUAL = 43;
        var CIRCUMFLEXEQUAL = 44;
        var LEFTSHIFTEQUAL = 45;
        var RIGHTSHIFTEQUAL = 46;
        var DOUBLESTAREQUAL = 47;
        var DOUBLESLASH = 48;
        var DOUBLESLASHEQUAL = 49;
        var AT = 50;
        var OP = 51;
        var ERRORTOKEN = 52;
        var N_TOKENS = 53;
        var NT_OFFSET = 256;
        var ELLIPSIS = 54;
        var TYPE_COMMENT = 55;
        var ATEQUAL = 91;
        var COLONEQUAL = 92;
        var FALSE = 56;
        var NONE = 57;
        var TRUE = 58;
        var AND = 59;
        var AS = 60;
        var ASSERT = 61;
        var BREAK = 62;
        var CLASS = 63;
        var CONTINUE = 64;
        var DEF = 65;
        var DEL = 66;
        var ELIF = 67;
        var ELSE = 68;
        var EXCEPT = 69;
        var FINALLY = 70;
        var FOR = 71;
        var FROM = 72;
        var GLOBAL = 73;
        var IF = 74;
        var IMPORT = 75;
        var IN = 76;
        var IS = 77;
        var LAMBDA = 78;
        var NONLOCAL = 79;
        var NOT = 80;
        var OR = 81;
        var PASS = 82;
        var RAISE = 83;
        var RETURN = 84;
        var TRY = 85;
        var WHILE = 86;
        var WITH = 87;
        var YIELD = 88;
        var ASYNC = 89;
        var AWAIT = 90;
        var tok_name = {};
        tok_name[ENDMARKER] = "ENDMARKER";
        tok_name[NAME] = "NAME";
        tok_name[NUMBER] = "NUMBER";
        tok_name[STRING] = "STRING";
        tok_name[NEWLINE] = "NEWLINE";
        tok_name[INDENT] = "INDENT";
        tok_name[DEDENT] = "DEDENT";
        tok_name[LPAR] = "LPAR";
        tok_name[RPAR] = "RPAR";
        tok_name[LSQB] = "LSQB";
        tok_name[RSQB] = "RSQB";
        tok_name[COLON] = "COLON";
        tok_name[COMMA] = "COMMA";
        tok_name[SEMI] = "SEMI";
        tok_name[PLUS] = "PLUS";
        tok_name[MINUS] = "MINUS";
        tok_name[STAR] = "STAR";
        tok_name[SLASH] = "SLASH";
        tok_name[VBAR] = "VBAR";
        tok_name[AMPER] = "AMPER";
        tok_name[LESS] = "LESS";
        tok_name[GREATER] = "GREATER";
        tok_name[EQUAL] = "EQUAL";
        tok_name[DOT] = "DOT";
        tok_name[PERCENT] = "PERCENT";
        tok_name[BACKQUOTE] = "BACKQUOTE";
        tok_name[LBRACE] = "LBRACE";
        tok_name[RBRACE] = "RBRACE";
        tok_name[EQEQUAL] = "EQEQUAL";
        tok_name[NOTEQUAL] = "NOTEQUAL";
        tok_name[LESSEQUAL] = "LESSEQUAL";
        tok_name[GREATEREQUAL] = "GREATEREQUAL";
        tok_name[TILDE] = "TILDE";
        tok_name[CIRCUMFLEX] = "CIRCUMFLEX";
        tok_name[LEFTSHIFT] = "LEFTSHIFT";
        tok_name[RIGHTSHIFT] = "RIGHTSHIFT";
        tok_name[DOUBLESTAR] = "DOUBLESTAR";
        tok_name[PLUSEQUAL] = "PLUSEQUAL";
        tok_name[MINEQUAL] = "MINEQUAL";
        tok_name[STAREQUAL] = "STAREQUAL";
        tok_name[SLASHEQUAL] = "SLASHEQUAL";
        tok_name[PERCENTEQUAL] = "PERCENTEQUAL";
        tok_name[AMPEREQUAL] = "AMPEREQUAL";
        tok_name[VBAREQUAL] = "VBAREQUAL";
        tok_name[CIRCUMFLEXEQUAL] = "CIRCUMFLEXEQUAL";
        tok_name[LEFTSHIFTEQUAL] = "LEFTSHIFTEQUAL";
        tok_name[RIGHTSHIFTEQUAL] = "RIGHTSHIFTEQUAL";
        tok_name[DOUBLESTAREQUAL] = "DOUBLESTAREQUAL";
        tok_name[DOUBLESLASH] = "DOUBLESLASH";
        tok_name[DOUBLESLASHEQUAL] = "DOUBLESLASHEQUAL";
        tok_name[AT] = "AT";
        tok_name[OP] = "OP";
        tok_name[N_TOKENS] = "???";
        tok_name[ERRORTOKEN] = "ERRORTOKEN";
        tok_name[ELLIPSIS] = "ELLIPSIS";
        tok_name[TYPE_COMMENT] = "TYPE_COMMENT";
        tok_name[ATEQUAL] = "ATEQUAL";
        tok_name[COLONEQUAL] = "COLONEQUAL";
        tok_name[FALSE] = "FALSE";
        tok_name[NONE] = "NONE";
        tok_name[TRUE] = "TRUE";
        tok_name[AND] = "AND";
        tok_name[AS] = "AS";
        tok_name[ASSERT] = "ASSERT";
        tok_name[BREAK] = "BREAK";
        tok_name[CLASS] = "CLASS";
        tok_name[CONTINUE] = "CONTINUE";
        tok_name[DEF] = "DEF";
        tok_name[DEL] = "DEL";
        tok_name[ELIF] = "ELIF";
        tok_name[ELSE] = "ELSE";
        tok_name[EXCEPT] = "EXCEPT";
        tok_name[FINALLY] = "FINALLY";
        tok_name[FOR] = "FOR";
        tok_name[FROM] = "FROM";
        tok_name[GLOBAL] = "GLOBAL";
        tok_name[IF] = "IF";
        tok_name[IMPORT] = "IMPORT";
        tok_name[IN] = "IN";
        tok_name[IS] = "IS";
        tok_name[LAMBDA] = "LAMBDA";
        tok_name[NONLOCAL] = "NONLOCAL";
        tok_name[NOT] = "NOT";
        tok_name[OR] = "OR";
        tok_name[PASS] = "PASS";
        tok_name[RAISE] = "RAISE";
        tok_name[RETURN] = "RETURN";
        tok_name[TRY] = "TRY";
        tok_name[WHILE] = "WHILE";
        tok_name[WITH] = "WITH";
        tok_name[YIELD] = "YIELD";
        tok_name[ASYNC] = "ASYNC";
        tok_name[AWAIT] = "AWAIT";
        var kw = {};
        kw["False"] = FALSE;
        kw["None"] = NONE;
        kw["True"] = TRUE;
        kw["and"] = AND;
        kw["as"] = AS;
        kw["assert"] = ASSERT;
        kw["break"] = BREAK;
        kw["class"] = CLASS;
        kw["continue"] = CONTINUE;
        kw["def"] = DEF;
        kw["del"] = DEL;
        kw["elif"] = ELIF;
        kw["else"] = ELSE;
        kw["except"] = EXCEPT;
        kw["finally"] = FINALLY;
        kw["for"] = FOR;
        kw["from"] = FROM;
        kw["global"] = GLOBAL;
        kw["if"] = IF;
        kw["import"] = IMPORT;
        kw["in"] = IN;
        kw["is"] = IS;
        kw["lambda"] = LAMBDA;
        kw["nonlocal"] = NONLOCAL;
        kw["not"] = NOT;
        kw["or"] = OR;
        kw["pass"] = PASS;
        kw["raise"] = RAISE;
        kw["return"] = RETURN;
        kw["try"] = TRY;
        kw["while"] = WHILE;
        kw["with"] = WITH;
        kw["yield"] = YIELD;
        kw["async"] = ASYNC;
        kw["await"] = AWAIT;
        var tok_source = {};
        tok_source[ENDMARKER] = "";
        tok_source[NAME] = "x";
        tok_source[NUMBER] = "0";
        tok_source[STRING] = "\"a\"";
        tok_source[NEWLINE] = "\n";
        tok_source[INDENT] = "INDENT";
        tok_source[DEDENT] = "DEDENT";
        tok_source[LPAR] = "(";
        tok_source[RPAR] = ")";
        tok_source[LSQB] = "[";
        tok_source[RSQB] = "]";
        tok_source[COLON] = ":";
        tok_source[COMMA] = ",";
        tok_source[SEMI] = ";";
        tok_source[PLUS] = "+";
        tok_source[MINUS] = "-";
        tok_source[STAR] = "*";
        tok_source[SLASH] = "/";
        tok_source[VBAR] = "|";
        tok_source[AMPER] = "&";
        tok_source[LESS] = "<";
        tok_source[GREATER] = ">";
        tok_source[EQUAL] = "=";
        tok_source[DOT] = ".";
        tok_source[PERCENT] = "%";
        tok_source[BACKQUOTE] = "`";
        tok_source[LBRACE] = "{";
        tok_source[RBRACE] = "}";
        tok_source[EQEQUAL] = "==";
        tok_source[NOTEQUAL] = "!=";
        tok_source[LESSEQUAL] = "<=";
        tok_source[GREATEREQUAL] = ">=";
        tok_source[TILDE] = "~";
        tok_source[CIRCUMFLEX] = "^";
        tok_source[LEFTSHIFT] = "<<";
        tok_source[RIGHTSHIFT] = ">>";
        tok_source[DOUBLESTAR] = "**";
        tok_source[PLUSEQUAL] = "+=";
        tok_source[MINEQUAL] = "-=";
        tok_source[STAREQUAL] = "*=";
        tok_source[SLASHEQUAL] = "/=";
        tok_source[PERCENTEQUAL] = "%=";
        tok_source[AMPEREQUAL] = "&=";
        tok_source[VBAREQUAL] = "|=";
        tok_source[CIRCUMFLEXEQUAL] = "^=";
        tok_source[LEFTSHIFTEQUAL] = "<<=";
        tok_source[RIGHTSHIFTEQUAL] = ">>=";
        tok_source[DOUBLESTAREQUAL] = "**=";
        tok_source[DOUBLESLASH] = "//";
        tok_source[DOUBLESLASHEQUAL] = "//=";
        tok_source[AT] = "@";
        tok_source[OP] = "OP";
        tok_source[ELLIPSIS] = "...";
        tok_source[TYPE_COMMENT] = "";
        tok_source[ATEQUAL] = "@=";
        tok_source[COLONEQUAL] = ":=";
        tok_source[FALSE] = "False";
        tok_source[NONE] = "None";
        tok_source[TRUE] = "True";
        tok_source[AND] = "and";
        tok_source[AS] = "as";
        tok_source[ASSERT] = "assert";
        tok_source[BREAK] = "break";
        tok_source[CLASS] = "class";
        tok_source[CONTINUE] = "continue";
        tok_source[DEF] = "def";
        tok_source[DEL] = "del";
        tok_source[ELIF] = "elif";
        tok_source[ELSE] = "else";
        tok_source[EXCEPT] = "except";
        tok_source[FINALLY] = "finally";
        tok_source[FOR] = "for";
        tok_source[FROM] = "from";
        tok_source[GLOBAL] = "global";
        tok_source[IF] = "if";
        tok_source[IMPORT] = "import";
        tok_source[IN] = "in";
        tok_source[IS] = "is";
        tok_source[LAMBDA] = "lambda";
        tok_source[NONLOCAL] = "nonlocal";
        tok_source[NOT] = "not";
        tok_source[OR] = "or";
        tok_source[PASS] = "pass";
        tok_source[RAISE] = "raise";
        tok_source[RETURN] = "return";
        tok_source[TRY] = "try";
        tok_source[WHILE] = "while";
        tok_source[WITH] = "with";
        tok_source[YIELD] = "yield";
        tok_source[ASYNC] = "async";
        tok_source[AWAIT] = "await";
        var ENDMARKER = 0;
        var NAME = 1;
        var NUMBER = 2;
        var STRING = 3;
        var NEWLINE = 4;
        var INDENT = 5;
        var DEDENT = 6;
        var LPAR = 7;
        var RPAR = 8;
        var LSQB = 9;
        var RSQB = 10;
        var COLON = 11;
        var COMMA = 12;
        var SEMI = 13;
        var PLUS = 14;
        var MINUS = 15;
        var STAR = 16;
        var SLASH = 17;
        var VBAR = 18;
        var AMPER = 19;
        var LESS = 20;
        var GREATER = 21;
        var EQUAL = 22;
        var DOT = 23;
        var PERCENT = 24;
        var BACKQUOTE = 25;
        var LBRACE = 26;
        var RBRACE = 27;
        var EQEQUAL = 28;
        var NOTEQUAL = 29;
        var LESSEQUAL = 30;
        var GREATEREQUAL = 31;
        var TILDE = 32;
        var CIRCUMFLEX = 33;
        var LEFTSHIFT = 34;
        var RIGHTSHIFT = 35;
        var DOUBLESTAR = 36;
        var PLUSEQUAL = 37;
        var MINEQUAL = 38;
        var STAREQUAL = 39;
        var SLASHEQUAL = 40;
        var PERCENTEQUAL = 41;
        var AMPEREQUAL = 42;
        var VBAREQUAL = 43;
        var CIRCUMFLEXEQUAL = 44;
        var LEFTSHIFTEQUAL = 45;
        var RIGHTSHIFTEQUAL = 46;
        var DOUBLESTAREQUAL = 47;
        var DOUBLESLASH = 48;
        var DOUBLESLASHEQUAL = 49;
        var AT = 50;
        var OP = 51;
        var ERRORTOKEN = 52;
        var N_TOKENS = 53;
        var NT_OFFSET = 256;
        var ELLIPSIS = 54;
        var TYPE_COMMENT = 55;
        var ATEQUAL = 91;
        var COLONEQUAL = 92;
        var FALSE = 56;
        var NONE = 57;
        var TRUE = 58;
        var AND = 59;
        var AS = 60;
        var ASSERT = 61;
        var BREAK = 62;
        var CLASS = 63;
        var CONTINUE = 64;
        var DEF = 65;
        var DEL = 66;
        var ELIF = 67;
        var ELSE = 68;
        var EXCEPT = 69;
        var FINALLY = 70;
        var FOR = 71;
        var FROM = 72;
        var GLOBAL = 73;
        var IF = 74;
        var IMPORT = 75;
        var IN = 76;
        var IS = 77;
        var LAMBDA = 78;
        var NONLOCAL = 79;
        var NOT = 80;
        var OR = 81;
        var PASS = 82;
        var RAISE = 83;
        var RETURN = 84;
        var TRY = 85;
        var WHILE = 86;
        var WITH = 87;
        var YIELD = 88;
        var ASYNC = 89;
        var AWAIT = 90;
        var tok_name = {};
        tok_name[ENDMARKER] = "ENDMARKER";
        tok_name[NAME] = "NAME";
        tok_name[NUMBER] = "NUMBER";
        tok_name[STRING] = "STRING";
        tok_name[NEWLINE] = "NEWLINE";
        tok_name[INDENT] = "INDENT";
        tok_name[DEDENT] = "DEDENT";
        tok_name[LPAR] = "LPAR";
        tok_name[RPAR] = "RPAR";
        tok_name[LSQB] = "LSQB";
        tok_name[RSQB] = "RSQB";
        tok_name[COLON] = "COLON";
        tok_name[COMMA] = "COMMA";
        tok_name[SEMI] = "SEMI";
        tok_name[PLUS] = "PLUS";
        tok_name[MINUS] = "MINUS";
        tok_name[STAR] = "STAR";
        tok_name[SLASH] = "SLASH";
        tok_name[VBAR] = "VBAR";
        tok_name[AMPER] = "AMPER";
        tok_name[LESS] = "LESS";
        tok_name[GREATER] = "GREATER";
        tok_name[EQUAL] = "EQUAL";
        tok_name[DOT] = "DOT";
        tok_name[PERCENT] = "PERCENT";
        tok_name[BACKQUOTE] = "BACKQUOTE";
        tok_name[LBRACE] = "LBRACE";
        tok_name[RBRACE] = "RBRACE";
        tok_name[EQEQUAL] = "EQEQUAL";
        tok_name[NOTEQUAL] = "NOTEQUAL";
        tok_name[LESSEQUAL] = "LESSEQUAL";
        tok_name[GREATEREQUAL] = "GREATEREQUAL";
        tok_name[TILDE] = "TILDE";
        tok_name[CIRCUMFLEX] = "CIRCUMFLEX";
        tok_name[LEFTSHIFT] = "LEFTSHIFT";
        tok_name[RIGHTSHIFT] = "RIGHTSHIFT";
        tok_name[DOUBLESTAR] = "DOUBLESTAR";
        tok_name[PLUSEQUAL] = "PLUSEQUAL";
        tok_name[MINEQUAL] = "MINEQUAL";
        tok_name[STAREQUAL] = "STAREQUAL";
        tok_name[SLASHEQUAL] = "SLASHEQUAL";
        tok_name[PERCENTEQUAL] = "PERCENTEQUAL";
        tok_name[AMPEREQUAL] = "AMPEREQUAL";
        tok_name[VBAREQUAL] = "VBAREQUAL";
        tok_name[CIRCUMFLEXEQUAL] = "CIRCUMFLEXEQUAL";
        tok_name[LEFTSHIFTEQUAL] = "LEFTSHIFTEQUAL";
        tok_name[RIGHTSHIFTEQUAL] = "RIGHTSHIFTEQUAL";
        tok_name[DOUBLESTAREQUAL] = "DOUBLESTAREQUAL";
        tok_name[DOUBLESLASH] = "DOUBLESLASH";
        tok_name[DOUBLESLASHEQUAL] = "DOUBLESLASHEQUAL";
        tok_name[AT] = "AT";
        tok_name[OP] = "OP";
        tok_name[N_TOKENS] = "???";
        tok_name[ERRORTOKEN] = "ERRORTOKEN";
        tok_name[ELLIPSIS] = "ELLIPSIS";
        tok_name[TYPE_COMMENT] = "TYPE_COMMENT";
        tok_name[ATEQUAL] = "ATEQUAL";
        tok_name[COLONEQUAL] = "COLONEQUAL";
        tok_name[FALSE] = "FALSE";
        tok_name[NONE] = "NONE";
        tok_name[TRUE] = "TRUE";
        tok_name[AND] = "AND";
        tok_name[AS] = "AS";
        tok_name[ASSERT] = "ASSERT";
        tok_name[BREAK] = "BREAK";
        tok_name[CLASS] = "CLASS";
        tok_name[CONTINUE] = "CONTINUE";
        tok_name[DEF] = "DEF";
        tok_name[DEL] = "DEL";
        tok_name[ELIF] = "ELIF";
        tok_name[ELSE] = "ELSE";
        tok_name[EXCEPT] = "EXCEPT";
        tok_name[FINALLY] = "FINALLY";
        tok_name[FOR] = "FOR";
        tok_name[FROM] = "FROM";
        tok_name[GLOBAL] = "GLOBAL";
        tok_name[IF] = "IF";
        tok_name[IMPORT] = "IMPORT";
        tok_name[IN] = "IN";
        tok_name[IS] = "IS";
        tok_name[LAMBDA] = "LAMBDA";
        tok_name[NONLOCAL] = "NONLOCAL";
        tok_name[NOT] = "NOT";
        tok_name[OR] = "OR";
        tok_name[PASS] = "PASS";
        tok_name[RAISE] = "RAISE";
        tok_name[RETURN] = "RETURN";
        tok_name[TRY] = "TRY";
        tok_name[WHILE] = "WHILE";
        tok_name[WITH] = "WITH";
        tok_name[YIELD] = "YIELD";
        tok_name[ASYNC] = "ASYNC";
        tok_name[AWAIT] = "AWAIT";
        var kw = {};
        kw["False"] = FALSE;
        kw["None"] = NONE;
        kw["True"] = TRUE;
        kw["and"] = AND;
        kw["as"] = AS;
        kw["assert"] = ASSERT;
        kw["break"] = BREAK;
        kw["class"] = CLASS;
        kw["continue"] = CONTINUE;
        kw["def"] = DEF;
        kw["del"] = DEL;
        kw["elif"] = ELIF;
        kw["else"] = ELSE;
        kw["except"] = EXCEPT;
        kw["finally"] = FINALLY;
        kw["for"] = FOR;
        kw["from"] = FROM;
        kw["global"] = GLOBAL;
        kw["if"] = IF;
        kw["import"] = IMPORT;
        kw["in"] = IN;
        kw["is"] = IS;
        kw["lambda"] = LAMBDA;
        kw["nonlocal"] = NONLOCAL;
        kw["not"] = NOT;
        kw["or"] = OR;
        kw["pass"] = PASS;
        kw["raise"] = RAISE;
        kw["return"] = RETURN;
        kw["try"] = TRY;
        kw["while"] = WHILE;
        kw["with"] = WITH;
        kw["yield"] = YIELD;
        kw["async"] = ASYNC;
        kw["await"] = AWAIT;
        var tok_source = {};
        tok_source[ENDMARKER] = "";
        tok_source[NAME] = "x";
        tok_source[NUMBER] = "0";
        tok_source[STRING] = "\"a\"";
        tok_source[NEWLINE] = "\n";
        tok_source[INDENT] = "INDENT";
        tok_source[DEDENT] = "DEDENT";
        tok_source[LPAR] = "(";
        tok_source[RPAR] = ")";
        tok_source[LSQB] = "[";
        tok_source[RSQB] = "]";
        tok_source[COLON] = ":";
        tok_source[COMMA] = ",";
        tok_source[SEMI] = ";";
        tok_source[PLUS] = "+";
        tok_source[MINUS] = "-";
        tok_source[STAR] = "*";
        tok_source[SLASH] = "/";
        tok_source[VBAR] = "|";
        tok_source[AMPER] = "&";
        tok_source[LESS] = "<";
        tok_source[GREATER] = ">";
        tok_source[EQUAL] = "=";
        tok_source[DOT] = ".";
        tok_source[PERCENT] = "%";
        tok_source[BACKQUOTE] = "`";
        tok_source[LBRACE] = "{";
        tok_source[RBRACE] = "}";
        tok_source[EQEQUAL] = "==";
        tok_source[NOTEQUAL] = "!=";
        tok_source[LESSEQUAL] = "<=";
        tok_source[GREATEREQUAL] = ">=";
        tok_source[TILDE] = "~";
        tok_source[CIRCUMFLEX] = "^";
        tok_source[LEFTSHIFT] = "<<";
        tok_source[RIGHTSHIFT] = ">>";
        tok_source[DOUBLESTAR] = "**";
        tok_source[PLUSEQUAL] = "+=";
        tok_source[MINEQUAL] = "-=";
        tok_source[STAREQUAL] = "*=";
        tok_source[SLASHEQUAL] = "/=";
        tok_source[PERCENTEQUAL] = "%=";
        tok_source[AMPEREQUAL] = "&=";
        tok_source[VBAREQUAL] = "|=";
        tok_source[CIRCUMFLEXEQUAL] = "^=";
        tok_source[LEFTSHIFTEQUAL] = "<<=";
        tok_source[RIGHTSHIFTEQUAL] = ">>=";
        tok_source[DOUBLESTAREQUAL] = "**=";
        tok_source[DOUBLESLASH] = "//";
        tok_source[DOUBLESLASHEQUAL] = "//=";
        tok_source[AT] = "@";
        tok_source[OP] = "OP";
        tok_source[ELLIPSIS] = "...";
        tok_source[TYPE_COMMENT] = "";
        tok_source[ATEQUAL] = "@=";
        tok_source[COLONEQUAL] = ":=";
        tok_source[FALSE] = "False";
        tok_source[NONE] = "None";
        tok_source[TRUE] = "True";
        tok_source[AND] = "and";
        tok_source[AS] = "as";
        tok_source[ASSERT] = "assert";
        tok_source[BREAK] = "break";
        tok_source[CLASS] = "class";
        tok_source[CONTINUE] = "continue";
        tok_source[DEF] = "def";
        tok_source[DEL] = "del";
        tok_source[ELIF] = "elif";
        tok_source[ELSE] = "else";
        tok_source[EXCEPT] = "except";
        tok_source[FINALLY] = "finally";
        tok_source[FOR] = "for";
        tok_source[FROM] = "from";
        tok_source[GLOBAL] = "global";
        tok_source[IF] = "if";
        tok_source[IMPORT] = "import";
        tok_source[IN] = "in";
        tok_source[IS] = "is";
        tok_source[LAMBDA] = "lambda";
        tok_source[NONLOCAL] = "nonlocal";
        tok_source[NOT] = "not";
        tok_source[OR] = "or";
        tok_source[PASS] = "pass";
        tok_source[RAISE] = "raise";
        tok_source[RETURN] = "return";
        tok_source[TRY] = "try";
        tok_source[WHILE] = "while";
        tok_source[WITH] = "with";
        tok_source[YIELD] = "yield";
        tok_source[ASYNC] = "async";
        tok_source[AWAIT] = "await";

        function byte_at(x, i) {
            if (((typeof x) === "string")) {
                return x[i].charCodeAt(0);
            } else {
                return x[i];
            };
        };

        function append_eol(buf) {
            return (buf + (((typeof buf) === "string") ? "\n" : "\n"));
        };
        var stats = {};
        var found = new Array(68).fill(0);

        function init_stats() {
            stats["bol"] = 0;
            stats["not_bol"] = 0;
            stats["k == KIND_NAME"] = 0;
            stats["k >= KIND_TILDE"] = 0;
            stats["k >= KIND_LPAR"] = 0;
            stats["k <= KIND_LEFTSHIFTEQUAL"] = 0;
            stats["k <= KIND_STRING"] = 0;
            stats["k == KIND_STRING"] = 0;
            stats["k == KIND_DOT"] = 0;
            stats["k == KIND_COMMENT"] = 0;
            stats["k == KIND_NEWLINE"] = 0;
            stats["k == KIND_CONTINUATION"] = 0;
            stats["OTHER"] = 0;
            stats["SPECIAL"] = 0;
        };

        function inc_found(index) {
            found[index] += 1;
        };

        function inc_stats(name) {
            stats[name] += 1;
        };

        function show_stats() {
            console.log("\n***** STATISTICS *****");
            console.log("\n----- CHARACTER KINDS ENCOUNTERED:");
            for (const g0 of [...Array(found.length).keys()]) {
                console.log(found[g0].toString(), "=", kind_names[g0]);
            };
            console.log("\n----- DISTRIBUTION OF CHARACTER KINDS TESTED:");
            for (const g1 of stats) {
                console.log(JSON.stringify(stats[g1]), "=", g1);
            };
        };
        var KIND_NUMBER = 0;
        var KIND_NAME = 10;
        var KIND_STRING = 11;
        var KIND_DOT = 12;
        var KIND_COMMENT = 13;
        var KIND_CONTINUATION = 14;
        var KIND_WHITESPACE = 15;
        var KIND_NEWLINE = 16;
        var KIND_ERROR = 17;
        var KIND_STAR = 18;
        var KIND_STAREQUAL = 19;
        var KIND_DOUBLESTAR = 20;
        var KIND_DOUBLESTAREQUAL = 21;
        var KIND_SLASH = 22;
        var KIND_SLASHEQUAL = 23;
        var KIND_DOUBLESLASH = 24;
        var KIND_DOUBLESLASHEQUAL = 25;
        var KIND_GREATER = 26;
        var KIND_GREATEREQUAL = 27;
        var KIND_RIGHTSHIFT = 28;
        var KIND_RIGHTSHIFTEQUAL = 29;
        var KIND_LESS = 30;
        var KIND_LESSEQUAL = 31;
        var KIND_LEFTSHIFT = 32;
        var KIND_LEFTSHIFTEQUAL = 33;
        var KIND_PERCENT = 34;
        var KIND_PERCENTEQUAL = 35;
        var KIND_AMPER = 36;
        var KIND_AMPEREQUAL = 37;
        var KIND_VBAR = 38;
        var KIND_VBAREQUAL = 39;
        var KIND_CIRCUMFLEX = 40;
        var KIND_CIRCUMFLEXEQUAL = 41;
        var KIND_EQUAL = 42;
        var KIND_EQEQUAL = 43;
        var KIND_PLUS = 44;
        var KIND_PLUSEQUAL = 45;
        var KIND_MINUS = 46;
        var KIND_MINEQUAL = 47;
        var KIND_NOT = 48;
        var KIND_NOTEQUAL = 49;
        var KIND_AT = 50;
        var KIND_ATEQUAL = 51;
        var KIND_COLON = 52;
        var KIND_COLONEQUAL = 53;
        var KIND_TILDE = 54;
        var KIND_COMMA = 55;
        var KIND_BACKQUOTE = 56;
        var KIND_SEMI = 57;
        var KIND_LPAR = 58;
        var KIND_LSQB = 59;
        var KIND_LBRACE = 60;
        var KIND_RPAR = 61;
        var KIND_RSQB = 62;
        var KIND_RBRACE = 63;
        var KIND_ELLIPSIS = 64;
        var KIND_INDENT = 65;
        var KIND_DEDENT = 66;
        var KIND_EOF = 67;
        var BYTE_STRING = 0;
        var PLAIN_STRING = 1;
        var UNICODE_STRING = 2;
        var kind_to_token = [NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, NUMBER, NAME, STRING, DOT, 999, 999, 999, NEWLINE, ERRORTOKEN, STAR, STAREQUAL, DOUBLESTAR, DOUBLESTAREQUAL, SLASH, SLASHEQUAL, DOUBLESLASH, DOUBLESLASHEQUAL, GREATER, GREATEREQUAL, RIGHTSHIFT, RIGHTSHIFTEQUAL, LESS, LESSEQUAL, LEFTSHIFT, LEFTSHIFTEQUAL, PERCENT, PERCENTEQUAL, AMPER, AMPEREQUAL, VBAR, VBAREQUAL, CIRCUMFLEX, CIRCUMFLEXEQUAL, EQUAL, EQEQUAL, PLUS, PLUSEQUAL, MINUS, MINEQUAL, 999, NOTEQUAL, AT, ATEQUAL, COLON, COLONEQUAL, TILDE, COMMA, BACKQUOTE, SEMI, LPAR, LSQB, LBRACE, RPAR, RSQB, RBRACE, ELLIPSIS, INDENT, DEDENT, ENDMARKER];
        var kind_names = ["KIND_NUMBER", "KIND_1", "KIND_2", "KIND_3", "KIND_4", "KIND_5", "KIND_6", "KIND_7", "KIND_8", "KIND_9", "KIND_NAME", "KIND_STRING", "KIND_DOT", "KIND_COMMENT", "KIND_CONTINUATION", "KIND_WHITESPACE", "KIND_NEWLINE", "KIND_ERROR", "KIND_STAR", "KIND_STAREQUAL", "KIND_DOUBLESTAR", "KIND_DOUBLESTAREQUAL", "KIND_SLASH", "KIND_SLASHEQUAL", "KIND_DOUBLESLASH", "KIND_DOUBLESLASHEQUAL", "KIND_GREATER", "KIND_GREATEREQUAL", "KIND_RIGHTSHIFT", "KIND_RIGHTSHIFTEQUAL", "KIND_LESS", "KIND_LESSEQUAL", "KIND_LEFTSHIFT", "KIND_LEFTSHIFTEQUAL", "KIND_PERCENT", "KIND_PERCENTEQUAL", "KIND_AMPER", "KIND_AMPEREQUAL", "KIND_VBAR", "KIND_VBAREQUAL", "KIND_CIRCUMFLEX", "KIND_CIRCUMFLEXEQUAL", "KIND_EQUAL", "KIND_EQEQUAL", "KIND_PLUS", "KIND_PLUSEQUAL", "KIND_MINUS", "KIND_MINEQUAL", "KIND_NOT", "KIND_NOTEQUAL", "KIND_AT", "KIND_ATEQUAL", "KIND_COLON", "KIND_COLONEQUAL", "KIND_TILDE", "KIND_COMMA", "KIND_BACKQUOTE", "KIND_SEMI", "KIND_LPAR", "KIND_LSQB", "KIND_LBRACE", "KIND_RPAR", "KIND_RSQB", "KIND_RBRACE", "KIND_ELLIPSIS", "KIND_INDENT", "KIND_DEDENT", "KIND_EOF"];

        function make_char_kind() {
            var char_kind = new Uint8Array(256);

            function set_char_kind(code, tok) {
                char_kind[code] = tok;
            };
            for (let g2 = 0; g2 < 256; g2++) {
                set_char_kind(g2, KIND_ERROR);
            };
            for (let g3 = 0; g3 < 10; g3++) {
                set_char_kind((48 + g3), g3);
            };
            for (let g4 = 0; g4 < 26; g4++) {
                set_char_kind((97 + g4), KIND_NAME);
                set_char_kind((65 + g4), KIND_NAME);
            };
            set_char_kind(95, KIND_NAME);
            set_char_kind(34, KIND_STRING);
            set_char_kind(39, KIND_STRING);
            set_char_kind(46, KIND_DOT);
            set_char_kind(35, KIND_COMMENT);
            set_char_kind(92, KIND_CONTINUATION);
            set_char_kind(32, KIND_WHITESPACE);
            set_char_kind(9, KIND_WHITESPACE);
            set_char_kind(12, KIND_WHITESPACE);
            set_char_kind(10, KIND_NEWLINE);
            set_char_kind(13, KIND_NEWLINE);
            set_char_kind(42, KIND_STAR);
            set_char_kind(47, KIND_SLASH);
            set_char_kind(62, KIND_GREATER);
            set_char_kind(60, KIND_LESS);
            set_char_kind(37, KIND_PERCENT);
            set_char_kind(38, KIND_AMPER);
            set_char_kind(124, KIND_VBAR);
            set_char_kind(94, KIND_CIRCUMFLEX);
            set_char_kind(61, KIND_EQUAL);
            set_char_kind(43, KIND_PLUS);
            set_char_kind(45, KIND_MINUS);
            set_char_kind(33, KIND_NOT);
            set_char_kind(64, KIND_AT);
            set_char_kind(58, KIND_COLON);
            set_char_kind(126, KIND_TILDE);
            set_char_kind(44, KIND_COMMA);
            set_char_kind(59, KIND_SEMI);
            set_char_kind(40, KIND_LPAR);
            set_char_kind(91, KIND_LSQB);
            set_char_kind(123, KIND_LBRACE);
            set_char_kind(41, KIND_RPAR);
            set_char_kind(93, KIND_RSQB);
            set_char_kind(125, KIND_RBRACE);
            return char_kind;
        };
        var char_kind = make_char_kind();

        function TokenizerState(buf) {
            this.buf = append_eol(buf);
            this.buf_len = buf.length;
            this.start = 0;
            this.end = 0;
            this.token = NEWLINE;
            this.line_start = 0;
            this.line_num = 1;
            this.paren_level = 0;
            this.indents = [0];
            this.dedents = 0;
            this.python = 2;
        };

        function get_lineno(ts) {
            return ts.line_num;
        };

        function get_col_offset(ts) {
            return (ts.start - ts.line_start);
        };

        function get_end_lineno(ts) {
            return ts.line_num;
        };

        function get_end_col_offset(ts) {
            return (ts.end - ts.line_start);
        };

        function set_start(ast, lineno, col_offset) {
            ast.lineno = lineno;
            ast.col_offset = col_offset;
            return ast;
        };

        function set_end(ast, end_lineno, end_col_offset) {
            ast.end_lineno = end_lineno;
            ast.end_col_offset = end_col_offset;
            return ast;
        };

        function set_start_end(ts, lineno, col_offset, ast) {
            set_start(ast, lineno, col_offset);
            set_end(ast, ts.prev_end_lineno, ts.prev_end_col_offset);
            return ast;
        };

        function set_start_1token(ts, ast) {
            return set_start(ast, get_lineno(ts), get_col_offset(ts));
        };

        function set_end_1token(ts, ast) {
            return set_end(ast, get_end_lineno(ts), get_end_col_offset(ts));
        };

        function set_start_end_1token(ts, ast) {
            return set_end_1token(ts, set_start_1token(ts, ast));
        };

        function source(ts, start, end) {
            return ts.buf.slice(start, end);
        };

        function token(ts) {
            return source(ts, ts.start, ts.end);
        };

        function get_token(ts) {
            if ((ts.dedents > 0)) {
                ts.dedents -= 1;
                ts.token = DEDENT;
                return null;
            };
            var buf = ts.buf;
            var pos = ts.end;
            while (true) {
                if ((((pos === ts.line_start)) && ((ts.paren_level === 0)))) {
                    inc_stats("bol");
                    var col = 0;
                    while (true) {
                        var c = byte_at(buf, pos);
                        pos += 1;
                        if ((c === 32)) {
                            col += 1;
                        } else {
                            if ((c === 9)) {
                                var col = ((((col / 8) >> 0) + 1) * 8);
                            } else {
                                if ((c === 12)) {
                                    var col = 0;
                                } else {
                                    break;
                                };
                            };
                        };
                    };
                    if ((c === 35)) {
                        while (true) {
                            var c = byte_at(buf, pos);
                            pos += 1;
                            if ((((c === 10)) || ((c === 13)))) {
                                break;
                            };
                        };
                    };
                    if ((((c === 10)) || ((c === 13)))) {
                        if ((((c === 13)) && ((byte_at(buf, pos) === 10)))) {
                            pos += 1;
                        };
                        ts.line_start = pos;
                        ts.line_num += 1;
                        if ((pos < ts.buf_len)) {
                            continue;
                        };
                        ts.start = ts.buf_len;
                        ts.end = ts.buf_len;
                        var n = (ts.indents.length - 1);
                        if ((n > 0)) {
                            ts.indents = [0];
                            ts.dedents = (n - 1);
                            ts.token = DEDENT;
                            return null;
                        };
                        inc_found(KIND_EOF);
                        ts.token = ENDMARKER;
                        return null;
                    };
                    var n = ts.indents.length;
                    var i = (n - 1);
                    if ((ts.indents[i] < col)) {
                        ts.indents.push(col);
                        ts.start = (pos - 1);
                        ts.end = (pos - 1);
                        ts.token = INDENT;
                        return null;
                    };
                    if ((col < ts.indents[i])) {
                        while (true) {
                            if ((ts.indents[(i - 1)] <= col)) {
                                break;
                            };
                            i -= 1;
                        };
                        if ((ts.indents[(i - 1)] !== col)) {
                            console.log("inconsistent dedent");
                            ts.token = ERRORTOKEN;
                            return null;
                        };
                        ts.indents = ts.indents.slice(0, i);
                        ts.dedents = ((n - i) - 1);
                        ts.start = (pos - 1);
                        ts.end = (pos - 1);
                        ts.token = DEDENT;
                        return null;
                    };
                    var k = char_kind[c];
                } else {
                    inc_stats("not_bol");
                    while (true) {
                        var c = byte_at(buf, pos);
                        var k = char_kind[c];
                        pos += 1;
                        if ((k !== KIND_WHITESPACE)) {
                            break;
                        };
                    };
                    if ((k === KIND_NEWLINE)) {
                        ts.start = (pos - 1);
                        if ((((c === 13)) && ((byte_at(buf, pos) === 10)))) {
                            pos += 1;
                        };
                        ts.line_start = pos;
                        ts.line_num += 1;
                        if ((pos <= ts.buf_len)) {
                            if ((ts.paren_level === 0)) {
                                ts.end = pos;
                                ts.token = NEWLINE;
                                return null;
                            } else {
                                continue;
                            };
                        };
                        inc_found(KIND_EOF);
                        ts.start = ts.buf_len;
                        ts.end = ts.buf_len;
                        ts.token = ENDMARKER;
                        return null;
                    };
                };
                ts.start = (pos - 1);
                if ((k === KIND_NAME)) {
                    inc_stats("k == KIND_NAME");
                    while (true) {
                        var next = byte_at(buf, pos);
                        var k = char_kind[next];
                        if ((k > KIND_NAME)) {
                            break;
                        };
                        pos += 1;
                    };
                    if ((k === KIND_STRING)) {
                        var c = (c & 223);
                        if ((((c === 66)) || ((c === 85)))) {
                            var kind = ((c === 66) ? BYTE_STRING : UNICODE_STRING);
                            if ((ts.start === (pos - 1))) {
                                get_string(ts, (pos + 1), next, kind, false);
                                return null;
                            };
                            if ((ts.start === (pos - 2))) {
                                var c2 = (byte_at(buf, (ts.start + 1)) & 223);
                                if ((c2 === 82)) {
                                    get_string(ts, (pos + 1), next, kind, true);
                                    return null;
                                };
                            };
                        } else {
                            if ((c === 82)) {
                                if ((ts.start === (pos - 1))) {
                                    get_string(ts, (pos + 1), next, PLAIN_STRING, true);
                                    return null;
                                };
                            };
                        };
                    };
                    inc_found(KIND_NAME);
                    ts.end = pos;
                    ts.token = dict_get(kw, source(ts, ts.start, ts.end), NAME);
                    return null;
                };
                if ((k >= KIND_TILDE)) {
                    inc_stats("k >= KIND_TILDE");
                    if ((k >= KIND_LPAR)) {
                        inc_stats("k >= KIND_LPAR");
                        if ((k >= KIND_RPAR)) {
                            ts.paren_level -= 1;
                        } else {
                            ts.paren_level += 1;
                        };
                    };
                    inc_found(1);
                    ts.end = pos;
                    ts.token = kind_to_token[k];
                    return null;
                };
                inc_stats("OTHER");
                var next = byte_at(buf, pos);
                if ((k <= KIND_LEFTSHIFTEQUAL)) {
                    inc_stats("k <= KIND_LEFTSHIFTEQUAL");
                    if ((k < KIND_STAR)) {
                        if ((k === KIND_NEWLINE)) {
                            inc_stats("k == KIND_NEWLINE");
                            if ((((c === 13)) && ((next === 10)))) {
                                pos += 1;
                            };
                            ts.line_start = pos;
                            if ((pos > ts.buf_len)) {
                                ts.start = ts.buf_len;
                                ts.end = ts.buf_len;
                                ts.token = ENDMARKER;
                                return null;
                            } else {
                                if ((((ts.paren_level > 0)) || ((ts.token === NEWLINE)))) {
                                    continue;
                                } else {
                                    ts.end = pos;
                                    ts.token = NEWLINE;
                                    return null;
                                };
                            };
                        };
                        if ((k === KIND_DOT)) {
                            inc_stats("k == KIND_DOT");
                            if ((char_kind[next] <= 9)) {
                                while (true) {
                                    pos += 1;
                                    var next = byte_at(buf, pos);
                                    if ((char_kind[next] > 9)) {
                                        break;
                                    };
                                };
                                inc_found(KIND_NUMBER);
                                ts.end = pos;
                                ts.token = NUMBER;
                                return null;
                            } else {
                                if ((((next === 46)) && ((byte_at(buf, (pos + 1)) === 46)))) {
                                    inc_found(KIND_ELLIPSIS);
                                    ts.end = (pos + 2);
                                    ts.token = ELLIPSIS;
                                    return null;
                                };
                            };
                            inc_found(KIND_DOT);
                            ts.end = pos;
                            ts.token = DOT;
                            return null;
                        };
                        if ((k === KIND_STRING)) {
                            inc_stats("k == KIND_STRING");
                            inc_found(KIND_STRING);
                            get_string(ts, pos, c, PLAIN_STRING, false);
                            return null;
                        };
                        if ((k < KIND_STRING)) {
                            inc_stats("k <= KIND_STRING");
                            var base = 10;
                            if ((c === 48)) {
                                var next = (next & 223);
                                if ((next === 88)) {
                                    var base = 16;
                                    pos += 1;
                                } else {
                                    if ((next === 79)) {
                                        var base = 8;
                                        pos += 1;
                                    } else {
                                        if ((next === 66)) {
                                            var base = 2;
                                            pos += 1;
                                        } else {
                                            var base = 8;
                                        };
                                    };
                                };
                                var next = byte_at(buf, pos);
                            };
                            while (true) {
                                var k = char_kind[next];
                                if ((k <= 9)) {
                                    /* pass */ ;
                                } else {
                                    if ((k === KIND_NAME)) {
                                        var k = ((next & 223) - 55);
                                    } else {
                                        k += 100;
                                    };
                                };
                                if ((k > base)) {
                                    break;
                                };
                                pos += 1;
                                var next = byte_at(buf, pos);
                            };
                            if ((((k === 21)) && ((ts.python === 2)))) {
                                pos += 1;
                            } else {
                                if ((k === (100 + KIND_DOT))) {
                                    pos += 1;
                                    while (true) {
                                        var next = byte_at(buf, pos);
                                        var k = char_kind[next];
                                        if ((k > 9)) {
                                            break;
                                        };
                                        pos += 1;
                                    };
                                };
                                var next = (next & 223);
                                if ((next === 69)) {
                                    pos += 1;
                                    var next = byte_at(buf, pos);
                                    if ((((next === 43)) || ((next === 45)))) {
                                        pos += 1;
                                        var next = byte_at(buf, pos);
                                    };
                                    var k = char_kind[next];
                                    if ((k <= 9)) {
                                        while (true) {
                                            pos += 1;
                                            var next = byte_at(buf, pos);
                                            var k = char_kind[next];
                                            if ((k > 9)) {
                                                break;
                                            };
                                        };
                                    };
                                };
                            };
                            inc_found(KIND_NUMBER);
                            ts.end = pos;
                            ts.token = NUMBER;
                            return null;
                        };
                        if ((k === KIND_COMMENT)) {
                            inc_stats("k == KIND_COMMENT");
                            inc_found(KIND_COMMENT);
                            while ((byte_at(buf, pos) !== 10)) {
                                pos += 1;
                            };
                            continue;
                        };
                        inc_stats("k == KIND_CONTINUATION");
                        inc_found(KIND_CONTINUATION);
                        if ((next === 10)) {
                            pos += 1;
                            continue;
                        };
                        console.log("error bad continuation line");
                        console.log(("c=" + JSON.stringify(c)));
                        console.log(("next=" + JSON.stringify(next)));
                        ts.token = 0;
                        return null;
                    };
                    if ((next === c)) {
                        inc_found(2);
                        k += 2;
                        pos += 1;
                        var next = byte_at(buf, pos);
                    };
                };
                inc_stats("SPECIAL");
                if ((next === 61)) {
                    inc_found(3);
                    k += 1;
                    pos += 1;
                } else {
                    if ((((k === KIND_LESS)) && ((next === 62)))) {
                        inc_found(4);
                        var k = KIND_NOTEQUAL;
                        pos += 1;
                    } else {
                        if ((k === KIND_NOT)) {
                            inc_found(5);
                            var k = KIND_ERROR;
                        } else {
                            inc_found(6);
                        };
                    };
                };
                ts.end = pos;
                ts.token = kind_to_token[k];
                return null;
            };
        };

        function get_string(ts, pos, c, kind, regexpr) {
            function _print(x) {
                /* pass */ ;
            };
            if (regexpr) {
                if ((kind === BYTE_STRING)) {
                    _print("@@@@@@ string with BR prefix");
                } else {
                    if ((kind === UNICODE_STRING)) {
                        _print("@@@@@@ string with UR prefix");
                    } else {
                        _print("@@@@@@ string with R prefix");
                    };
                };
            } else {
                if ((kind === BYTE_STRING)) {
                    _print("@@@@@@ string with B prefix");
                } else {
                    if ((kind === UNICODE_STRING)) {
                        _print("@@@@@@ string with U prefix");
                    } else {
                        _print("@@@@@@ string with no prefix");
                    };
                };
            };
            var buf = ts.buf;
            if ((((byte_at(buf, pos) === c)) && ((byte_at(buf, (pos + 1)) === c)))) {
                pos += 2;
                while (true) {
                    var next = byte_at(buf, pos);
                    if ((((next === c)) && ((byte_at(buf, (pos + 1)) === c)) && ((byte_at(buf, (pos + 2)) === c)))) {
                        pos += 3;
                        break;
                    } else {
                        if ((next === 92)) {
                            if ((byte_at(buf, (pos + 1)) === 10)) {
                                ts.line_num += 1;
                            };
                            pos += 2;
                        } else {
                            if ((next === 10)) {
                                ts.line_num += 1;
                            };
                            pos += 1;
                        };
                    };
                };
            } else {
                while (true) {
                    var next = byte_at(buf, pos);
                    if ((next === c)) {
                        pos += 1;
                        break;
                    } else {
                        if ((next === 92)) {
                            if ((byte_at(buf, (pos + 1)) === 10)) {
                                ts.line_num += 1;
                            };
                            pos += 2;
                        } else {
                            if ((next === 10)) {
                                var k = KIND_ERROR;
                                break;
                            } else {
                                pos += 1;
                            };
                        };
                    };
                };
            };
            ts.end = pos;
            ts.token = STRING;
        };

        function AST() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };

        function mod() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        mod.prototype = Object.create(AST.prototype);
        mod.prototype.constructor = mod;

        function Module(body, type_ignores) {
            this.body = body;
            this.type_ignores = type_ignores;
            this._fields = ["body", "type_ignores"];
            this._attributes = [];
        };
        Module.prototype = Object.create(mod.prototype);
        Module.prototype.constructor = Module;

        function type_ignore() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        type_ignore.prototype = Object.create(AST.prototype);
        type_ignore.prototype.constructor = type_ignore;

        function TypeIgnore(lineno, tag) {
            this.lineno = lineno;
            this.tag = tag;
            this._fields = ["lineno", "tag"];
            this._attributes = [];
        };
        TypeIgnore.prototype = Object.create(type_ignore.prototype);
        TypeIgnore.prototype.constructor = TypeIgnore;

        function Interactive(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Interactive.prototype = Object.create(mod.prototype);
        Interactive.prototype.constructor = Interactive;

        function Expression(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Expression.prototype = Object.create(mod.prototype);
        Expression.prototype.constructor = Expression;

        function FunctionType(argtypes, returns) {
            this.argtypes = argtypes;
            this.returns = returns;
            this._fields = ["argtypes", "returns"];
            this._attributes = [];
        };
        FunctionType.prototype = Object.create(mod.prototype);
        FunctionType.prototype.constructor = FunctionType;

        function Suite(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Suite.prototype = Object.create(mod.prototype);
        Suite.prototype.constructor = Suite;

        function stmt() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        stmt.prototype = Object.create(AST.prototype);
        stmt.prototype.constructor = stmt;

        function FunctionDef(name, args, body, decorator_list, returns, type_comment) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.returns = returns;
            this.type_comment = type_comment;
            this._fields = ["name", "args", "body", "decorator_list", "returns", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        FunctionDef.prototype = Object.create(stmt.prototype);
        FunctionDef.prototype.constructor = FunctionDef;

        function aarguments(args, posonlyargs, vararg, kwonlyargs, kw_defaults, kwarg, defaults) {
            this.args = args;
            this.posonlyargs = posonlyargs;
            this.vararg = vararg;
            this.kwonlyargs = kwonlyargs;
            this.kw_defaults = kw_defaults;
            this.kwarg = kwarg;
            this.defaults = defaults;
            this._fields = ["posonlyargs", "args", "vararg", "kwonlyargs", "kw_defaults", "kwarg", "defaults"];
            this._attributes = [];
        };
        aarguments.prototype = Object.create(AST.prototype);
        aarguments.prototype.constructor = aarguments;

        function arg(arg, annotation, type_comment) {
            this.arg = arg;
            this.annotation = annotation;
            this.type_comment = type_comment;
            this._fields = ["arg", "annotation", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        arg.prototype = Object.create(AST.prototype);
        arg.prototype.constructor = arg;

        function AsyncFunctionDef(name, args, body, decorator_list, returns, type_comment) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.returns = returns;
            this.type_comment = type_comment;
            this._fields = ["name", "args", "body", "decorator_list", "returns", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncFunctionDef.prototype = Object.create(stmt.prototype);
        AsyncFunctionDef.prototype.constructor = AsyncFunctionDef;

        function ClassDef(name, bases, keywords, body, decorator_list) {
            this.name = name;
            this.bases = bases;
            this.keywords = keywords;
            this.body = body;
            this.decorator_list = decorator_list;
            this._fields = ["name", "bases", "keywords", "body", "decorator_list"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ClassDef.prototype = Object.create(stmt.prototype);
        ClassDef.prototype.constructor = ClassDef;

        function Return(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Return.prototype = Object.create(stmt.prototype);
        Return.prototype.constructor = Return;

        function Delete(targets) {
            this.targets = targets;
            this._fields = ["targets"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Delete.prototype = Object.create(stmt.prototype);
        Delete.prototype.constructor = Delete;

        function Assign(targets, value, type_comment) {
            this.targets = targets;
            this.value = value;
            this.type_comment = type_comment;
            this._fields = ["targets", "value", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Assign.prototype = Object.create(stmt.prototype);
        Assign.prototype.constructor = Assign;

        function AugAssign(target, op, value) {
            this.target = target;
            this.op = op;
            this.value = value;
            this._fields = ["target", "op", "value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AugAssign.prototype = Object.create(stmt.prototype);
        AugAssign.prototype.constructor = AugAssign;

        function AnnAssign(target, annotation, value, simple) {
            this.target = target;
            this.annotation = annotation;
            this.value = value;
            this.simple = simple;
            this._fields = ["target", "annotation", "value", "simple"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AnnAssign.prototype = Object.create(stmt.prototype);
        AnnAssign.prototype.constructor = AnnAssign;

        function For(target, iter, body, orelse, type_comment) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.type_comment = type_comment;
            this._fields = ["target", "iter", "body", "orelse", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        For.prototype = Object.create(stmt.prototype);
        For.prototype.constructor = For;

        function AsyncFor(target, iter, body, orelse, type_comment) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.type_comment = type_comment;
            this._fields = ["target", "iter", "body", "orelse", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncFor.prototype = Object.create(stmt.prototype);
        AsyncFor.prototype.constructor = AsyncFor;

        function While(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        While.prototype = Object.create(stmt.prototype);
        While.prototype.constructor = While;

        function If(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        If.prototype = Object.create(stmt.prototype);
        If.prototype.constructor = If;

        function With(items, body, type_comment) {
            this.items = items;
            this.body = body;
            this.type_comment = type_comment;
            this._fields = ["items", "body", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        With.prototype = Object.create(stmt.prototype);
        With.prototype.constructor = With;

        function AsyncWith(items, body, type_comment) {
            this.items = items;
            this.body = body;
            this.type_comment = type_comment;
            this._fields = ["items", "body", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncWith.prototype = Object.create(stmt.prototype);
        AsyncWith.prototype.constructor = AsyncWith;

        function withitem(context_expr, optional_vars) {
            this.context_expr = context_expr;
            this.optional_vars = optional_vars;
            this._fields = ["context_expr", "optional_vars"];
            this._attributes = [];
        };
        withitem.prototype = Object.create(AST.prototype);
        withitem.prototype.constructor = withitem;

        function Raise(exc, cause) {
            this.exc = exc;
            this.cause = cause;
            this._fields = ["exc", "cause"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Raise.prototype = Object.create(stmt.prototype);
        Raise.prototype.constructor = Raise;

        function Try(body, handlers, orelse, finalbody) {
            this.body = body;
            this.handlers = handlers;
            this.orelse = orelse;
            this.finalbody = finalbody;
            this._fields = ["body", "handlers", "orelse", "finalbody"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Try.prototype = Object.create(stmt.prototype);
        Try.prototype.constructor = Try;

        function excepthandler() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        excepthandler.prototype = Object.create(AST.prototype);
        excepthandler.prototype.constructor = excepthandler;

        function ExceptHandler(type, name, body) {
            this.type = type;
            this.name = name;
            this.body = body;
            this._fields = ["type", "name", "body"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ExceptHandler.prototype = Object.create(excepthandler.prototype);
        ExceptHandler.prototype.constructor = ExceptHandler;

        function Assert(test, msg) {
            this.test = test;
            this.msg = msg;
            this._fields = ["test", "msg"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Assert.prototype = Object.create(stmt.prototype);
        Assert.prototype.constructor = Assert;

        function Import(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Import.prototype = Object.create(stmt.prototype);
        Import.prototype.constructor = Import;

        function ImportFrom(module, names, level) {
            this.module = module;
            this.names = names;
            this.level = level;
            this._fields = ["module", "names", "level"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ImportFrom.prototype = Object.create(stmt.prototype);
        ImportFrom.prototype.constructor = ImportFrom;

        function alias(name, asname) {
            this.name = name;
            this.asname = asname;
            this._fields = ["name", "asname"];
            this._attributes = [];
        };
        alias.prototype = Object.create(AST.prototype);
        alias.prototype.constructor = alias;

        function Global(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Global.prototype = Object.create(stmt.prototype);
        Global.prototype.constructor = Global;

        function Nonlocal(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Nonlocal.prototype = Object.create(stmt.prototype);
        Nonlocal.prototype.constructor = Nonlocal;

        function Expr(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Expr.prototype = Object.create(stmt.prototype);
        Expr.prototype.constructor = Expr;

        function Pass() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Pass.prototype = Object.create(stmt.prototype);
        Pass.prototype.constructor = Pass;

        function Break() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Break.prototype = Object.create(stmt.prototype);
        Break.prototype.constructor = Break;

        function Continue() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Continue.prototype = Object.create(stmt.prototype);
        Continue.prototype.constructor = Continue;

        function expr() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        expr.prototype = Object.create(AST.prototype);
        expr.prototype.constructor = expr;

        function expr_context() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        expr_context.prototype = Object.create(AST.prototype);
        expr_context.prototype.constructor = expr_context;

        function Load() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Load.prototype = Object.create(expr_context.prototype);
        Load.prototype.constructor = Load;

        function Store() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Store.prototype = Object.create(expr_context.prototype);
        Store.prototype.constructor = Store;

        function Del() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Del.prototype = Object.create(expr_context.prototype);
        Del.prototype.constructor = Del;

        function AugLoad() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        AugLoad.prototype = Object.create(expr_context.prototype);
        AugLoad.prototype.constructor = AugLoad;

        function AugStore() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        AugStore.prototype = Object.create(expr_context.prototype);
        AugStore.prototype.constructor = AugStore;

        function Param() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Param.prototype = Object.create(expr_context.prototype);
        Param.prototype.constructor = Param;

        function BoolOp(op, values) {
            this.op = op;
            this.values = values;
            this._fields = ["op", "values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        BoolOp.prototype = Object.create(expr.prototype);
        BoolOp.prototype.constructor = BoolOp;

        function boolop() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        boolop.prototype = Object.create(AST.prototype);
        boolop.prototype.constructor = boolop;

        function And() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        And.prototype = Object.create(boolop.prototype);
        And.prototype.constructor = And;

        function Or() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Or.prototype = Object.create(boolop.prototype);
        Or.prototype.constructor = Or;

        function NamedExpr(target, value) {
            this.target = target;
            this.value = value;
            this._fields = ["target", "value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        NamedExpr.prototype = Object.create(expr.prototype);
        NamedExpr.prototype.constructor = NamedExpr;

        function BinOp(left, op, right) {
            this.left = left;
            this.op = op;
            this.right = right;
            this._fields = ["left", "op", "right"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        BinOp.prototype = Object.create(expr.prototype);
        BinOp.prototype.constructor = BinOp;

        function operator() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        operator.prototype = Object.create(AST.prototype);
        operator.prototype.constructor = operator;

        function Add() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Add.prototype = Object.create(operator.prototype);
        Add.prototype.constructor = Add;

        function Sub() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Sub.prototype = Object.create(operator.prototype);
        Sub.prototype.constructor = Sub;

        function Mult() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Mult.prototype = Object.create(operator.prototype);
        Mult.prototype.constructor = Mult;

        function Div() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Div.prototype = Object.create(operator.prototype);
        Div.prototype.constructor = Div;

        function FloorDiv() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        FloorDiv.prototype = Object.create(operator.prototype);
        FloorDiv.prototype.constructor = FloorDiv;

        function Mod() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Mod.prototype = Object.create(operator.prototype);
        Mod.prototype.constructor = Mod;

        function Pow() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Pow.prototype = Object.create(operator.prototype);
        Pow.prototype.constructor = Pow;

        function LShift() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        LShift.prototype = Object.create(operator.prototype);
        LShift.prototype.constructor = LShift;

        function RShift() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        RShift.prototype = Object.create(operator.prototype);
        RShift.prototype.constructor = RShift;

        function BitOr() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitOr.prototype = Object.create(operator.prototype);
        BitOr.prototype.constructor = BitOr;

        function BitXor() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitXor.prototype = Object.create(operator.prototype);
        BitXor.prototype.constructor = BitXor;

        function BitAnd() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitAnd.prototype = Object.create(operator.prototype);
        BitAnd.prototype.constructor = BitAnd;

        function MatMult() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        MatMult.prototype = Object.create(operator.prototype);
        MatMult.prototype.constructor = MatMult;

        function UnaryOp(op, operand) {
            this.op = op;
            this.operand = operand;
            this._fields = ["op", "operand"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        UnaryOp.prototype = Object.create(expr.prototype);
        UnaryOp.prototype.constructor = UnaryOp;

        function unaryop() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        unaryop.prototype = Object.create(AST.prototype);
        unaryop.prototype.constructor = unaryop;

        function UAdd() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        UAdd.prototype = Object.create(unaryop.prototype);
        UAdd.prototype.constructor = UAdd;

        function USub() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        USub.prototype = Object.create(unaryop.prototype);
        USub.prototype.constructor = USub;

        function Not() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Not.prototype = Object.create(unaryop.prototype);
        Not.prototype.constructor = Not;

        function Invert() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Invert.prototype = Object.create(unaryop.prototype);
        Invert.prototype.constructor = Invert;

        function Lambda(args, body) {
            this.args = args;
            this.body = body;
            this._fields = ["args", "body"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Lambda.prototype = Object.create(expr.prototype);
        Lambda.prototype.constructor = Lambda;

        function IfExp(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        IfExp.prototype = Object.create(expr.prototype);
        IfExp.prototype.constructor = IfExp;

        function Dict(keys, values) {
            this.keys = keys;
            this.values = values;
            this._fields = ["keys", "values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Dict.prototype = Object.create(expr.prototype);
        Dict.prototype.constructor = Dict;

        function Set(elts) {
            this.elts = elts;
            this._fields = ["elts"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Set.prototype = Object.create(expr.prototype);
        Set.prototype.constructor = Set;

        function ListComp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ListComp.prototype = Object.create(expr.prototype);
        ListComp.prototype.constructor = ListComp;

        function SetComp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        SetComp.prototype = Object.create(expr.prototype);
        SetComp.prototype.constructor = SetComp;

        function DictComp(key, value, generators) {
            this.key = key;
            this.value = value;
            this.generators = generators;
            this._fields = ["key", "value", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        DictComp.prototype = Object.create(expr.prototype);
        DictComp.prototype.constructor = DictComp;

        function comprehension(target, iter, ifs, is_async) {
            this.target = target;
            this.iter = iter;
            this.ifs = ifs;
            this.is_async = is_async;
            this._fields = ["target", "iter", "ifs", "is_async"];
            this._attributes = [];
        };
        comprehension.prototype = Object.create(AST.prototype);
        comprehension.prototype.constructor = comprehension;

        function GeneratorExp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        GeneratorExp.prototype = Object.create(expr.prototype);
        GeneratorExp.prototype.constructor = GeneratorExp;

        function Await(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Await.prototype = Object.create(expr.prototype);
        Await.prototype.constructor = Await;

        function Yield(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Yield.prototype = Object.create(expr.prototype);
        Yield.prototype.constructor = Yield;

        function YieldFrom(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        YieldFrom.prototype = Object.create(expr.prototype);
        YieldFrom.prototype.constructor = YieldFrom;

        function Compare(left, ops, comparators) {
            this.left = left;
            this.ops = ops;
            this.comparators = comparators;
            this._fields = ["left", "ops", "comparators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Compare.prototype = Object.create(expr.prototype);
        Compare.prototype.constructor = Compare;

        function cmpop() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        cmpop.prototype = Object.create(AST.prototype);
        cmpop.prototype.constructor = cmpop;

        function Eq() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Eq.prototype = Object.create(cmpop.prototype);
        Eq.prototype.constructor = Eq;

        function NotEq() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        NotEq.prototype = Object.create(cmpop.prototype);
        NotEq.prototype.constructor = NotEq;

        function Lt() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Lt.prototype = Object.create(cmpop.prototype);
        Lt.prototype.constructor = Lt;

        function LtE() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        LtE.prototype = Object.create(cmpop.prototype);
        LtE.prototype.constructor = LtE;

        function Gt() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Gt.prototype = Object.create(cmpop.prototype);
        Gt.prototype.constructor = Gt;

        function GtE() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        GtE.prototype = Object.create(cmpop.prototype);
        GtE.prototype.constructor = GtE;

        function Is() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Is.prototype = Object.create(cmpop.prototype);
        Is.prototype.constructor = Is;

        function IsNot() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        IsNot.prototype = Object.create(cmpop.prototype);
        IsNot.prototype.constructor = IsNot;

        function In() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        In.prototype = Object.create(cmpop.prototype);
        In.prototype.constructor = In;

        function NotIn() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        NotIn.prototype = Object.create(cmpop.prototype);
        NotIn.prototype.constructor = NotIn;

        function Call(func, args, keywords) {
            this.func = func;
            this.args = args;
            this.keywords = keywords;
            this._fields = ["func", "args", "keywords"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Call.prototype = Object.create(expr.prototype);
        Call.prototype.constructor = Call;

        function keyword(arg, value) {
            this.arg = arg;
            this.value = value;
            this._fields = ["arg", "value"];
            this._attributes = [];
        };
        keyword.prototype = Object.create(AST.prototype);
        keyword.prototype.constructor = keyword;

        function FormattedValue(value, conversion, format_spec) {
            this.value = value;
            this.conversion = conversion;
            this.format_spec = format_spec;
            this._fields = ["value", "conversion", "format_spec"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        FormattedValue.prototype = Object.create(expr.prototype);
        FormattedValue.prototype.constructor = FormattedValue;

        function JoinedStr(values) {
            this.values = values;
            this._fields = ["values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        JoinedStr.prototype = Object.create(expr.prototype);
        JoinedStr.prototype.constructor = JoinedStr;

        function Constant(value, kind) {
            this.value = value;
            this.kind = kind;
            this._fields = ["value", "kind"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Constant.prototype = Object.create(expr.prototype);
        Constant.prototype.constructor = Constant;

        function Attribute(value, attr, ctx) {
            this.value = value;
            this.attr = attr;
            this.ctx = ctx;
            this._fields = ["value", "attr", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Attribute.prototype = Object.create(expr.prototype);
        Attribute.prototype.constructor = Attribute;

        function Subscript(value, slice, ctx) {
            this.value = value;
            this.slice = slice;
            this.ctx = ctx;
            this._fields = ["value", "slice", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Subscript.prototype = Object.create(expr.prototype);
        Subscript.prototype.constructor = Subscript;

        function slice() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        slice.prototype = Object.create(AST.prototype);
        slice.prototype.constructor = slice;

        function Slice(lower, upper, step) {
            this.lower = lower;
            this.upper = upper;
            this.step = step;
            this._fields = ["lower", "upper", "step"];
            this._attributes = [];
        };
        Slice.prototype = Object.create(slice.prototype);
        Slice.prototype.constructor = Slice;

        function ExtSlice(dims) {
            this.dims = dims;
            this._fields = ["dims"];
            this._attributes = [];
        };
        ExtSlice.prototype = Object.create(slice.prototype);
        ExtSlice.prototype.constructor = ExtSlice;

        function Index(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = [];
        };
        Index.prototype = Object.create(slice.prototype);
        Index.prototype.constructor = Index;

        function Starred(value, ctx) {
            this.value = value;
            this.ctx = ctx;
            this._fields = ["value", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Starred.prototype = Object.create(expr.prototype);
        Starred.prototype.constructor = Starred;

        function Name(id, ctx) {
            this.id = id;
            this.ctx = ctx;
            this._fields = ["id", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Name.prototype = Object.create(expr.prototype);
        Name.prototype.constructor = Name;

        function List(elts, ctx) {
            this.elts = elts;
            this.ctx = ctx;
            this._fields = ["elts", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        List.prototype = Object.create(expr.prototype);
        List.prototype.constructor = List;

        function Tuple(elts, ctx) {
            this.elts = elts;
            this.ctx = ctx;
            this._fields = ["elts", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Tuple.prototype = Object.create(expr.prototype);
        Tuple.prototype.constructor = Tuple;
        var PyCF_ONLY_AST = 1024;
        var PyCF_TYPE_COMMENTS = 4096;
        var PyCF_ALLOW_TOP_LEVEL_AWAIT = 8192;

        function set_end_ast(ast, end_ast) {
            return set_end(ast, end_ast.end_lineno, end_ast.end_col_offset);
        };

        function set_ctx(targets, ctx) {
            for (const g5 of [...Array(targets.length).keys()]) {
                set_ctx1(targets[g5], ctx);
            };
        };

        function set_ctx1(t, ctx) {
            t.ctx = ctx;
            if ((t.constructor.name === 'Tuple')) {
                for (const g6 of [...Array(t.elts.length).keys()]) {
                    t.elts[g6].ctx = ctx;
                };
            };
        };

        function py_parse_file_input(ts) {
            var stmts1 = py_parse_stmts(ts);
            if ((ts.token === ENDMARKER)) {
                py_advance(ts);
            } else {
                return py_syntax_error(ts);
            };
            return new Module(stmts1, []);
        };

        function py_parse_stmts(ts) {
            var asts = [];
            while ([NAME, NUMBER, STRING, NEWLINE, LPAR, LSQB, PLUS, MINUS, STAR, TILDE, ELLIPSIS, FALSE, NONE, TRUE, ASSERT, BREAK, CONTINUE, DEF, DEL, FOR, GLOBAL, IF, IMPORT, LAMBDA, NONLOCAL, NOT, PASS, RAISE, RETURN, WHILE, YIELD, AWAIT].indexOf(ts.token) >= 0) {
                if ((ts.token === NEWLINE)) {
                    py_advance(ts);
                } else {
                    var stmt1 = py_parse_stmt(ts);
                    asts.push(stmt1);
                };
            };
            return asts;
        };

        function py_parse_stmt(ts) {
            if ([NAME, NUMBER, STRING, LPAR, LSQB, PLUS, MINUS, STAR, TILDE, ELLIPSIS, FALSE, NONE, TRUE, ASSERT, BREAK, CONTINUE, DEL, GLOBAL, IMPORT, LAMBDA, NONLOCAL, NOT, PASS, RAISE, RETURN, YIELD, AWAIT].indexOf(ts.token) >= 0) {
                var simple_stmt1 = py_parse_simple_stmt(ts);
                return simple_stmt1;
            } else {
                if ([DEF, IF, WHILE, FOR].indexOf(ts.token) >= 0) {
                    var compound_stmt1 = py_parse_compound_stmt(ts);
                    return compound_stmt1;
                } else {
                    return py_syntax_error(ts);
                };
            };
        };

        function py_parse_simple_stmt(ts) {
            if ([NAME, NUMBER, STRING, LPAR, LSQB, PLUS, MINUS, STAR, TILDE, ELLIPSIS, FALSE, NONE, TRUE, ASSERT, BREAK, CONTINUE, DEL, GLOBAL, IMPORT, LAMBDA, NONLOCAL, NOT, PASS, RAISE, RETURN, YIELD, AWAIT].indexOf(ts.token) >= 0) {
                var small_stmt1 = py_parse_small_stmt(ts);
                if ((ts.token === NEWLINE)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                return small_stmt1;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_compound_stmt(ts) {
            if ((ts.token === IF)) {
                var if_stmt1 = py_parse_if_stmt(ts);
                return if_stmt1;
            } else {
                if ((ts.token === WHILE)) {
                    var while_stmt1 = py_parse_while_stmt(ts);
                    return while_stmt1;
                } else {
                    if ((ts.token === FOR)) {
                        var for_stmt1 = py_parse_for_stmt(ts);
                        return for_stmt1;
                    } else {
                        if ((ts.token === DEF)) {
                            var funcdef1 = py_parse_funcdef(ts);
                            return funcdef1;
                        } else {
                            return py_syntax_error(ts);
                        };
                    };
                };
            };
        };

        function py_parse_small_stmt(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var expr_stmt1 = py_parse_expr_stmt(ts);
                return expr_stmt1;
            } else {
                if ((ts.token === DEL)) {
                    var del_stmt1 = py_parse_del_stmt(ts);
                    return del_stmt1;
                } else {
                    if ((ts.token === PASS)) {
                        var pass_stmt1 = py_parse_pass_stmt(ts);
                        return pass_stmt1;
                    } else {
                        if ([CONTINUE, RAISE, RETURN, YIELD, BREAK].indexOf(ts.token) >= 0) {
                            var flow_stmt1 = py_parse_flow_stmt(ts);
                            return flow_stmt1;
                        } else {
                            if ((ts.token === IMPORT)) {
                                var import_stmt1 = py_parse_import_stmt(ts);
                                return import_stmt1;
                            } else {
                                if ((ts.token === GLOBAL)) {
                                    var global_stmt1 = py_parse_global_stmt(ts);
                                    return global_stmt1;
                                } else {
                                    if ((ts.token === NONLOCAL)) {
                                        var nonlocal_stmt1 = py_parse_nonlocal_stmt(ts);
                                        return nonlocal_stmt1;
                                    } else {
                                        if ((ts.token === ASSERT)) {
                                            var assert_stmt1 = py_parse_assert_stmt(ts);
                                            return assert_stmt1;
                                        } else {
                                            return py_syntax_error(ts);
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        function py_parse_if_stmt(ts) {
            if ((ts.token === IF)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var namedexpr_test1 = py_parse_namedexpr_test(ts);
                if ((ts.token === COLON)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                var suite1 = py_parse_suite(ts);
                var branches = [
                    [lineno, col_offset, namedexpr_test1, suite1]
                ];
                while ((ts.token === ELIF)) {
                    var lineno = get_lineno(ts);
                    var col_offset = get_col_offset(ts);
                    py_advance(ts);
                    var namedexpr_test2 = py_parse_namedexpr_test(ts);
                    if ((ts.token === COLON)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    var suite2 = py_parse_suite(ts);
                    branches.push([lineno, col_offset, namedexpr_test2, suite2]);
                };
                var orelse = [];
                if ((ts.token === ELSE)) {
                    py_advance(ts);
                    if ((ts.token === COLON)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    var suite3 = py_parse_suite(ts);
                    var orelse = suite3;
                };
                while (true) {
                    var branch = branches.pop();
                    var lineno = branch[0];
                    var col_offset = branch[1];
                    var test = branch[2];
                    var body = branch[3];
                    var ast = new If(test, body, orelse);
                    set_start(ast, lineno, col_offset);
                    set_end_ast(ast, ((orelse.length > 0) ? orelse : body).slice((-(1)))[0]);
                    if ((branches.length > 0)) {
                        var orelse = [ast];
                    } else {
                        return ast;
                    };
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_while_stmt(ts) {
            if ((ts.token === WHILE)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var namedexpr_test1 = py_parse_namedexpr_test(ts);
                if ((ts.token === COLON)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                var suite1 = py_parse_suite(ts);
                var suite2 = [];
                if ((ts.token === ELSE)) {
                    py_advance(ts);
                    if ((ts.token === COLON)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    var suite2 = py_parse_suite(ts);
                };
                var ast = new While(namedexpr_test1, suite1, suite2);
                set_start(ast, lineno, col_offset);
                set_end_ast(ast, ((suite2.length > 0) ? suite2 : suite1).slice((-(1)))[0]);
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_for_stmt(ts) {
            if ((ts.token === FOR)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var type_comment = undefined;
                py_advance(ts);
                var as_list = false;
                var exprlist1 = py_parse_exprlist(ts, as_list);
                if ((ts.token === IN)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                var as_list = false;
                var testlist1 = py_parse_testlist(ts, as_list);
                if ((ts.token === COLON)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                if ((ts.token === TYPE_COMMENT)) {
                    py_advance(ts);
                };
                var suite1 = py_parse_suite(ts);
                var suite2 = [];
                if ((ts.token === ELSE)) {
                    py_advance(ts);
                    if ((ts.token === COLON)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    var suite2 = py_parse_suite(ts);
                };
                set_ctx1(exprlist1, new Store());
                var ast = new For(exprlist1, testlist1, suite1, suite2, type_comment);
                set_start(ast, lineno, col_offset);
                set_end_ast(ast, ((suite2.length > 0) ? suite2 : suite1).slice((-(1)))[0]);
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_funcdef(ts) {
            if ((ts.token === DEF)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var type_comment = undefined;
                py_advance(ts);
                if ((ts.token === NAME)) {
                    var name = token(ts);
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                var parameters1 = py_parse_parameters(ts);
                if ((ts.token === MINUS)) {
                    py_advance(ts);
                    var test1 = py_parse_test(ts);
                };
                if ((ts.token === COLON)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                if ((ts.token === TYPE_COMMENT)) {
                    py_advance(ts);
                };
                var func_body_suite1 = py_parse_func_body_suite(ts);
                var ast = new FunctionDef(name, parameters1, func_body_suite1, [], undefined, type_comment);
                set_start(ast, lineno, col_offset);
                set_end_ast(ast, func_body_suite1.slice((-(1)))[0]);
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_expr_stmt(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var testlist_star_expr1 = py_parse_testlist_star_expr(ts);
                var targets = [testlist_star_expr1];
                var type_comment = undefined;
                if ((ts.token === COLON)) {
                    var annassign1 = py_parse_annassign(ts);
                } else {
                    if ([PLUSEQUAL, MINEQUAL, STAREQUAL, SLASHEQUAL, PERCENTEQUAL, AMPEREQUAL, VBAREQUAL, CIRCUMFLEXEQUAL, LEFTSHIFTEQUAL, RIGHTSHIFTEQUAL, DOUBLESTAREQUAL, DOUBLESLASHEQUAL, ATEQUAL].indexOf(ts.token) >= 0) {
                        var augassign1 = py_parse_augassign(ts);
                        if ((ts.token === YIELD)) {
                            var yield_expr1 = py_parse_yield_expr(ts);
                        } else {
                            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                                var as_list = false;
                                var testlist1 = py_parse_testlist(ts, as_list);
                            } else {
                                return py_syntax_error(ts);
                            };
                        };
                    } else {
                        if ((ts.token === EQUAL)) {
                            while (true) {
                                py_advance(ts);
                                if ((ts.token === YIELD)) {
                                    var yield_expr2 = py_parse_yield_expr(ts);
                                } else {
                                    if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                                        var testlist_star_expr2 = py_parse_testlist_star_expr(ts);
                                    } else {
                                        return py_syntax_error(ts);
                                    };
                                };
                                if ((!((ts.token === EQUAL)))) {
                                    break;
                                };
                            };
                            var ast = new Assign(targets, testlist_star_expr2, type_comment);
                            set_ctx(targets, new Store());
                            return set_start_end(ts, lineno, col_offset, ast);
                            if ((ts.token === TYPE_COMMENT)) {
                                py_advance(ts);
                            };
                        };
                        var ast = new Expr(testlist_star_expr1);
                        return set_start_end(ts, lineno, col_offset, ast);
                    };
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_del_stmt(ts) {
            if ((ts.token === DEL)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var as_list = true;
                var exprlist1 = py_parse_exprlist(ts, as_list);
                var ast = new Delete(exprlist1[0]);
                set_ctx(exprlist1[0], new Del());
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_pass_stmt(ts) {
            if ((ts.token === PASS)) {
                var ast = set_start_end_1token(ts, new Pass());
                py_advance(ts);
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_flow_stmt(ts) {
            if ((ts.token === BREAK)) {
                var break_stmt1 = py_parse_break_stmt(ts);
                return break_stmt1;
            } else {
                if ((ts.token === CONTINUE)) {
                    var continue_stmt1 = py_parse_continue_stmt(ts);
                    return continue_stmt1;
                } else {
                    if ((ts.token === RETURN)) {
                        var return_stmt1 = py_parse_return_stmt(ts);
                        return return_stmt1;
                    } else {
                        if ((ts.token === RAISE)) {
                            var raise_stmt1 = py_parse_raise_stmt(ts);
                            return raise_stmt1;
                        } else {
                            if ((ts.token === YIELD)) {
                                var yield_stmt1 = py_parse_yield_stmt(ts);
                                return yield_stmt1;
                            } else {
                                return py_syntax_error(ts);
                            };
                        };
                    };
                };
            };
        };

        function py_parse_import_stmt(ts) {
            if ((ts.token === IMPORT)) {
                var import_name1 = py_parse_import_name(ts);
                return import_name1;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_global_stmt(ts) {
            if ((ts.token === GLOBAL)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                if ((ts.token === NAME)) {
                    var names = [token(ts)];
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((ts.token === NAME)) {
                        names.push(token(ts));
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                };
                var ast = new Global(names);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_nonlocal_stmt(ts) {
            if ((ts.token === NONLOCAL)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                if ((ts.token === NAME)) {
                    var names = [token(ts)];
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((ts.token === NAME)) {
                        names.push(token(ts));
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                };
                var ast = new Nonlocal(names);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_assert_stmt(ts) {
            if ((ts.token === ASSERT)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var test1 = py_parse_test(ts);
                var msg = undefined;
                if ((ts.token === COMMA)) {
                    py_advance(ts);
                    var test2 = py_parse_test(ts);
                    var msg = test2;
                };
                var ast = new Assert(test1, msg);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_namedexpr_test(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var test1 = py_parse_test(ts);
                var test2 = undefined;
                if ((ts.token === COLONEQUAL)) {
                    py_advance(ts);
                    var test2 = py_parse_test(ts);
                };
                if (Object.is(test2, undefined)) {
                    return test1;
                } else {
                    return test2;
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_suite(ts) {
            if ([NAME, NUMBER, STRING, LPAR, LSQB, PLUS, MINUS, STAR, TILDE, ELLIPSIS, FALSE, NONE, TRUE, ASSERT, BREAK, CONTINUE, DEL, GLOBAL, IMPORT, LAMBDA, NONLOCAL, NOT, PASS, RAISE, RETURN, YIELD, AWAIT].indexOf(ts.token) >= 0) {
                var simple_stmt1 = py_parse_simple_stmt(ts);
                return [simple_stmt1];
            } else {
                if ((ts.token === NEWLINE)) {
                    py_advance(ts);
                    if ((ts.token === INDENT)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    var stmts = [];
                    while (true) {
                        var stmt1 = py_parse_stmt(ts);
                        stmts.push(stmt1);
                        if ((!([NAME, NUMBER, STRING, LPAR, LSQB, PLUS, MINUS, STAR, TILDE, ELLIPSIS, FALSE, NONE, TRUE, ASSERT, BREAK, CONTINUE, DEF, DEL, FOR, GLOBAL, IF, IMPORT, LAMBDA, NONLOCAL, NOT, PASS, RAISE, RETURN, WHILE, YIELD, AWAIT].indexOf(ts.token) >= 0))) {
                            break;
                        };
                    };
                    if ((ts.token === DEDENT)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    return stmts;
                } else {
                    return py_syntax_error(ts);
                };
            };
        };

        function py_parse_exprlist(ts, as_list) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, STAR, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                    var expr1 = py_parse_expr(ts);
                    var expr_or_star_expr1 = expr1;
                } else {
                    var star_expr1 = py_parse_star_expr(ts);
                    var expr_or_star_expr1 = star_expr1;
                };
                var exprs = [expr_or_star_expr1];
                var dangling_comma = false;
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((!([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, STAR, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0))) {
                        var dangling_comma = true;
                        break;
                    };
                    if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                        var expr2 = py_parse_expr(ts);
                        var expr_or_star_expr2 = expr2;
                    } else {
                        if ((ts.token === STAR)) {
                            var star_expr2 = py_parse_star_expr(ts);
                            var expr_or_star_expr2 = star_expr2;
                        } else {
                            return py_syntax_error(ts);
                        };
                    };
                    exprs.push(expr_or_star_expr2);
                };
                if (as_list) {
                    return [exprs, ((dangling_comma) || ((exprs.length !== 1)))];
                } else {
                    if ((((exprs.length === 1)) && ((!(dangling_comma))))) {
                        return expr_or_star_expr1;
                    } else {
                        var ast = new Tuple(exprs, new Load());
                        return set_start_end(ts, lineno, col_offset, ast);
                    };
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_testlist(ts, as_list) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var test1 = py_parse_test(ts);
                var tests = [test1];
                var dangling_comma = false;
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((!([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0))) {
                        var dangling_comma = true;
                        break;
                    };
                    var test2 = py_parse_test(ts);
                    tests.push(test2);
                };
                if (as_list) {
                    return [tests, ((dangling_comma) || ((tests.length !== 1)))];
                } else {
                    if ((((tests.length === 1)) && ((!(dangling_comma))))) {
                        return test1;
                    } else {
                        var ast = new Tuple(tests, new Load());
                        return set_start_end(ts, lineno, col_offset, ast);
                    };
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_parameters(ts) {
            if ((ts.token === LPAR)) {
                py_advance(ts);
                var typedargslist1 = undefined;
                if ((ts.token === NAME)) {
                    var typedargslist1 = py_parse_typedargslist(ts);
                };
                if ((ts.token === RPAR)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                if (Object.is(typedargslist1, undefined)) {
                    return new aarguments([], [], undefined, [], [], undefined, []);
                } else {
                    return typedargslist1;
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_test(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var or_test1 = py_parse_or_test(ts);
                if ((ts.token === IF)) {
                    py_advance(ts);
                    var or_test2 = py_parse_or_test(ts);
                    if ((ts.token === ELSE)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    var test1 = py_parse_test(ts);
                    var ast = new IfExp(or_test2, or_test1, test1);
                    return set_start_end(ts, lineno, col_offset, ast);
                };
                return or_test1;
            } else {
                if ((ts.token === LAMBDA)) {
                    var lambdef1 = py_parse_lambdef(ts);
                    return lambdef1;
                } else {
                    return py_syntax_error(ts);
                };
            };
        };

        function py_parse_func_body_suite(ts) {
            if ([NAME, NUMBER, STRING, LPAR, LSQB, PLUS, MINUS, STAR, TILDE, ELLIPSIS, FALSE, NONE, TRUE, ASSERT, BREAK, CONTINUE, DEL, GLOBAL, IMPORT, LAMBDA, NONLOCAL, NOT, PASS, RAISE, RETURN, YIELD, AWAIT].indexOf(ts.token) >= 0) {
                var simple_stmt1 = py_parse_simple_stmt(ts);
                return [simple_stmt1];
            } else {
                if ((ts.token === NEWLINE)) {
                    py_advance(ts);
                    if ((ts.token === TYPE_COMMENT)) {
                        py_advance(ts);
                        if ((ts.token === NEWLINE)) {
                            py_advance(ts);
                        } else {
                            return py_syntax_error(ts);
                        };
                    };
                    if ((ts.token === INDENT)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    var stmts = [];
                    while (true) {
                        var stmt1 = py_parse_stmt(ts);
                        stmts.push(stmt1);
                        if ((!([NAME, NUMBER, STRING, LPAR, LSQB, PLUS, MINUS, STAR, TILDE, ELLIPSIS, FALSE, NONE, TRUE, ASSERT, BREAK, CONTINUE, DEF, DEL, FOR, GLOBAL, IF, IMPORT, LAMBDA, NONLOCAL, NOT, PASS, RAISE, RETURN, WHILE, YIELD, AWAIT].indexOf(ts.token) >= 0))) {
                            break;
                        };
                    };
                    if ((ts.token === DEDENT)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    return stmts;
                } else {
                    return py_syntax_error(ts);
                };
            };
        };

        function py_parse_testlist_star_expr(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    var test1 = py_parse_test(ts);
                    var test_or_star_expr1 = test1;
                } else {
                    var star_expr1 = py_parse_star_expr(ts);
                    var test_or_star_expr1 = star_expr1;
                };
                var tests = [test_or_star_expr1];
                var dangling_comma = false;
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((!([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0))) {
                        var dangling_comma = true;
                        break;
                    };
                    if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                        var test2 = py_parse_test(ts);
                        tests.push(test2);
                    } else {
                        if ((ts.token === STAR)) {
                            var star_expr2 = py_parse_star_expr(ts);
                            tests.push(star_expr2);
                        } else {
                            return py_syntax_error(ts);
                        };
                    };
                };
                if ((((tests.length === 1)) && ((!(dangling_comma))))) {
                    return test_or_star_expr1;
                } else {
                    var ast = new Tuple(tests, new Load());
                    return set_start_end(ts, lineno, col_offset, ast);
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_annassign(ts) {
            if ((ts.token === COLON)) {
                py_advance(ts);
                var test1 = py_parse_test(ts);
                if ((ts.token === EQUAL)) {
                    py_advance(ts);
                    if ((ts.token === YIELD)) {
                        var yield_expr1 = py_parse_yield_expr(ts);
                    } else {
                        if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                            var testlist1 = py_parse_testlist(ts, as_list);
                        } else {
                            return py_syntax_error(ts);
                        };
                    };
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_augassign(ts) {
            if ((ts.token === PLUSEQUAL)) {
                py_advance(ts);
                return new Add();
            } else {
                if ((ts.token === MINEQUAL)) {
                    py_advance(ts);
                    return new Sub();
                } else {
                    if ((ts.token === STAREQUAL)) {
                        py_advance(ts);
                        return new Mult();
                    } else {
                        if ((ts.token === ATEQUAL)) {
                            py_advance(ts);
                            return new MatMult();
                        } else {
                            if ((ts.token === SLASHEQUAL)) {
                                py_advance(ts);
                                return new Div();
                            } else {
                                if ((ts.token === PERCENTEQUAL)) {
                                    py_advance(ts);
                                    return new Mod();
                                } else {
                                    if ((ts.token === AMPEREQUAL)) {
                                        py_advance(ts);
                                        return new BitAnd();
                                    } else {
                                        if ((ts.token === VBAREQUAL)) {
                                            py_advance(ts);
                                            return new BitOr();
                                        } else {
                                            if ((ts.token === CIRCUMFLEXEQUAL)) {
                                                py_advance(ts);
                                                return new BitXor();
                                            } else {
                                                if ((ts.token === LEFTSHIFTEQUAL)) {
                                                    py_advance(ts);
                                                    return new LShift();
                                                } else {
                                                    if ((ts.token === RIGHTSHIFTEQUAL)) {
                                                        py_advance(ts);
                                                        return new RShift();
                                                    } else {
                                                        if ((ts.token === DOUBLESTAREQUAL)) {
                                                            py_advance(ts);
                                                            return new Pow();
                                                        } else {
                                                            if ((ts.token === DOUBLESLASHEQUAL)) {
                                                                py_advance(ts);
                                                                return new FloorDiv();
                                                            } else {
                                                                return py_syntax_error(ts);
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        function py_parse_yield_expr(ts) {
            if ((ts.token === YIELD)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, FROM, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    var yield_arg1 = py_parse_yield_arg(ts, lineno, col_offset);
                    return yield_arg1;
                };
                var ast = new Yield(undefined);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_break_stmt(ts) {
            if ((ts.token === BREAK)) {
                var ast = set_start_end_1token(ts, new Break());
                py_advance(ts);
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_continue_stmt(ts) {
            if ((ts.token === CONTINUE)) {
                var ast = set_start_end_1token(ts, new Continue());
                py_advance(ts);
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_return_stmt(ts) {
            if ((ts.token === RETURN)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var value = undefined;
                py_advance(ts);
                if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    var testlist_star_expr1 = py_parse_testlist_star_expr(ts);
                    var value = testlist_star_expr1;
                };
                var ast = new Return(value);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_raise_stmt(ts) {
            if ((ts.token === RAISE)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var exc = undefined;
                var cause = undefined;
                py_advance(ts);
                if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    var test1 = py_parse_test(ts);
                    var exc = test1;
                    if ((ts.token === FROM)) {
                        py_advance(ts);
                        var test2 = py_parse_test(ts);
                        var cause = test2;
                    };
                };
                var ast = new Raise(exc, cause);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_yield_stmt(ts) {
            if ((ts.token === YIELD)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var yield_expr1 = py_parse_yield_expr(ts);
                var ast = new Expr(yield_expr1);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_import_name(ts) {
            if ((ts.token === IMPORT)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var dotted_as_names1 = py_parse_dotted_as_names(ts);
                var ast = new Import(dotted_as_names1);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_expr(ts) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var xor_expr1 = py_parse_xor_expr(ts);
                var ast = xor_expr1;
                while ((ts.token === VBAR)) {
                    py_advance(ts);
                    var xor_expr2 = py_parse_xor_expr(ts);
                    var ast = new BinOp(ast, new BitOr(), xor_expr2);
                    set_start_end(ts, lineno, col_offset, ast);
                };
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_star_expr(ts) {
            if ((ts.token === STAR)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var expr1 = py_parse_expr(ts);
                var ast = new Starred(expr1, new Load());
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_typedargslist(ts) {
            if ((ts.token === NAME)) {
                var a = new arg(token(ts), undefined, undefined);
                set_start_end_1token(ts, a);
                var args = [a];
                py_advance(ts);
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((ts.token === NAME)) {
                        var a = new arg(token(ts), undefined, undefined);
                        set_start_end_1token(ts, a);
                        args.push(a);
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                };
                return new aarguments(args, [], undefined, [], [], undefined, []);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_or_test(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var and_test1 = py_parse_and_test(ts);
                var asts = [and_test1];
                while ((ts.token === OR)) {
                    py_advance(ts);
                    var and_test2 = py_parse_and_test(ts);
                    asts.push(and_test2);
                };
                if ((asts.length === 1)) {
                    return asts[0];
                } else {
                    var ast = new BoolOp(new Or(), asts);
                    return set_start_end(ts, lineno, col_offset, ast);
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_lambdef(ts) {
            if ((ts.token === LAMBDA)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var args = undefined;
                py_advance(ts);
                if ((ts.token === NAME)) {
                    var varargslist1 = py_parse_varargslist(ts);
                    var args = varargslist1;
                };
                if ((ts.token === COLON)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                var test1 = py_parse_test(ts);
                if (Object.is(args, undefined)) {
                    var args = new aarguments([], [], undefined, [], [], undefined, []);
                };
                var ast = new Lambda(args, test1);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_yield_arg(ts, lineno, col_offset) {
            if ((ts.token === FROM)) {
                py_advance(ts);
                var test1 = py_parse_test(ts);
                var ast = new YieldFrom(test1);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, STAR, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    var testlist_star_expr1 = py_parse_testlist_star_expr(ts);
                    var ast = new Yield(testlist_star_expr1);
                    return set_start_end(ts, lineno, col_offset, ast);
                } else {
                    return py_syntax_error(ts);
                };
            };
        };

        function py_parse_dotted_as_names(ts) {
            if ((ts.token === NAME)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var dotted_as_name1 = py_parse_dotted_as_name(ts);
                var names = [dotted_as_name1];
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    var dotted_as_name2 = py_parse_dotted_as_name(ts);
                    names.push(dotted_as_name2);
                };
                return names;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_xor_expr(ts) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var and_expr1 = py_parse_and_expr(ts);
                var ast = and_expr1;
                while ((ts.token === CIRCUMFLEX)) {
                    py_advance(ts);
                    var and_expr2 = py_parse_and_expr(ts);
                    var ast = new BinOp(ast, new BitXor(), and_expr2);
                    set_start_end(ts, lineno, col_offset, ast);
                };
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_and_test(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var not_test1 = py_parse_not_test(ts);
                var asts = [not_test1];
                while ((ts.token === AND)) {
                    py_advance(ts);
                    var not_test2 = py_parse_not_test(ts);
                    asts.push(not_test2);
                };
                if ((asts.length === 1)) {
                    return asts[0];
                } else {
                    var ast = new BoolOp(new And(), asts);
                    return set_start_end(ts, lineno, col_offset, ast);
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_varargslist(ts) {
            if ((ts.token === NAME)) {
                var a = new arg(token(ts), undefined, undefined);
                set_start_end_1token(ts, a);
                var args = [a];
                py_advance(ts);
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((ts.token === NAME)) {
                        var a = new arg(token(ts), undefined, undefined);
                        set_start_end_1token(ts, a);
                        args.push(a);
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                };
                return new aarguments(args, [], undefined, [], [], undefined, []);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_dotted_as_name(ts) {
            if ((ts.token === NAME)) {
                var dotted_name1 = py_parse_dotted_name(ts);
                var asname = undefined;
                if ((ts.token === AS)) {
                    py_advance(ts);
                    if ((ts.token === NAME)) {
                        var asname = token(ts);
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                };
                return new alias(dotted_name1, asname);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_and_expr(ts) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var shift_expr1 = py_parse_shift_expr(ts);
                var ast = shift_expr1;
                while ((ts.token === AMPER)) {
                    py_advance(ts);
                    var shift_expr2 = py_parse_shift_expr(ts);
                    var ast = new BinOp(ast, new BitAnd(), shift_expr2);
                    set_start_end(ts, lineno, col_offset, ast);
                };
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_not_test(ts) {
            if ((ts.token === NOT)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var not_test1 = py_parse_not_test(ts);
                var ast = new UnaryOp(new Not(), not_test1);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                    var comparison1 = py_parse_comparison(ts);
                    return comparison1;
                } else {
                    return py_syntax_error(ts);
                };
            };
        };

        function py_parse_dotted_name(ts) {
            if ((ts.token === NAME)) {
                var dotted_name = token(ts);
                py_advance(ts);
                while ((ts.token === DOT)) {
                    py_advance(ts);
                    if ((ts.token === NAME)) {
                        var dotted_name = ((dotted_name + ".") + token(ts));
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                };
                return dotted_name;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_shift_expr(ts) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var arith_expr1 = py_parse_arith_expr(ts);
                var ast = arith_expr1;
                while ([LEFTSHIFT, RIGHTSHIFT].indexOf(ts.token) >= 0) {
                    if ((ts.token === LEFTSHIFT)) {
                        var op = new LShift();
                    } else {
                        var op = new RShift();
                    };
                    py_advance(ts);
                    var arith_expr2 = py_parse_arith_expr(ts);
                    var ast = new BinOp(ast, op, arith_expr2);
                    set_start_end(ts, lineno, col_offset, ast);
                };
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_comparison(ts) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var expr1 = py_parse_expr(ts);
                var ops = [];
                var comparators = [];
                while ([IN, IS, NOT, LESS, GREATER, EQEQUAL, NOTEQUAL, LESSEQUAL, GREATEREQUAL].indexOf(ts.token) >= 0) {
                    var comp_op1 = py_parse_comp_op(ts);
                    var expr2 = py_parse_expr(ts);
                    ops.push(comp_op1);
                    comparators.push(expr2);
                };
                if ((ops.length === 0)) {
                    return expr1;
                } else {
                    var ast = new Compare(expr1, ops, comparators);
                    return set_start_end(ts, lineno, col_offset, ast);
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_arith_expr(ts) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var term1 = py_parse_term(ts);
                var ast = term1;
                while ([PLUS, MINUS].indexOf(ts.token) >= 0) {
                    if ((ts.token === PLUS)) {
                        var op = new Add();
                    } else {
                        var op = new Sub();
                    };
                    py_advance(ts);
                    var term2 = py_parse_term(ts);
                    var ast = new BinOp(ast, op, term2);
                    set_start_end(ts, lineno, col_offset, ast);
                };
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_comp_op(ts) {
            if ((ts.token === LESS)) {
                py_advance(ts);
                return new Lt();
            } else {
                if ((ts.token === GREATER)) {
                    py_advance(ts);
                    return new Gt();
                } else {
                    if ((ts.token === EQEQUAL)) {
                        py_advance(ts);
                        return new Eq();
                    } else {
                        if ((ts.token === GREATEREQUAL)) {
                            py_advance(ts);
                            return new GtE();
                        } else {
                            if ((ts.token === LESSEQUAL)) {
                                py_advance(ts);
                                return new LtE();
                            } else {
                                if ((ts.token === NOTEQUAL)) {
                                    py_advance(ts);
                                    return new NotEq();
                                } else {
                                    if (false) {
                                        py_advance(ts);
                                        return new NotEq();
                                    } else {
                                        if ((ts.token === IN)) {
                                            py_advance(ts);
                                            return new In();
                                        } else {
                                            if ((ts.token === NOT)) {
                                                py_advance(ts);
                                                if ((ts.token === IN)) {
                                                    py_advance(ts);
                                                } else {
                                                    return py_syntax_error(ts);
                                                };
                                                return new NotIn();
                                            } else {
                                                if ((ts.token === IS)) {
                                                    py_advance(ts);
                                                    if ((ts.token === NOT)) {
                                                        py_advance(ts);
                                                        return new IsNot();
                                                    };
                                                    return new Is();
                                                } else {
                                                    return py_syntax_error(ts);
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        function py_parse_term(ts) {
            if ([TILDE, NAME, NUMBER, STRING, AWAIT, LPAR, LSQB, PLUS, MINUS, ELLIPSIS, FALSE, NONE, TRUE].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var factor1 = py_parse_factor(ts);
                var ast = factor1;
                while ([STAR, SLASH, AT, DOUBLESLASH, PERCENT].indexOf(ts.token) >= 0) {
                    if ((ts.token === STAR)) {
                        var op = new Mult();
                    } else {
                        if ((ts.token === SLASH)) {
                            var op = new Div();
                        } else {
                            if ((ts.token === AT)) {
                                var op = new MatMult();
                            } else {
                                if ((ts.token === DOUBLESLASH)) {
                                    var op = new FloorDiv();
                                } else {
                                    var op = new Mod();
                                };
                            };
                        };
                    };
                    py_advance(ts);
                    var factor2 = py_parse_factor(ts);
                    var ast = new BinOp(ast, op, factor2);
                    set_start_end(ts, lineno, col_offset, ast);
                };
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_factor(ts) {
            if ([TILDE, PLUS, MINUS].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                if ((ts.token === PLUS)) {
                    var op = new UAdd();
                } else {
                    if ((ts.token === MINUS)) {
                        var op = new USub();
                    } else {
                        var op = new Invert();
                    };
                };
                py_advance(ts);
                var factor1 = py_parse_factor(ts);
                var ast = new UnaryOp(op, factor1);
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                if ([NAME, NUMBER, STRING, TRUE, LPAR, LSQB, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    var power1 = py_parse_power(ts);
                    return power1;
                } else {
                    return py_syntax_error(ts);
                };
            };
        };

        function py_parse_power(ts) {
            if ([NAME, NUMBER, STRING, TRUE, LPAR, LSQB, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var atom_expr1 = py_parse_atom_expr(ts);
                if ((ts.token === DOUBLESTAR)) {
                    py_advance(ts);
                    var factor1 = py_parse_factor(ts);
                    var ast = new BinOp(atom_expr1, new Pow(), factor1);
                    return set_start_end(ts, lineno, col_offset, ast);
                };
                return atom_expr1;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_atom_expr(ts) {
            if ([NAME, NUMBER, STRING, TRUE, LPAR, LSQB, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var has_await = false;
                if ((ts.token === AWAIT)) {
                    var has_await = true;
                    py_advance(ts);
                };
                var atom1 = py_parse_atom(ts);
                var ast = atom1;
                while ([LSQB, LPAR, DOT].indexOf(ts.token) >= 0) {
                    var trailer1 = py_parse_trailer(ts, lineno, col_offset, ast);
                    var ast = trailer1;
                };
                if (has_await) {
                    var ast = new Await(ast);
                    set_start_end(ts, lineno, col_offset, ast);
                };
                return ast;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_atom(ts) {
            if ((ts.token === LPAR)) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                py_advance(ts);
                var x = [
                    [], true
                ];
                if ([TILDE, NAME, NUMBER, STRING, FALSE, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, YIELD, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    if ((ts.token === YIELD)) {
                        var yield_expr1 = py_parse_yield_expr(ts);
                        var x = [
                            [yield_expr1], false
                        ];
                    } else {
                        var as_list = true;
                        var testlist_comp1 = py_parse_testlist_comp(ts, as_list);
                        var x = testlist_comp1;
                    };
                };
                if ((ts.token === RPAR)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                if (x[1]) {
                    var ast = new Tuple(x[0], new Load());
                    set_start_end(ts, lineno, col_offset, ast);
                } else {
                    var ast = x[0][0];
                };
                return ast;
            } else {
                if ((ts.token === LSQB)) {
                    var lineno = get_lineno(ts);
                    var col_offset = get_col_offset(ts);
                    py_advance(ts);
                    var ast = undefined;
                    if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                        var as_list = true;
                        var testlist_comp1 = py_parse_testlist_comp(ts, as_list);
                        var ast = new List(testlist_comp1[0], new Load());
                    };
                    if ((ts.token === RSQB)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    if (Object.is(ast, undefined)) {
                        var ast = new List([], new Load());
                    };
                    return set_start_end(ts, lineno, col_offset, ast);
                } else {
                    if ((ts.token === NAME)) {
                        var ast = set_start_end_1token(ts, new Name(token(ts), new Load()));
                        py_advance(ts);
                        return ast;
                    } else {
                        if ((ts.token === NUMBER)) {
                            var ast = set_start_end_1token(ts, new Constant(Number(token(ts)), undefined));
                            py_advance(ts);
                            return ast;
                        } else {
                            if ((ts.token === STRING)) {
                                var lineno = get_lineno(ts);
                                var col_offset = get_col_offset(ts);
                                var end_lineno = 0;
                                var end_col_offset = 0;
                                var value = "";
                                while (true) {
                                    var end_lineno = get_end_lineno(ts);
                                    var end_col_offset = get_end_col_offset(ts);
                                    value += token(ts).slice(1, (-(1)));
                                    py_advance(ts);
                                    if ((!((ts.token === STRING)))) {
                                        break;
                                    };
                                };
                                var ast = new Constant(value, undefined);
                                ast.lineno = lineno;
                                ast.col_offset = col_offset;
                                ast.end_lineno = end_lineno;
                                ast.end_col_offset = end_col_offset;
                                return ast;
                            } else {
                                if ((ts.token === ELLIPSIS)) {
                                    var ast = set_start_end_1token(ts, new Constant(ELLIPSIS, undefined));
                                    py_advance(ts);
                                    return ast;
                                } else {
                                    if ((ts.token === NONE)) {
                                        var ast = set_start_end_1token(ts, new Constant(undefined, undefined));
                                        py_advance(ts);
                                        return ast;
                                    } else {
                                        if ((ts.token === TRUE)) {
                                            var ast = set_start_end_1token(ts, new Constant(true, undefined));
                                            py_advance(ts);
                                            return ast;
                                        } else {
                                            if ((ts.token === FALSE)) {
                                                var ast = set_start_end_1token(ts, new Constant(false, undefined));
                                                py_advance(ts);
                                                return ast;
                                            } else {
                                                return py_syntax_error(ts);
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        function py_parse_trailer(ts, lineno, col_offset, ast) {
            if ((ts.token === LPAR)) {
                py_advance(ts);
                var arglist1 = [];
                if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                    var arglist1 = py_parse_arglist(ts);
                };
                var ast = new Call(ast, arglist1, []);
                if ((ts.token === RPAR)) {
                    py_advance(ts);
                } else {
                    return py_syntax_error(ts);
                };
                return set_start_end(ts, lineno, col_offset, ast);
            } else {
                if ((ts.token === LSQB)) {
                    py_advance(ts);
                    var subscriptlist1 = py_parse_subscriptlist(ts);
                    var ast = new Subscript(ast, new Index(subscriptlist1), new Load());
                    if ((ts.token === RSQB)) {
                        py_advance(ts);
                    } else {
                        return py_syntax_error(ts);
                    };
                    return set_start_end(ts, lineno, col_offset, ast);
                } else {
                    if ((ts.token === DOT)) {
                        py_advance(ts);
                        if ((ts.token === NAME)) {
                            var ast = new Attribute(ast, token(ts), new Load());
                            py_advance(ts);
                        } else {
                            return py_syntax_error(ts);
                        };
                        return set_start_end(ts, lineno, col_offset, ast);
                    } else {
                        return py_syntax_error(ts);
                    };
                };
            };
        };

        function py_parse_testlist_comp(ts, as_list) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var testlist1 = py_parse_testlist(ts, as_list);
                return testlist1;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_arglist(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var argument1 = py_parse_argument(ts);
                var args = [argument1];
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((!([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0))) {
                        break;
                    };
                    var argument2 = py_parse_argument(ts);
                    args.push(argument2);
                };
                return args;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_subscriptlist(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var lineno = get_lineno(ts);
                var col_offset = get_col_offset(ts);
                var subscript1 = py_parse_subscript(ts);
                var subscripts = [subscript1];
                var dangling_comma = false;
                while ((ts.token === COMMA)) {
                    py_advance(ts);
                    if ((!([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0))) {
                        var dangling_comma = true;
                        break;
                    };
                    var subscript2 = py_parse_subscript(ts);
                    subscripts.push(subscript2);
                };
                if ((((subscripts.length === 1)) && ((!(dangling_comma))))) {
                    return subscript1;
                } else {
                    var ast = new Tuple(subscripts, new Load());
                    return set_start_end(ts, lineno, col_offset, ast);
                };
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_argument(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var test1 = py_parse_test(ts);
                return test1;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse_subscript(ts) {
            if ([TILDE, NAME, NUMBER, STRING, TRUE, LPAR, LSQB, PLUS, MINUS, NOT, LAMBDA, ELLIPSIS, FALSE, NONE, AWAIT].indexOf(ts.token) >= 0) {
                var test1 = py_parse_test(ts);
                return test1;
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_parse(source) {
            init_stats();
            var ts = new TokenizerState(source);
            py_advance(ts);
            if (true) {
                return py_parse_file_input(ts);
            } else {
                return py_syntax_error(ts);
            };
        };

        function py_syntax_error(ts) {
            var line_num = ts.line_num;
            var line_start = 0;
            while ((line_num > 0)) {
                var line_start = (1 + ts.buf.indexOf("\n", line_start));
                line_num -= 1;
            };
            var line_end = ts.buf.indexOf("\n", line_start);
            var line = source(ts, line_start, line_end);
            var stripped_line = line.lstrip();
            console.log(((("  File \"" + "unknown.py") + "\", line ") + (ts.line_num + 1).toString()));
            console.log(("    " + stripped_line));
            console.log((("    " + " ".repeat(((ts.start - line_start) - (line.length - stripped_line.length)))) + "^"));
            throw ("invalid syntax");
        };

        function py_advance(ts) {
            ts.prev_end_lineno = get_end_lineno(ts);
            ts.prev_end_col_offset = get_end_col_offset(ts);
            get_token(ts);
        };

        function py_tokenset() {
            return elements;
        };

        function py_show_token(ts) {
            var t = ts.token;
            var name = tok_name[t];
            if ((((t === NAME)) || ((t === STRING)) || ((t === NUMBER)))) {
                console.log(((name + " ") + token(ts)));
            } else {
                console.log(name);
            };
        };

        function AST() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };

        function mod() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        mod.prototype = Object.create(AST.prototype);
        mod.prototype.constructor = mod;

        function Module(body, type_ignores) {
            this.body = body;
            this.type_ignores = type_ignores;
            this._fields = ["body", "type_ignores"];
            this._attributes = [];
        };
        Module.prototype = Object.create(mod.prototype);
        Module.prototype.constructor = Module;

        function type_ignore() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        type_ignore.prototype = Object.create(AST.prototype);
        type_ignore.prototype.constructor = type_ignore;

        function TypeIgnore(lineno, tag) {
            this.lineno = lineno;
            this.tag = tag;
            this._fields = ["lineno", "tag"];
            this._attributes = [];
        };
        TypeIgnore.prototype = Object.create(type_ignore.prototype);
        TypeIgnore.prototype.constructor = TypeIgnore;

        function Interactive(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Interactive.prototype = Object.create(mod.prototype);
        Interactive.prototype.constructor = Interactive;

        function Expression(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Expression.prototype = Object.create(mod.prototype);
        Expression.prototype.constructor = Expression;

        function FunctionType(argtypes, returns) {
            this.argtypes = argtypes;
            this.returns = returns;
            this._fields = ["argtypes", "returns"];
            this._attributes = [];
        };
        FunctionType.prototype = Object.create(mod.prototype);
        FunctionType.prototype.constructor = FunctionType;

        function Suite(body) {
            this.body = body;
            this._fields = ["body"];
            this._attributes = [];
        };
        Suite.prototype = Object.create(mod.prototype);
        Suite.prototype.constructor = Suite;

        function stmt() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        stmt.prototype = Object.create(AST.prototype);
        stmt.prototype.constructor = stmt;

        function FunctionDef(name, args, body, decorator_list, returns, type_comment) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.returns = returns;
            this.type_comment = type_comment;
            this._fields = ["name", "args", "body", "decorator_list", "returns", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        FunctionDef.prototype = Object.create(stmt.prototype);
        FunctionDef.prototype.constructor = FunctionDef;

        function aarguments(args, posonlyargs, vararg, kwonlyargs, kw_defaults, kwarg, defaults) {
            this.args = args;
            this.posonlyargs = posonlyargs;
            this.vararg = vararg;
            this.kwonlyargs = kwonlyargs;
            this.kw_defaults = kw_defaults;
            this.kwarg = kwarg;
            this.defaults = defaults;
            this._fields = ["posonlyargs", "args", "vararg", "kwonlyargs", "kw_defaults", "kwarg", "defaults"];
            this._attributes = [];
        };
        aarguments.prototype = Object.create(AST.prototype);
        aarguments.prototype.constructor = aarguments;

        function arg(arg, annotation, type_comment) {
            this.arg = arg;
            this.annotation = annotation;
            this.type_comment = type_comment;
            this._fields = ["arg", "annotation", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        arg.prototype = Object.create(AST.prototype);
        arg.prototype.constructor = arg;

        function AsyncFunctionDef(name, args, body, decorator_list, returns, type_comment) {
            this.name = name;
            this.args = args;
            this.body = body;
            this.decorator_list = decorator_list;
            this.returns = returns;
            this.type_comment = type_comment;
            this._fields = ["name", "args", "body", "decorator_list", "returns", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncFunctionDef.prototype = Object.create(stmt.prototype);
        AsyncFunctionDef.prototype.constructor = AsyncFunctionDef;

        function ClassDef(name, bases, keywords, body, decorator_list) {
            this.name = name;
            this.bases = bases;
            this.keywords = keywords;
            this.body = body;
            this.decorator_list = decorator_list;
            this._fields = ["name", "bases", "keywords", "body", "decorator_list"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ClassDef.prototype = Object.create(stmt.prototype);
        ClassDef.prototype.constructor = ClassDef;

        function Return(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Return.prototype = Object.create(stmt.prototype);
        Return.prototype.constructor = Return;

        function Delete(targets) {
            this.targets = targets;
            this._fields = ["targets"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Delete.prototype = Object.create(stmt.prototype);
        Delete.prototype.constructor = Delete;

        function Assign(targets, value, type_comment) {
            this.targets = targets;
            this.value = value;
            this.type_comment = type_comment;
            this._fields = ["targets", "value", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Assign.prototype = Object.create(stmt.prototype);
        Assign.prototype.constructor = Assign;

        function AugAssign(target, op, value) {
            this.target = target;
            this.op = op;
            this.value = value;
            this._fields = ["target", "op", "value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AugAssign.prototype = Object.create(stmt.prototype);
        AugAssign.prototype.constructor = AugAssign;

        function AnnAssign(target, annotation, value, simple) {
            this.target = target;
            this.annotation = annotation;
            this.value = value;
            this.simple = simple;
            this._fields = ["target", "annotation", "value", "simple"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AnnAssign.prototype = Object.create(stmt.prototype);
        AnnAssign.prototype.constructor = AnnAssign;

        function For(target, iter, body, orelse, type_comment) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.type_comment = type_comment;
            this._fields = ["target", "iter", "body", "orelse", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        For.prototype = Object.create(stmt.prototype);
        For.prototype.constructor = For;

        function AsyncFor(target, iter, body, orelse, type_comment) {
            this.target = target;
            this.iter = iter;
            this.body = body;
            this.orelse = orelse;
            this.type_comment = type_comment;
            this._fields = ["target", "iter", "body", "orelse", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncFor.prototype = Object.create(stmt.prototype);
        AsyncFor.prototype.constructor = AsyncFor;

        function While(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        While.prototype = Object.create(stmt.prototype);
        While.prototype.constructor = While;

        function If(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        If.prototype = Object.create(stmt.prototype);
        If.prototype.constructor = If;

        function With(items, body, type_comment) {
            this.items = items;
            this.body = body;
            this.type_comment = type_comment;
            this._fields = ["items", "body", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        With.prototype = Object.create(stmt.prototype);
        With.prototype.constructor = With;

        function AsyncWith(items, body, type_comment) {
            this.items = items;
            this.body = body;
            this.type_comment = type_comment;
            this._fields = ["items", "body", "type_comment"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        AsyncWith.prototype = Object.create(stmt.prototype);
        AsyncWith.prototype.constructor = AsyncWith;

        function withitem(context_expr, optional_vars) {
            this.context_expr = context_expr;
            this.optional_vars = optional_vars;
            this._fields = ["context_expr", "optional_vars"];
            this._attributes = [];
        };
        withitem.prototype = Object.create(AST.prototype);
        withitem.prototype.constructor = withitem;

        function Raise(exc, cause) {
            this.exc = exc;
            this.cause = cause;
            this._fields = ["exc", "cause"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Raise.prototype = Object.create(stmt.prototype);
        Raise.prototype.constructor = Raise;

        function Try(body, handlers, orelse, finalbody) {
            this.body = body;
            this.handlers = handlers;
            this.orelse = orelse;
            this.finalbody = finalbody;
            this._fields = ["body", "handlers", "orelse", "finalbody"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Try.prototype = Object.create(stmt.prototype);
        Try.prototype.constructor = Try;

        function excepthandler() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        excepthandler.prototype = Object.create(AST.prototype);
        excepthandler.prototype.constructor = excepthandler;

        function ExceptHandler(type, name, body) {
            this.type = type;
            this.name = name;
            this.body = body;
            this._fields = ["type", "name", "body"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ExceptHandler.prototype = Object.create(excepthandler.prototype);
        ExceptHandler.prototype.constructor = ExceptHandler;

        function Assert(test, msg) {
            this.test = test;
            this.msg = msg;
            this._fields = ["test", "msg"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Assert.prototype = Object.create(stmt.prototype);
        Assert.prototype.constructor = Assert;

        function Import(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Import.prototype = Object.create(stmt.prototype);
        Import.prototype.constructor = Import;

        function ImportFrom(module, names, level) {
            this.module = module;
            this.names = names;
            this.level = level;
            this._fields = ["module", "names", "level"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ImportFrom.prototype = Object.create(stmt.prototype);
        ImportFrom.prototype.constructor = ImportFrom;

        function alias(name, asname) {
            this.name = name;
            this.asname = asname;
            this._fields = ["name", "asname"];
            this._attributes = [];
        };
        alias.prototype = Object.create(AST.prototype);
        alias.prototype.constructor = alias;

        function Global(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Global.prototype = Object.create(stmt.prototype);
        Global.prototype.constructor = Global;

        function Nonlocal(names) {
            this.names = names;
            this._fields = ["names"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Nonlocal.prototype = Object.create(stmt.prototype);
        Nonlocal.prototype.constructor = Nonlocal;

        function Expr(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Expr.prototype = Object.create(stmt.prototype);
        Expr.prototype.constructor = Expr;

        function Pass() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Pass.prototype = Object.create(stmt.prototype);
        Pass.prototype.constructor = Pass;

        function Break() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Break.prototype = Object.create(stmt.prototype);
        Break.prototype.constructor = Break;

        function Continue() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Continue.prototype = Object.create(stmt.prototype);
        Continue.prototype.constructor = Continue;

        function expr() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        expr.prototype = Object.create(AST.prototype);
        expr.prototype.constructor = expr;

        function expr_context() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        expr_context.prototype = Object.create(AST.prototype);
        expr_context.prototype.constructor = expr_context;

        function Load() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Load.prototype = Object.create(expr_context.prototype);
        Load.prototype.constructor = Load;

        function Store() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Store.prototype = Object.create(expr_context.prototype);
        Store.prototype.constructor = Store;

        function Del() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Del.prototype = Object.create(expr_context.prototype);
        Del.prototype.constructor = Del;

        function AugLoad() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        AugLoad.prototype = Object.create(expr_context.prototype);
        AugLoad.prototype.constructor = AugLoad;

        function AugStore() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        AugStore.prototype = Object.create(expr_context.prototype);
        AugStore.prototype.constructor = AugStore;

        function Param() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Param.prototype = Object.create(expr_context.prototype);
        Param.prototype.constructor = Param;

        function BoolOp(op, values) {
            this.op = op;
            this.values = values;
            this._fields = ["op", "values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        BoolOp.prototype = Object.create(expr.prototype);
        BoolOp.prototype.constructor = BoolOp;

        function boolop() {
            var self = this;
            this._fields = [];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        boolop.prototype = Object.create(AST.prototype);
        boolop.prototype.constructor = boolop;

        function And() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        And.prototype = Object.create(boolop.prototype);
        And.prototype.constructor = And;

        function Or() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Or.prototype = Object.create(boolop.prototype);
        Or.prototype.constructor = Or;

        function NamedExpr(target, value) {
            this.target = target;
            this.value = value;
            this._fields = ["target", "value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        NamedExpr.prototype = Object.create(expr.prototype);
        NamedExpr.prototype.constructor = NamedExpr;

        function BinOp(left, op, right) {
            this.left = left;
            this.op = op;
            this.right = right;
            this._fields = ["left", "op", "right"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        BinOp.prototype = Object.create(expr.prototype);
        BinOp.prototype.constructor = BinOp;

        function operator() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        operator.prototype = Object.create(AST.prototype);
        operator.prototype.constructor = operator;

        function Add() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Add.prototype = Object.create(operator.prototype);
        Add.prototype.constructor = Add;

        function Sub() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Sub.prototype = Object.create(operator.prototype);
        Sub.prototype.constructor = Sub;

        function Mult() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Mult.prototype = Object.create(operator.prototype);
        Mult.prototype.constructor = Mult;

        function Div() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Div.prototype = Object.create(operator.prototype);
        Div.prototype.constructor = Div;

        function FloorDiv() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        FloorDiv.prototype = Object.create(operator.prototype);
        FloorDiv.prototype.constructor = FloorDiv;

        function Mod() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Mod.prototype = Object.create(operator.prototype);
        Mod.prototype.constructor = Mod;

        function Pow() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Pow.prototype = Object.create(operator.prototype);
        Pow.prototype.constructor = Pow;

        function LShift() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        LShift.prototype = Object.create(operator.prototype);
        LShift.prototype.constructor = LShift;

        function RShift() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        RShift.prototype = Object.create(operator.prototype);
        RShift.prototype.constructor = RShift;

        function BitOr() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitOr.prototype = Object.create(operator.prototype);
        BitOr.prototype.constructor = BitOr;

        function BitXor() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitXor.prototype = Object.create(operator.prototype);
        BitXor.prototype.constructor = BitXor;

        function BitAnd() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        BitAnd.prototype = Object.create(operator.prototype);
        BitAnd.prototype.constructor = BitAnd;

        function MatMult() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        MatMult.prototype = Object.create(operator.prototype);
        MatMult.prototype.constructor = MatMult;

        function UnaryOp(op, operand) {
            this.op = op;
            this.operand = operand;
            this._fields = ["op", "operand"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        UnaryOp.prototype = Object.create(expr.prototype);
        UnaryOp.prototype.constructor = UnaryOp;

        function unaryop() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        unaryop.prototype = Object.create(AST.prototype);
        unaryop.prototype.constructor = unaryop;

        function UAdd() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        UAdd.prototype = Object.create(unaryop.prototype);
        UAdd.prototype.constructor = UAdd;

        function USub() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        USub.prototype = Object.create(unaryop.prototype);
        USub.prototype.constructor = USub;

        function Not() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Not.prototype = Object.create(unaryop.prototype);
        Not.prototype.constructor = Not;

        function Invert() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Invert.prototype = Object.create(unaryop.prototype);
        Invert.prototype.constructor = Invert;

        function Lambda(args, body) {
            this.args = args;
            this.body = body;
            this._fields = ["args", "body"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Lambda.prototype = Object.create(expr.prototype);
        Lambda.prototype.constructor = Lambda;

        function IfExp(test, body, orelse) {
            this.test = test;
            this.body = body;
            this.orelse = orelse;
            this._fields = ["test", "body", "orelse"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        IfExp.prototype = Object.create(expr.prototype);
        IfExp.prototype.constructor = IfExp;

        function Dict(keys, values) {
            this.keys = keys;
            this.values = values;
            this._fields = ["keys", "values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Dict.prototype = Object.create(expr.prototype);
        Dict.prototype.constructor = Dict;

        function Set(elts) {
            this.elts = elts;
            this._fields = ["elts"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Set.prototype = Object.create(expr.prototype);
        Set.prototype.constructor = Set;

        function ListComp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        ListComp.prototype = Object.create(expr.prototype);
        ListComp.prototype.constructor = ListComp;

        function SetComp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        SetComp.prototype = Object.create(expr.prototype);
        SetComp.prototype.constructor = SetComp;

        function DictComp(key, value, generators) {
            this.key = key;
            this.value = value;
            this.generators = generators;
            this._fields = ["key", "value", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        DictComp.prototype = Object.create(expr.prototype);
        DictComp.prototype.constructor = DictComp;

        function comprehension(target, iter, ifs, is_async) {
            this.target = target;
            this.iter = iter;
            this.ifs = ifs;
            this.is_async = is_async;
            this._fields = ["target", "iter", "ifs", "is_async"];
            this._attributes = [];
        };
        comprehension.prototype = Object.create(AST.prototype);
        comprehension.prototype.constructor = comprehension;

        function GeneratorExp(elt, generators) {
            this.elt = elt;
            this.generators = generators;
            this._fields = ["elt", "generators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        GeneratorExp.prototype = Object.create(expr.prototype);
        GeneratorExp.prototype.constructor = GeneratorExp;

        function Await(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Await.prototype = Object.create(expr.prototype);
        Await.prototype.constructor = Await;

        function Yield(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Yield.prototype = Object.create(expr.prototype);
        Yield.prototype.constructor = Yield;

        function YieldFrom(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        YieldFrom.prototype = Object.create(expr.prototype);
        YieldFrom.prototype.constructor = YieldFrom;

        function Compare(left, ops, comparators) {
            this.left = left;
            this.ops = ops;
            this.comparators = comparators;
            this._fields = ["left", "ops", "comparators"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Compare.prototype = Object.create(expr.prototype);
        Compare.prototype.constructor = Compare;

        function cmpop() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        cmpop.prototype = Object.create(AST.prototype);
        cmpop.prototype.constructor = cmpop;

        function Eq() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Eq.prototype = Object.create(cmpop.prototype);
        Eq.prototype.constructor = Eq;

        function NotEq() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        NotEq.prototype = Object.create(cmpop.prototype);
        NotEq.prototype.constructor = NotEq;

        function Lt() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Lt.prototype = Object.create(cmpop.prototype);
        Lt.prototype.constructor = Lt;

        function LtE() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        LtE.prototype = Object.create(cmpop.prototype);
        LtE.prototype.constructor = LtE;

        function Gt() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Gt.prototype = Object.create(cmpop.prototype);
        Gt.prototype.constructor = Gt;

        function GtE() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        GtE.prototype = Object.create(cmpop.prototype);
        GtE.prototype.constructor = GtE;

        function Is() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        Is.prototype = Object.create(cmpop.prototype);
        Is.prototype.constructor = Is;

        function IsNot() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        IsNot.prototype = Object.create(cmpop.prototype);
        IsNot.prototype.constructor = IsNot;

        function In() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        In.prototype = Object.create(cmpop.prototype);
        In.prototype.constructor = In;

        function NotIn() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        NotIn.prototype = Object.create(cmpop.prototype);
        NotIn.prototype.constructor = NotIn;

        function Call(func, args, keywords) {
            this.func = func;
            this.args = args;
            this.keywords = keywords;
            this._fields = ["func", "args", "keywords"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Call.prototype = Object.create(expr.prototype);
        Call.prototype.constructor = Call;

        function keyword(arg, value) {
            this.arg = arg;
            this.value = value;
            this._fields = ["arg", "value"];
            this._attributes = [];
        };
        keyword.prototype = Object.create(AST.prototype);
        keyword.prototype.constructor = keyword;

        function FormattedValue(value, conversion, format_spec) {
            this.value = value;
            this.conversion = conversion;
            this.format_spec = format_spec;
            this._fields = ["value", "conversion", "format_spec"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        FormattedValue.prototype = Object.create(expr.prototype);
        FormattedValue.prototype.constructor = FormattedValue;

        function JoinedStr(values) {
            this.values = values;
            this._fields = ["values"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        JoinedStr.prototype = Object.create(expr.prototype);
        JoinedStr.prototype.constructor = JoinedStr;

        function Constant(value, kind) {
            this.value = value;
            this.kind = kind;
            this._fields = ["value", "kind"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Constant.prototype = Object.create(expr.prototype);
        Constant.prototype.constructor = Constant;

        function Attribute(value, attr, ctx) {
            this.value = value;
            this.attr = attr;
            this.ctx = ctx;
            this._fields = ["value", "attr", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Attribute.prototype = Object.create(expr.prototype);
        Attribute.prototype.constructor = Attribute;

        function Subscript(value, slice, ctx) {
            this.value = value;
            this.slice = slice;
            this.ctx = ctx;
            this._fields = ["value", "slice", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Subscript.prototype = Object.create(expr.prototype);
        Subscript.prototype.constructor = Subscript;

        function slice() {
            var self = this;
            this._fields = [];
            this._attributes = [];
        };
        slice.prototype = Object.create(AST.prototype);
        slice.prototype.constructor = slice;

        function Slice(lower, upper, step) {
            this.lower = lower;
            this.upper = upper;
            this.step = step;
            this._fields = ["lower", "upper", "step"];
            this._attributes = [];
        };
        Slice.prototype = Object.create(slice.prototype);
        Slice.prototype.constructor = Slice;

        function ExtSlice(dims) {
            this.dims = dims;
            this._fields = ["dims"];
            this._attributes = [];
        };
        ExtSlice.prototype = Object.create(slice.prototype);
        ExtSlice.prototype.constructor = ExtSlice;

        function Index(value) {
            this.value = value;
            this._fields = ["value"];
            this._attributes = [];
        };
        Index.prototype = Object.create(slice.prototype);
        Index.prototype.constructor = Index;

        function Starred(value, ctx) {
            this.value = value;
            this.ctx = ctx;
            this._fields = ["value", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Starred.prototype = Object.create(expr.prototype);
        Starred.prototype.constructor = Starred;

        function Name(id, ctx) {
            this.id = id;
            this.ctx = ctx;
            this._fields = ["id", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Name.prototype = Object.create(expr.prototype);
        Name.prototype.constructor = Name;

        function List(elts, ctx) {
            this.elts = elts;
            this.ctx = ctx;
            this._fields = ["elts", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        List.prototype = Object.create(expr.prototype);
        List.prototype.constructor = List;

        function Tuple(elts, ctx) {
            this.elts = elts;
            this.ctx = ctx;
            this._fields = ["elts", "ctx"];
            this._attributes = ["lineno", "col_offset", "end_lineno", "end_col_offset"];
        };
        Tuple.prototype = Object.create(expr.prototype);
        Tuple.prototype.constructor = Tuple;
        var PyCF_ONLY_AST = 1024;
        var PyCF_TYPE_COMMENTS = 4096;
        var PyCF_ALLOW_TOP_LEVEL_AWAIT = 8192;

        function nocompile(f) {
            return f;
        };

        function parse(source, filename, mode) {
            return py_parse((source + "\n"));
        };
        return {
            nocompile: nocompile,
            parse: parse
        }
    })();
    AST.parse = zast.parse;

    function nocompile(f) {
        return f;
    };
    var debug = false;
    var single_step = true;
    var om_None = absent;
    var om_True = absent;
    var om_False = absent;

    function Context(rte, cont, ast) {
        this.rte = rte;
        this.cont = cont;
        this.ast = ast;
    };
    Context.prototype.copy = function() {
        return new Context(self.rte.copy(), self.cont, self.ast);
    };
    Context.prototype.call = function() {
        return self.cont(self.rte);
    };

    function make_frame(rte, cont, ast) {
        return [rte, cont, ast];
    };

    function frame_rte(frame) {
        return frame[0];
    };

    function frame_cont(frame) {
        return frame[1];
    };

    function frame_ast(frame) {
        return frame[2];
    };

    function make_rte(globals_env, locals_env, stack, ctrl_env) {
        return [globals_env, locals_env, stack, ctrl_env];
    };

    function rte_globals(rte) {
        return rte[0];
    };

    function rte_locals(rte) {
        return rte[1];
    };

    function rte_stack(rte) {
        return rte[2];
    };

    function rte_ctrl_env(rte) {
        return rte[3];
    };

    function rte_lookup(rte, name) {
        var env = rte_locals(rte);
        if ((env === absent)) {
            var env = rte_globals(rte);
            return dict_get(env, name, absent);
        } else {
            var result = dict_get(env, name, absent);
            if ((result === absent)) {
                var env = rte_globals(rte);
                return dict_get(env, name, absent);
            } else {
                return result;
            };
        };
    };

    function rte_set(rte, varname, val) {
        var env = rte_locals(rte);
        if ((env === absent)) {
            var env = rte_globals(rte);
            env[varname] = val;
        } else {
            env[varname] = val;
        };
    };

    function unwindReturn(rte, val) {
        var frame = rte_stack(rte);
        var ctx = new Context(frame_rte(frame), frame_cont(frame), frame_ast(frame));
        return expr_end(ctx, val);
    };

    function make_signature(args, posonlyargs, varargs, kwonlyargs, kw_defaults, kwargs, defaults) {
        return [args, posonlyargs, varargs, kwonlyargs, kw_defaults, kwargs, defaults];
    };
    var empty_sigature = make_signature([], [], false, [], [], false, []);

    function make_posonly_only_signature(posonlyargs) {
        return make_signature([], posonlyargs, false, [], [], false, []);
    };

    function make_posonly_defaults_only_signature(posonlyargs, defaults) {
        return make_signature([], posonlyargs, false, [], [], false, defaults);
    };

    function make_vararg_only_signature(vararg) {
        return make_signature([], [], varargs, [], [], false, []);
    };

    function make_posonly_defaults_signature(posonlyargs, defaults) {
        return make_signature([], posonlyargs, false, [], [], false, defaults);
    };

    function make_args_defaults_signature(args, defaults) {
        return make_signature(args, [], false, [], [], false, defaults);
    };

    function signature_args(signature) {
        return signature[0];
    };

    function signature_posonlyargs(signature) {
        return signature[1];
    };

    function signature_varargs(signature) {
        return signature[2];
    };

    function signature_kwonlyargs(signature) {
        return signature[3];
    };

    function signature_kw_defaults(signature) {
        return signature[4];
    };

    function signature_kwargs(signature) {
        return signature[5];
    };

    function signature_defaults(signature) {
        return signature[6];
    };

    function signature_arity(signature) {
        var args = signature_args(signature);
        var posonlyargs = signature_posonlyargs(signature);
        var vararg = signature_varargs(signature);
        var kwonlyargs = signature_kwonlyargs(signature);
        var kw_defaults = signature_kw_defaults(signature);
        var kwargs = signature_kwargs(signature);
        var defaults = signature_defaults(signature);
        if ((((kwonlyargs.length === 0)) && ((kw_defaults.length === 0)) && ((kwargs === absent)) && ((defaults.length === 0)))) {
            if (vararg) {
                return (((-(1)) - args.length) - posonlyargs.length);
            } else {
                return (args.length + posonlyargs.length);
            };
        } else {
            return absent;
        };
    };

    function align_args_with_signature(ctx, caller_args, signature) {
        var args = signature_args(signature);
        var posonlyargs = signature_posonlyargs(signature);
        var vararg = signature_varargs(signature);
        var kwonlyargs = signature_kwonlyargs(signature);
        var kw_default = signature_kw_defaults(signature);
        var kwarg = signature_kwargs(signature);
        var defaults = signature_defaults(signature);
        if (((!(kwarg === absent)) && ((kwonlyargs.length > 0)))) {
            console.assert(false, "kwarg not implemented");
        } else {
            var caller_args_len = caller_args.length;
            var args_len = args.length;
            var posonlyargs_len = posonlyargs.length;
            var defaults_len = defaults.length;
            var total_args_len = (args_len + posonlyargs_len);
            if ((caller_args_len === total_args_len)) {
                if ((!(vararg))) {
                    var caller_index = 0;
                    var locals_env = [];
                    for (const g7 of posonlyargs) {
                        locals_env.push([g7, caller_args[caller_index]]);
                        caller_index += 1;
                    };
                    for (const g8 of args) {
                        locals_env.push([g8, caller_args[caller_index]]);
                        caller_index += 1;
                    };
                    return locals_env;
                } else {
                    return caller_args;
                };
            } else {
                if ((caller_args_len < total_args_len)) {
                    var missing_args_len = (total_args_len - caller_args_len);
                    if ((defaults_len >= missing_args_len)) {
                        var result = caller_args.copy();
                        var start = (defaults_len - missing_args_len);
                        result.push(defaults.slice(start, default_len));
                        return result;
                    };
                } else {
                    console.assert(false, "vararg not implemented");
                };
            };
        };
    };

    function make_dict_from_list(lst) {
        var result = make_dict();
        for (const g9 of lst) {
            result[g9[0]] = g9[1];
        };
        return result;
    };

    function dict_set(d, key, value) {
        d[key] = value;
    };

    function class_getattr(o, attr) {
        return dict_get(o, attr, absent);
    };

    function class_getattribute(o, attr) {
        return dict_get(o, attr, absent);
    };

    function class_setattribute(o, attr, value) {
        dict_set(o, attr, value);
    };

    function getattribute_from_class_mro(cls, name) {
        var __mro__ = class__mro__(cls);
        for (const g10 of __mro__) {
            var fields = om_rawget(g10, "**public**");
            var attr = fields_get(fields, name);
            if (!(attr === absent)) {
                return attr;
            };
        };
        return absent;
    };

    function getattribute_from_obj_mro(o, name) {
        var __class__ = object_class(o);
        if ((name === "__class__")) {
            return __class__;
        } else {
            return getattribute_from_class_mro(__class__, name);
        };
    };

    function make_class(name, module, bases, metaclass) {
        var cls = om(metaclass);
        var fields = make_fields();
        fields_set(fields, "__name__", name);
        fields_set(fields, "__module__", module);
        om_rawset(cls, "**public**", fields);
        om_rawset(cls, "__class__", metaclass);
        om_rawset(cls, "__mro__", bases);
        return cls;
    };

    function make_builtin_class(name, metaclass) {
        var cls = make_class(name, "builtins", absent, metaclass);
        return cls;
    };

    function class_set__mro__(cls, mro) {
        om_rawset(cls, "__mro__", mro);
    };

    function class__mro__(cls) {
        return om_rawget(cls, "__mro__");
    };

    function builtin_add_method(fields, name, code) {
        var wrapper = om_WrapperDescriptor(name, code);
        fields_set(fields, name, wrapper);
    };

    function populate_builtin_type() {
        om_rawset(class_type, "__class__", class_type);
        var fields = om_rawget(class_type, "**public**");
        builtin_add_method(fields, "__call__", om_type_call);
        builtin_add_method(fields, "__getattribute__", om_type_getattribute);
        class_set__mro__(class_type, [class_type, class_object]);
    };

    function populate_builtin_object() {
        var fields = om_rawget(class_object, "**public**");
        builtin_add_method(fields, "__getattribute__", om_object_getattribute);
        builtin_add_method(fields, "__repr__", om_object_repr);
        class_set__mro__(class_object, [class_object]);
    };

    function populate_builtin_WrapperDescriptor() {
        var fields = om_rawget(class_WrapperDescriptor, "**public**");
        builtin_add_method(fields, "__get__", om_WrapperDescriptor_get);
        builtin_add_method(fields, "__call__", om_WrapperDescriptor_call);
        class_set__mro__(class_WrapperDescriptor, [class_WrapperDescriptor, class_object]);
    };

    function populate_builtin_MethodWrapper() {
        var fields = om_rawget(class_MethodWrapper, "**public**");
        builtin_add_method(fields, "__call__", om_MethodWrapper_call);
        class_set__mro__(class_MethodWrapper, [class_MethodWrapper, class_object]);
    };

    function populate_builtin_int() {
        var fields = om_rawget(class_int, "**public**");
        builtin_add_method(fields, "__bool__", om_int_bool);
        builtin_add_method(fields, "__add__", om_int_add);
        builtin_add_method(fields, "__radd__", om_int_radd);
        builtin_add_method(fields, "__sub__", om_int_sub);
        builtin_add_method(fields, "__rsub__", om_int_rsub);
        builtin_add_method(fields, "__eq__", om_int_eq);
        builtin_add_method(fields, "__ne__", om_int_ne);
        builtin_add_method(fields, "__lt__", om_int_lt);
        builtin_add_method(fields, "__lte__", om_int_lte);
        builtin_add_method(fields, "__gt__", om_int_gt);
        builtin_add_method(fields, "__gte__", om_int_gte);
        builtin_add_method(fields, "__repr__", om_int_repr);
        class_set__mro__(class_int, [class_int, class_object]);
    };

    function populate_builtin_bool() {
        var fields = om_rawget(class_bool, "**public**");
        builtin_add_method(fields, "__bool__", om_bool_bool);
        builtin_add_method(fields, "__repr__", om_bool_repr);
        class_set__mro__(class_bool, [class_bool, class_int, class_object]);
    };

    function populate_builtin_str() {
        class_set__mro__(class_str, [class_str, class_object]);
    };

    function populate_builtin_NoneType() {
        var fields = om_rawget(class_NoneType, "**public**");
        builtin_add_method(fields, "__bool__", om_NoneType_bool);
        class_set__mro__(class_NoneType, [class_NoneType, class_object]);
    };

    function populate_builtin_FunctionType() {
        var fields = om_rawget(class_function, "**public**");
        builtin_add_method(fields, "__call__", om_function_call);
        class_set__mro__(class_function, [class_function, class_object]);
    };

    function object_class(o) {
        if ((o.constructor.name === 'bool')) {
            return class_bool;
        } else {
            if (((typeof o) === "string")) {
                return class_str;
            } else {
                var __class__ = om_rawget(o, "__class__");
                console.assert(!(__class__ === absent), "object does not have a class");
                return __class__;
            };
        };
    };

    function is_om_type(o) {
        return (((o.constructor.name === 'dict')) && (!(om_rawget(o, "**public**") === absent)));
    };

    function om(cls) {
        var o = make_dict();
        var public_fields = make_fields();
        om_rawset(o, "**public**", public_fields);
        om_rawset(o, "__class__", cls);
        return o;
    };

    function om_str(val) {
        var obj = om(class_str);
        om_rawset(obj, "**value**", val);
        return obj;
    };

    function om_int(val) {
        var obj = om(class_int);
        om_rawset(obj, "**value**", val);
        return obj;
    };

    function om_WrapperDescriptor(name, code) {
        var obj = om(class_WrapperDescriptor);
        om_rawset(obj, "**code**", code);
        var fields = om_rawget(obj, "**public**");
        fields_set(fields, "__name__", om_str(name));
        return obj;
    };

    function om_MethodWrapper(name, instance, code) {
        var obj = om(class_MethodWrapper);
        om_rawset(obj, "**code**", code);
        om_rawset(obj, "**instance**", instance);
        var fields = om_rawget(obj, "**public**");
        fields_set(fields, "__name__", om_str(name));
        return obj;
    };

    function om_is(x, y) {
        return Object.is(x, y);
    };

    function om_is_falsy(val) {
        return om_is(val, om_False);
    };

    function om_rawset(o, name, val) {
        dict_set(o, name, val);
    };

    function om_rawget(o, name) {
        return dict_get(o, name, absent);
    };

    function om_call(o, ctx, args) {
        var code = om_rawget(o, "**code**");
        if ((code === absent)) {
            return sem_call(ctx, args);
        } else {
            return code(ctx, args);
        };
    };

    function make_fields() {
        return {};
    };

    function fields_get(o, name) {
        return dict_get(o, name, absent);
    };

    function fields_set(o, name, value) {
        dict_set(o, name, value);
    };

    function om_type_call(ctx, args) {
        console.assert(false, "Not implemented");
    };

    function om_type_getattribute(ctx, args) {
        if (debug) {
            console.log("type.__getattribute__");
        };
        var self = args[0];
        var name = args[1];
        var dt = om_rawget(self, "__class__");
        console.assert(!Object.is(dt, class_str), "TypeError: attribute name must be string, not 'typeof(name)'");
        var name_unbox = om_rawget(name, "**value**");
        var public_fields = om_rawget(self, "**public**");
        var attr = getattribute_from_class_mro(self, name_unbox);
        if ((attr === absent)) {
            console.assert(false, (("'object' object has no attribute '" + name_unbox) + "'"));
        };
        var attr__get__ = getattribute_from_obj_mro(attr, "__get__");
        if ((attr__get__ === absent)) {
            return expr_end(ctx, attr);
        } else {
            return om_call(attr__get__, ctx, [attr, om_None, dt]);
        };
    };

    function om_WrapperDescriptor_get(ctx, args) {
        if (debug) {
            console.log("wrapper_descriptor.__get__");
        };
        var self = args[0];
        var obj = args[1];
        var cls = args[2];
        if (Object.is(obj, om_None)) {
            return expr_end(ctx, self);
        } else {
            var method = om_rawget(self, "**method-wrapper**");
            if ((method === absent)) {
                var code = om_rawget(self, "**code**");
                var method = om_MethodWrapper(self, obj, code);
                om_rawset(self, "**method-wrapper**", method);
            };
            return expr_end(ctx, method);
        };
    };

    function om_WrapperDescriptor_call(ctx, args) {
        if (debug) {
            console.log("wrapper_descriptor.__call__");
        };
        var self = args[0];
        var params = args.slice(1);
        var code = om_rawget(self, "**code**");

        function cont(rte, val) {
            return expr_end(ctx, val);
        };
        var ctx1 = new Context(ctx.rte, cont, ctx.ast);
        return code(ctx1, params);
    };

    function om_MethodWrapper_call(ctx, args) {
        if (debug) {
            console.log("method-wrapper.__call__");
        };
        var self = args[0];
        var rest = args.slice(1);
        var obj = om_rawget(self, "**instance**");
        var params = [obj].concat(rest);

        function cont(rte, val) {
            return expr_end(ctx, val);
        };
        var ctx1 = new Context(ctx.rte, cont, ctx.ast);
        return om_call(self, ctx1, params);
    };

    function om_object_getattribute(ctx, args) {
        if (debug) {
            console.log("object.__getattribute__");
        };
        var self = args[0];
        var name = args[1];
        var dt = om_rawget(self, "__class__");
        console.assert(!Object.is(dt, class_str), "TypeError: attribute name must be string, not 'typeof(name)'");
        var name_unbox = om_rawget(name, "**value**");
        var public_fields = om_rawget(self, "**public**");
        var attr = getattribute_from_obj_mro(self, name_unbox);
        if ((attr === absent)) {
            console.assert(false, (("'object' object has no attribute '" + name_unbox) + "'"));
        };
        var attr__get__ = getattribute_from_obj_mro(attr, "__get__");
        if ((attr__get__ === absent)) {
            return expr_end(ctx, attr);
        } else {
            return om_call(attr__get__, ctx, [attr, self, dt]);
        };
    };

    function om_object_repr(ctx, args) {
        var self = args[0];
        var __name__ = getattribute_from_obj_mro(self, "__name__");
        var result = om_str((("<class '" + __name__) + "'>"));
        return ctx.cont(ctx.rte, result);
    };

    function om_bool_repr(ctx, args) {
        if (debug) {
            console.log("bool.__repr__");
        };
        var self = args[0];
        if (om_is_falsy(self)) {
            var result = om_str("False");
        } else {
            var result = om_str("True");
        };
        return ctx.cont(ctx.rte, result);
    };

    function om_bool_bool(ctx, args) {
        if (debug) {
            console.log("bool.__bool__");
        };
        var self = args[0];
        return expr_end(ctx, self);
    };

    function om_int_bool(ctx, args) {
        if (debug) {
            console.log("int.__bool__");
        };
        var self = args[0];
        var val_unbox = om_rawget(self, "**value**");
        if ((val_unbox !== 0)) {
            var result = om_True;
        } else {
            var result = om_False;
        };
        return ctx.cont(ctx.rte, result);
    };

    function om_int_add(ctx, args) {
        var val1 = args[0];
        var val2 = args[1];
        var val1_unbox = om_rawget(val1, "**value**");
        var val2_unbox = om_rawget(val2, "**value**");
        var result = (val1_unbox + val2_unbox);
        return ctx.cont(ctx.rte, om_int(result));
    };
    var om_int_radd = om_int_add;

    function om_int_sub(ctx, args) {
        var val1 = args[0];
        var val2 = args[1];
        var val1_unbox = om_rawget(val1, "**value**");
        var val2_unbox = om_rawget(val2, "**value**");
        var result = (val1_unbox - val2_unbox);
        return ctx.cont(ctx.rte, om_int(result));
    };

    function om_int_rsub(ctx, args) {
        var val1 = args[0];
        var val2 = args[1];
        return om_int_sub(ctx, [val2, val1]);
    };

    function om_int_eq(ctx, args) {
        if (debug) {
            console.log("int.__eq__");
        };
        var val1 = args[0];
        var val2 = args[1];
        var v1 = om_rawget(val1, "**value**");
        var v2 = om_rawget(val2, "**value**");
        if ((v1 === v2)) {
            var result = om_True;
        } else {
            var result = om_False;
        };
        return expr_end(ctx, result);
    };

    function om_int_ne(ctx, args) {
        if (debug) {
            console.log("int.__ne__");
        };
        var val1 = args[0];
        var val2 = args[1];
        var v1 = om_rawget(val1, "**value**");
        var v2 = om_rawget(val2, "**value**");
        if ((v1 !== v2)) {
            var result = om_True;
        } else {
            var result = om_False;
        };
        return expr_end(ctx, result);
    };

    function om_int_lt(ctx, args) {
        if (debug) {
            console.log("int.__lt__");
        };
        var val1 = args[0];
        var val2 = args[1];
        var v1 = om_rawget(val1, "**value**");
        var v2 = om_rawget(val2, "**value**");
        if ((v1 < v2)) {
            var result = om_True;
        } else {
            var result = om_False;
        };
        return expr_end(ctx, result);
    };

    function om_int_lte(ctx, args) {
        if (debug) {
            console.log("int.__lte__");
        };
        var val1 = args[0];
        var val2 = args[1];
        var v1 = om_rawget(val1, "**value**");
        var v2 = om_rawget(val2, "**value**");
        if ((v1 <= v2)) {
            var result = om_True;
        } else {
            var result = om_False;
        };
        return expr_end(ctx, result);
    };

    function om_int_gt(ctx, args) {
        if (debug) {
            console.log("int.__gt__");
        };
        var val1 = args[0];
        var val2 = args[1];
        var v1 = om_rawget(val1, "**value**");
        var v2 = om_rawget(val2, "**value**");
        if ((v1 > v2)) {
            var result = om_True;
        } else {
            var result = om_False;
        };
        return expr_end(ctx, result);
    };

    function om_int_gte(ctx, args) {
        if (debug) {
            console.log("int.__gte__");
        };
        var val1 = args[0];
        var val2 = args[1];
        var v1 = om_rawget(val1, "**value**");
        var v2 = om_rawget(val2, "**value**");
        if ((v1 >= v2)) {
            var result = om_True;
        } else {
            var result = om_False;
        };
        return expr_end(ctx, result);
    };

    function om_int_floordiv(ctx, args) {
        var val1 = args[0];
        var val2 = args[1];
        var val1_unbox = om_rawget(val1, "**value**");
        var val2_unbox = om_rawget(val2, "**value**");
        if ((val2_unbox === 0)) {
            console.assert(false, "Division by zero");
        } else {
            var result = ((val1_unbox / val2_unbox) >> 0);
            return expr_end(ctx, om_int(result));
        };
    };

    function om_int_repr(ctx, args) {
        var self = args[0];
        var result = om_rawget(self, "**value**").toString();
        return ctx.cont(ctx.rte, om_str(result));
    };

    function om_NoneType_bool(ctx, val) {
        if (debug) {
            console.log("None.__bool__");
        };
        var result = om_False;
        return ctx.cont(ctx.rte, result);
    };

    function om_function_call(ctx, args) {
        var self = args[0];
        var params = args.slice(1);
        var fields = om_rawget(self, "**public**");
        var signature = om_rawget(self, "**signature**");
        var arity = om_rawget(self, "**arity**");
        var locals_env = align_args_with_signature(ctx, params, signature);

        function code() {
            var stack = make_frame(ctx.rte, ctx.cont, ctx.ast);
            var rte = make_rte(rte_globals(ctx.rte), make_dict_from_list(locals_env), stack, absent);
            var body = om_rawget(self, "**body**");
            return body(rte, (function(rte1) {
                return (frame_cont(rte_stack(rte1))(frame_rte(rte_stack(rte1)), om_None));
            }));
        };
        return code;
    };

    function unbox_object(obj) {
        var value = obj;
        if (is_om_type(obj)) {
            var dtype = om_rawget(obj, "__class__");
            if (((om_is(dtype, class_int)) || (om_is(dtype, class_str)))) {
                var value = om_rawget(obj, "**value**");
            } else {
                if (Object.is(dtype, class_function)) {
                    var name = class_getattribute(obj, "__name__");
                    var value = (("function " + name.toString()) + "(...)");
                };
            };
        };
        return value;
    };

    function box_object(obj) {
        if (Object.is(obj, undefined)) {
            return om_None;
        } else {
            if ((obj.constructor.name === 'bool')) {
                return obj;
            } else {
                if (((typeof obj) === "number")) {
                    return om_int(obj);
                } else {
                    if (((typeof obj) === "string")) {
                        return om_str(obj);
                    } else {
                        return obj;
                    };
                };
            };
        };
    };
    var class_type = make_builtin_class("type", absent);
    var class_object = make_builtin_class("object", class_type);
    var class_WrapperDescriptor = make_builtin_class("wrapper_descriptor", class_type);
    var class_MethodWrapper = make_builtin_class("method-wrapper", class_type);
    var class_int = make_builtin_class("int", class_type);
    var class_bool = make_builtin_class("bool", class_type);
    var class_NoneType = make_builtin_class("NoneType", class_type);
    var class_str = make_builtin_class("str", class_type);
    var class_tuple = make_builtin_class("tuple", class_type);
    var class_list = make_builtin_class("list", class_type);
    var class_module = make_builtin_class("module", class_type);
    var class_function = make_builtin_class("function", class_type);
    populate_builtin_type();
    populate_builtin_object();
    populate_builtin_WrapperDescriptor();
    populate_builtin_MethodWrapper();
    populate_builtin_int();
    populate_builtin_bool();
    populate_builtin_str();
    populate_builtin_NoneType();
    populate_builtin_FunctionType();

    function interp_file(path) {
        var source = read_file(path);
        interp(parse(source));
    };

    function interp_source(src) {
        interp(parse(src));
    };

    function parse(source) {
        return AST.parse(source);
    };

    function interp(ast) {
        var code = comp(ast);
        run(code);
    };

    function comp(ast) {
        var cte = {};
        var [cte1, code] = comp_mod(cte, ast);
        return code;
    };

    function run(code) {
        ;

        function om_print_code(rte, cont) {
            var obj = rte_lookup(rte, "obj");
            console.log(unbox_object(obj));
            return cont(rte);
        };
        om_None = om(class_NoneType);
        om_True = true;
        om_False = false;
        var om_print = om(class_function);
        var public_fields = make_fields();
        fields_set(om_print, "__name__", om_str("print"));
        om_rawset(om_print, "**public**", public_fields);
        om_rawset(om_print, "**signature**", make_posonly_only_signature(["obj"]));
        om_rawset(om_print, "**body**", om_print_code);
        var locals_env = absent;
        var globals_env = make_dict();
        var rte = make_rte(globals_env, locals_env, absent, absent);
        globals_env["type"] = class_type;
        globals_env["object"] = class_object;
        globals_env["int"] = class_int;
        globals_env["bool"] = class_bool;
        globals_env["str"] = class_str;
        globals_env["print"] = om_print;

        //*************** was:
        //function cont(rte) {
        //  console.log("done!");
        //};
        //trampoline((function() {
        //    return (code(rte, cont));
        //}));
        return rte;
    };

    function trampoline(execution_point) {
        while (!Object.is(execution_point, undefined)) {
            var execution_point = execution_point();
        };
    };

    function comp_mod(cte, ast) {
        if ((ast.constructor.name === 'Module')) {
            if (debug) {
                console.log("AST.Module");
            };
            return comp_stmt_seq(cte, ast.body);
        } else {
            console.assert(false, "comp_mod expected a module AST");
        };
    };

    function comp_stmt_seq(cte, stmt_seq) {
        if (debug) {
            console.log("comp_stmt_seq");
        };
        if ((stmt_seq.length === 0)) {
            return gen_stmt_empty(cte);
        } else {
            var [cte1, code1] = comp_stmt(cte, stmt_seq[0]);
            if ((stmt_seq.length === 1)) {
                return [cte1, code1];
            } else {
                var [cte2, code2] = comp_stmt_seq(cte1, stmt_seq.slice(1));
                return gen_stmt_seq(cte2, code1, code2);
            };
        };
    };

    function comp_function_args(cte, args) {
        if ((args.length === 0)) {
            function code(rte, cont) {
                return cont(rte, []);
            };
            return [cte, code];
        } else {
            var index_last = (args.length - 1);
            var [cte1, code1] = comp_expr(cte, args[index_last]);
            var [cte2, code2] = comp_function_args(cte, args.slice(0, index_last));
            return gen_function_args_seq(cte2, code1, code2);
        };
    };

    function gen_function_args_seq(cte, code1, code2) {
        function code(rte, cont) {
            return code2(rte, (function(rte2, val2) {
                return (code1(rte2, (function(rte1, val1) {
                    return (cont(rte1, val2.concat([val1])));
                })));
            }));
        };
        return [cte, code];
    };

    function comp_stmt(cte, ast) {
        if ((ast.constructor.name === 'Expr')) {
            if (debug) {
                console.log("AST.Expr");
            };
            var [cte1, code1] = comp_expr(cte, ast.value);
            return gen_Expr(cte1, ast, code1);
        } else {
            if ((ast.constructor.name === 'Pass')) {
                if (debug) {
                    console.log("AST.Pass");
                };
                return gen_Pass(cte, ast);
            } else {
                if ((ast.constructor.name === 'Return')) {
                    if (debug) {
                        console.log("AST.Return");
                    };
                    if (Object.is(ast.value, undefined)) {
                        return [cte, (function(rte, cont) {
                            return (frame_cont(rte_stack(rte))(frame_rte(rte_stack(rte)), om_None));
                        })];
                    } else {
                        var [cte1, code1] = comp_expr(cte, ast.value);
                        return [cte, (function(rte, cont) {
                            return (code1(rte, (function(rte1, val1) {
                                return (unwindReturn(rte1, val1));
                            })));
                        })];
                    };
                } else {
                    if ((ast.constructor.name === 'Assign')) {
                        if (debug) {
                            console.log("AST.Assign");
                        };
                        if ((((ast.targets.length === 1)) && ((ast.targets[0].constructor.name === 'Name')))) {
                            var id = ast.targets[0].id;
                            var [cte1, code1] = comp_expr(cte, ast.value);
                            return gen_var_set(cte1, ast, id, code1);
                        } else {
                            console.assert(false, "comp_stmt only supports assigning to one variable");
                        };
                    } else {
                        if ((ast.constructor.name === 'While')) {
                            if (debug) {
                                console.log("AST.While");
                            };
                            var [cte1, code1] = comp_expr(cte, ast.test);
                            var [cte2, code2] = comp_stmt_seq(cte1, ast.body);
                            var [cte3, code3] = comp_stmt_seq(cte1, ast.orelse);
                            return gen_while(cte3, ast, code1, code2, code3);
                        } else {
                            if ((ast.constructor.name === 'If')) {
                                if (debug) {
                                    console.log("AST.If");
                                };
                                var [cte1, code1] = comp_expr(cte, ast.test);
                                var [cte2, code2] = comp_stmt_seq(cte1, ast.body);
                                var [cte3, code3] = comp_stmt_seq(cte1, ast.orelse);
                                return gen_if(cte3, ast, code1, code2, code3);
                            } else {
                                if ((ast.constructor.name === 'Assert')) {
                                    if (debug) {
                                        console.log("AST.Assert");
                                    };
                                    var [cte1, code1] = comp_expr(cte, ast.test);
                                    var [cte2, code2] = comp_expr_opt(cte1, ast.msg);
                                    return gen_assert(cte2, ast, code1, code2);
                                } else {
                                    if ((ast.constructor.name === 'FunctionDef')) {
                                        if (debug) {
                                            console.log("AST.FunctionDef");
                                        };
                                        var func = om(class_function);
                                        om_rawset(func, "__name__", ast.name);
                                        var signature = gen_signature(cte, ast);
                                        var [cte1, body_code] = gen_funcdef_code(cte, ast, ast.body);
                                        om_rawset(func, "**signature**", signature);
                                        om_rawset(func, "**body**", body_code);
                                        var arity = signature_arity(signature);
                                        om_rawset(func, "**arity**", arity);

                                        function code(rte, cont) {
                                            return cont(rte, func);
                                        };
                                        return gen_var_set(cte, ast, ast.name, code);
                                    } else {
                                        console.assert(false, "comp_stmt expected a statement AST");
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    };

    function comp_expr(cte, ast) {
        if ((ast.constructor.name === 'BinOp')) {
            if (debug) {
                console.log("AST.BinOp");
            };
            var [cte1, code1] = comp_expr(cte, ast.left);
            var [cte2, code2] = comp_expr(cte, ast.right);
            return gen_BinOp(cte2, ast, ast.op, code1, code2);
        } else {
            if ((ast.constructor.name === 'UnaryOp')) {
                if (debug) {
                    console.log("AST.UnaryOp");
                };
                var [cte1, code1] = comp_expr(cte, ast.operand);
                return gen_UnaryOp(cte1, ast, ast.op, code1);
            } else {
                if ((ast.constructor.name === 'Name')) {
                    if (debug) {
                        console.log("AST.Name");
                    };
                    return gen_var_get(cte, ast, ast.id);
                } else {
                    if ((ast.constructor.name === 'Constant')) {
                        if (debug) {
                            console.log("AST.Constant");
                        };
                        return gen_constant(cte, ast, ast.value);
                    } else {
                        if ((ast.constructor.name === 'BoolOp')) {
                            if (debug) {
                                console.log("AST.BoolOp");
                            };
                            return gen_BoolOp(cte, ast, ast.op, ast.values);
                        } else {
                            if ((ast.constructor.name === 'Compare')) {
                                if (debug) {
                                    console.log("AST.Compare");
                                };
                                var result = gen_Compare(cte, ast, ast.left, ast.comparators, ast.ops);
                                return result;
                            } else {
                                if ((ast.constructor.name === 'Attribute')) {
                                    var [cte1, code1] = comp_expr(cte, ast.value);
                                    return gen_Attribute(cte1, ast, code1, ast.attr);
                                } else {
                                    if ((ast.constructor.name === 'Call')) {
                                        if (debug) {
                                            console.log("AST.Call");
                                        };
                                        var [cte1, code1] = comp_expr(cte, ast.func);
                                        var [cte2, code2] = comp_function_args(cte1, ast.args);
                                        return gen_call(cte1, ast, code1, code2);
                                    } else {
                                        if ((!(debug))) {
                                            console.log(ast);
                                        };
                                        console.assert(false, "comp_expr expected an expression AST");
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
    };

    function comp_expr_opt(cte, ast) {
        if (Object.is(ast, undefined)) {
            return [cte, undefined];
        } else {
            return comp_expr(cte, ast);
        };
    };

    function gen_signature(cte, ast) {
        var args = [];
        for (const g11 of ast.args.args) {
            args.push(g11.arg);
        };
        var posonlyargs = [];
        for (const g12 of ast.args.posonlyargs) {
            posonlyargs.push(g12.arg);
        };
        if (!Object.is(ast.args.vararg, undefined)) {
            var vararg = ast.args.vararg.arg;
        } else {
            var vararg = false;
        };
        var kwonlyargs = [];
        for (const g13 of ast.args.kwonlyargs) {
            kwonlyargs.push(g13.arg);
        };
        var kw_defaults = [];
        for (const g14 of ast.args.kw_defaults) {
            if (Object.is(g14, undefined)) {
                kw_defaults.push(absent);
            } else {
                kw_defaults.push(g14.value);
            };
        };
        if (!Object.is(ast.args.kwarg, undefined)) {
            var kwarg = ast.args.kwarg.arg;
        } else {
            var kwarg = false;
        };
        var defaults = [];
        for (const g15 of ast.args.defaults) {
            defaults.push(g15.value);
        };
        return make_signature(args, posonlyargs, vararg, kwonlyargs, kw_defaults, kwarg, defaults);
    };

    function gen_stmt_seq(cte, code1, code2) {
        function code(rte, cont) {
            return code1(rte, (function(rte1) {
                return (code2(rte1, cont));
            }));
        };
        return [cte, code];
    };

    function gen_stmt_empty(cte) {
        function code(rte, cont) {
            return cont(rte);
        };
        return [cte, code];
    };

    function gen_Pass(cte, ast) {
        function code(rte, cont) {
            return stmt_end(new Context(rte, cont, ast));
        };
        return [cte, code];
    };

    function gen_while(cte, ast, code1, code2, code3) {
        function code(rte, cont) {
            function dispatch(rte, val) {
                if (om_is_falsy(val)) {
                    return code3(rte, cont);
                } else {
                    return code2(rte, (function(rte2) {
                        return (code(rte2, cont));
                    }));
                };
            };

            function cast_bool(rte, val) {
                var ctx = new Context(rte, dispatch, ast);
                return sem_bool(ctx, val);
            };
            return code1(rte, cast_bool);
        };
        return [cte, code];
    };

    function gen_if(cte, ast, code1, code2, code3) {
        function code(rte, cont) {
            function dispatch(rte, val) {
                if (om_is_falsy(val)) {
                    return code3(rte, cont);
                } else {
                    return code2(rte, cont);
                };
            };

            function cast_bool(rte, val) {
                var ctx = new Context(rte, dispatch, ast);
                return sem_bool(ctx, val);
            };
            return code1(rte, cast_bool);
        };
        return [cte, code];
    };

    function gen_assert(cte, ast, code1, code2) {
        function code(rte, cont) {
            function call_assertion_error(rte, val) {
                throw (val);
            };

            function dispatch(rte, val) {
                if (Object.is(val, false)) {
                    if (Object.is(code2, undefined)) {
                        throw (AssertionError);
                    } else {
                        return code2(rte, call_assertion_error);
                    };
                } else {
                    return cont(rte);
                };
            };

            function cast_bool(rte, val) {
                var ctx = new Context(rte, dispatch, ast);
                return sem_bool(ctx, val);
            };
            return code1(rte, cast_bool);
        };
        return [cte, code];
    };

    function gen_var_set(cte, ast, id, code1) {
        function code(rte, cont) {
            function var_set(rte, val) {
                var ctx = new Context(rte, cont, ast);
                return sem_var_set(ctx, id, val);
            };
            return code1(rte, var_set);
        };
        return [cte, code];
    };

    function gen_var_get(cte, ast, id) {
        function code(rte, cont) {
            return sem_var_get(new Context(rte, cont, ast), id);
        };
        return [cte, code];
    };

    function gen_Expr(cte, ast, code1) {
        function code(rte, cont) {
            return code1(rte, (function(rte1, val1) {
                return (cont(rte1));
            }));
        };
        return [cte, code];
    };

    function gen_logical_and(cte, ast, code1, code2) {
        if (debug) {
            console.log("gen_logical_and");
        };

        function code(rte, cont) {
            function cast_bool(rte1, val1) {
                function dispatch(rte2, cond_val) {
                    if (cond_val) {
                        return code2(rte1, cont);
                    } else {
                        return cont(rte1, val1);
                    };
                };
                var ctx = new Context(rte, dispatch, ast);
                return sem_bool(ctx, val1);
            };
            return code1(rte, cast_bool);
        };
        return [cte, code];
    };

    function gen_logical_or(cte, ast, code1, code2) {
        if (debug) {
            console.log("gen_logical_or");
        };

        function code(rte, cont) {
            function cast_bool(rte1, val1) {
                function dispatch(rte2, cond_val) {
                    if (cond_val) {
                        return cont(rte1, val1);
                    } else {
                        return code2(rte1, cont);
                    };
                };
                return sem_bool(new Context(rte1, dispatch, ast), val1);
            };
            return code1(rte, cast_bool);
        };
        return [cte, code];
    };

    function gen_BoolOp(cte, ast, op, values) {
        if ((op.constructor.name === 'And')) {
            var logical_op = gen_logical_and;
        } else {
            if ((op.constructor.name === 'Or')) {
                var logical_op = gen_logical_or;
            } else {
                console.assert(false, "Should not happen");
            };
        };
        return gen_BoolOp_seq(cte, ast, logical_op, values);
    };

    function gen_BoolOp_seq(cte, ast, logical_op, expr_seq) {
        var [cte1, code1] = comp_expr(cte, expr_seq[0]);
        if ((expr_seq.length === 1)) {
            return [cte1, code1];
        } else {
            var [cte2, code2] = gen_BoolOp_seq(cte, ast, logical_op, expr_seq.slice(1));
            return logical_op(cte, ast, code1, code2);
        };
        return [cte, code];
    };

    function gen_logical_or(cte, ast, code1, code2) {
        if (debug) {
            console.log("gen_logical_or");
        };

        function code(rte, cont) {
            function cast_bool(rte1, val1) {
                function dispatch(rte2, cond_val) {
                    if (cond_val) {
                        return cont(rte1, val1);
                    } else {
                        return code2(rte1, cont);
                    };
                };
                return sem_bool(new Context(rte1, dispatch, ast), val1);
            };
            return code1(rte, cast_bool);
        };
        return [cte, code];
    };

    function gen_BoolOp(cte, ast, op, values) {
        if ((op.constructor.name === 'And')) {
            var logical_op = gen_logical_and;
        } else {
            if ((op.constructor.name === 'Or')) {
                var logical_op = gen_logical_or;
            } else {
                console.assert(false, "Should not happen");
            };
        };
        return gen_BoolOp_seq(cte, ast, logical_op, values);
    };

    function gen_BoolOp_seq(cte, ast, logical_op, expr_seq) {
        var [cte1, code1] = comp_expr(cte, expr_seq[0]);
        if ((expr_seq.length === 1)) {
            return [cte1, code1];
        } else {
            var [cte2, code2] = gen_BoolOp_seq(cte, ast, logical_op, expr_seq.slice(1));
            return logical_op(cte, ast, code1, code2);
        };
    };

    function gen_BinOp(cte, ast, op, code1, code2) {
        if (debug) {
            console.log(op);
        };
        if ((op.constructor.name === 'Add')) {
            var sem_op = sem_Add;
        } else {
            if ((op.constructor.name === 'Sub')) {
                var sem_op = sem_Sub;
            } else {
                if ((op.constructor.name === 'Mult')) {
                    var sem_op = sem_Mult;
                } else {
                    if ((op.constructor.name === 'Div')) {
                        var sem_op = sem_Div;
                    } else {
                        if ((op.constructor.name === 'Mod')) {
                            var sem_op = sem_Mod;
                        } else {
                            if ((op.constructor.name === 'FloorDiv')) {
                                var sem_op = sem_FloorDiv;
                            } else {
                                console.assert(false, "gen_BinOp unimplemented operator");
                            };
                        };
                    };
                };
            };
        };

        function code(rte, cont) {
            return code1(rte, (function(rte1, val1) {
                return (code2(rte1, (function(rte2, val2) {
                    return (sem_op(new Context(rte2, cont, ast), val1, val2));
                })));
            }));
        };
        return [cte, code];
    };

    function comp_Compare_Op(op) {
        if ((op.constructor.name === 'Eq')) {
            var sem_op = sem_Eq;
        } else {
            if ((op.constructor.name === 'NotEq')) {
                var sem_op = sem_NotEq;
            } else {
                if ((op.constructor.name === 'Lt')) {
                    var sem_op = sem_Lt;
                } else {
                    if ((op.constructor.name === 'Gt')) {
                        var sem_op = sem_Gt;
                    } else {
                        if ((op.constructor.name === 'LtE')) {
                            var sem_op = sem_LtE;
                        } else {
                            if ((op.constructor.name === 'GtE')) {
                                var sem_op = sem_GtE;
                            } else {
                                console.assert(false, "gen_Compare unimplemented compare");
                            };
                        };
                    };
                };
            };
        };
        return sem_op;
    };

    function gen_Compare(cte, ast, left, comparators, ops) {
        var [cte1, code1] = comp_expr(cte, left);
        var [cte2, code2] = comp_expr(cte, comparators[0]);
        var sem_op1 = comp_Compare_Op(ops[0]);
        if ((ops.length === 1)) {
            return [cte, (function(rte, cont) {
                return (code1(rte, (function(rte1, val1) {
                    return (code2(rte1, (function(rte2, val2) {
                        return (sem_op1(new Context(rte2, cont, ast), val1, val2));
                    })));
                })));
            })];
        } else {
            if ((ops.length === 2)) {
                var [cte3, code3] = comp_expr(cte, comparators[1]);
                var sem_op2 = comp_Compare_Op(ops[1]);

                function retrieve_val1(rte, cont) {
                    function retrieve_val2(rte1, val1) {
                        function retrieve_val3(rte3, val2) {
                            var ctx = new Context(rte, cont, ast);
                            return sem_op1(ctx, val1, val2);
                        };

                        function eval_compare(rte2, val2) {
                            function dispatch(rte3, cond_var) {
                                if (Object.is(cond_var, false)) {
                                    return cont(rte3, cond_var);
                                } else {
                                    return code3(rte3, retrieve_val3);
                                };
                            };
                            var ctx = new Context(rte2, dispatch, ast);
                            return sem_op1(ctx, val1, val2);
                        };
                        return code2(rte1, eval_compare);
                    };
                    return code1(rte, retrieve_val2);
                };
                return [cte, retrieve_val1];
            } else {
                console.assert(false, "not implemented");
            };
        };
    };

    function sem_Add(ctx, val1, val2) {
        function call_expr_end(rte, val) {
            return expr_end(ctx, val);
        };
        var ctx1 = new Context(ctx.rte, call_expr_end, ctx.ast);
        var __val1_add__ = getattribute_from_obj_mro(val1, "__add__");
        if ((__val1_add__ === absent)) {
            var __val2_radd__ = getattribute_from_obj_mro(val2, "__radd__");
            if ((__val2_radd__ === absent)) {
                console.assert(false, "__add__ and __radd__ are absent absent");
            } else {
                return om_call(__val2_radd__, ctx1, [val2, val1]);
            };
        } else {
            return om_call(__val1_add__, ctx1, [val1, val2]);
        };
    };

    function sem_Sub(ctx, val1, val2) {
        function call_expr_end(rte, val) {
            return expr_end(ctx, val);
        };
        var ctx1 = new Context(ctx.rte, call_expr_end, ctx.ast);
        var __val1_sub__ = getattribute_from_obj_mro(val1, "__sub__");
        if ((__val1_sub__ === absent)) {
            var __val2_rsub__ = getattribute_from_obj_mro(val2, "__rsub__");
            if ((__val2_rsub__ === absent)) {
                console.assert(false, "__sub__ and __rsub__ are absent absent");
            } else {
                return om_call(__val2_rsub__, ctx1, [val1, val2]);
            };
        } else {
            return om_call(__val1_sub__, ctx1, [val1, val2]);
        };
    };

    function sem_Mult(ctx, val1, val2) {
        var result = (val1 * val2);
        return expr_end(ctx, result);
    };

    function sem_Div(ctx, val1, val2) {
        var result = (val1 / val2);
        return expr_end(ctx, result);
    };

    function sem_Mod(ctx, val1, val2) {
        var result = (val1 % val2);
        return expr_end(ctx, result);
    };

    function sem_FloorDiv(ctx, val1, val2) {
        var result = ((val1 / val2) >> 0);
        return expr_end(ctx, result);
    };

    function macro_sem_binary_operator_protocol(op, method, rmethod) {
        function sem_comparator(ctx, val1, val2) {
            var __op__ = getattribute_from_obj_mro(val1, method);
            if ((__op__ === absent)) {
                var __rop__ = getattribute_from_obj_mro(val2, rmethod);
                if ((__rop__ === absent)) {
                    console.assert(false, (("TypeError: '" + op) + "' not supported between instances of 'typeof(val1)' and 'typeof(val2)'"));
                } else {
                    return om_call(__rop__, ctx, [val2, val1]);
                };
            } else {
                return om_call(__op__, ctx, [val1, val2]);
            };
        };
        return sem_comparator;
    };
    var sem_Eq = macro_sem_binary_operator_protocol("==", "__eq__", "__ne__");
    var sem_NotEq = macro_sem_binary_operator_protocol("!=", "__ne__", "__eq__");
    var sem_Lt = macro_sem_binary_operator_protocol("<", "__lt__", "__gt__");
    var sem_Gt = macro_sem_binary_operator_protocol(">", "__gt__", "__lt__");
    var sem_LtE = macro_sem_binary_operator_protocol("<=", "__lte__", "__gte__");
    var sem_GtE = macro_sem_binary_operator_protocol(">=", "__gte__", "__lte__");

    function sem_repr(ctx, val1) {
        var __repr__ = getattribute_from_obj_mro(val1, "__repr__");
        console.assert(!(__repr__ === absent), "__repr__ not defined");
        return om_call(__repr__, ctx, [val1]);
    };

    function sem_getattribute(ctx, args) {
        var obj = args[0];
        var name = om_str(args[1]);

        function catch_AttributeError(rte, exn) {
            var __getattr__ = getattribute_from_obj_mro(obj, "__getattr__");
            if ((__getattr__ === absent)) {
                console.assert(false, "raise current exception");
            } else {
                var new_ctx = new Context(rte, ctx.cont, ctx.ast);
                return __getattr__(ctx, args);
            };
        };
        var __getattribute__ = getattribute_from_obj_mro(obj, "__getattribute__");
        return om_call(__getattribute__, ctx, args);
    };

    function sem_call(ctx, args) {
        var self = args[0];
        var params = args[1];
        var __call__ = getattribute_from_obj_mro(self, "__call__");
        return om_call(__call__, ctx, [self].concat(params));
    };

    function gen_constant(cte, ast, val) {
        function code(rte, cont) {
            var obj = box_object(val);
            return sem_constant(new Context(rte, cont, ast), obj);
        };
        return [cte, code];
    };

    function sem_constant(ctx, val) {
        var result = val;
        return expr_end(ctx, result);
    };

    function sem_var_set(ctx, id, val) {
        rte_set(ctx.rte, id, val);
        return stmt_end(ctx);
    };

    function sem_var_get(ctx, id) {
        var result = rte_lookup(ctx.rte, id);
        console.assert(!(result === absent), (("variable " + id) + " not found"));
        return expr_end(ctx, result);
    };

    function sem_bool(ctx, val) {
        var __val_bool__ = getattribute_from_obj_mro(val, "__bool__");
        if ((__val_bool__ === absent)) {
            var __val_len__ = getattribute_from_obj_mro(val, "__len__");
            if ((__val_len__ === absent)) {
                return expr_end(ctx, om_True);
            } else {
                function nonzero(rte, val) {
                    if ((val !== 0)) {
                        var result = om_True;
                    } else {
                        var result = om_False;
                    };
                    return expr_end(ctx, result);
                };
                var ctx1 = new Context(ctx.rte, nonzero, ctx.ast);
                return om_call(__val_len__, ctx1, [val]);
            };
        } else {
            return om_call(__val_bool__, ctx, [val]);
        };
    };

    function gen_funcdef_code(cte, ast, body) {
        function code(rte, args) {
            var [cte1, body_code] = comp_stmt_seq(cte, body);
            return body_code(rte, args);
        };
        return [cte, code];
    };

    function gen_call(cte, ast, code1, code2) {
        function code(rte, cont) {
            return code1(rte, (function(rte1, val1) {
                return (code2(rte1, (function(rte2, val2) {
                    return (sem_call(new Context(rte, cont, ast), [val1, val2]));
                })));
            }));
        };
        return [cte, code];
    };

    function gen_Attribute(cte, ast, code, name) {
        function call_getattribute(rte, cont, obj) {
            var ctx = new Context(rte, cont, ast);
            return sem_getattribute(ctx, [obj, om_str(name)]);
        };

        function code1(rte, cont) {
            return code(rte, (function(rte, val) {
                return (call_getattribute(rte, cont, val));
            }));
        };
        return [cte, code1];
    };

    function expr_end(ctx, val) {
        function call_gui(rte, repr_val) {
            var repr_val_unbox = om_rawget(repr_val, "**value**");
            return gui_wait_for_click(ctx.ast, repr_val_unbox, (function() {
                return (ctx.cont(rte, val));
            }));
        };
        var new_ctx = new Context(ctx.rte, call_gui, ctx.ast);
        return sem_repr(new_ctx, val);
    };

    function stmt_end(ctx) {
        return gui_wait_for_click(ctx.ast, "", (function() {
            return (ctx.cont(ctx.rte));
        }));
    };
    return {
        nocompile: nocompile,
        debug: debug,
        single_step: single_step,
        om_None: om_None,
        om_True: om_True,
        om_False: om_False,
        Context: Context,
        make_frame: make_frame,
        frame_rte: frame_rte,
        frame_cont: frame_cont,
        frame_ast: frame_ast,
        make_rte: make_rte,
        rte_globals: rte_globals,
        rte_locals: rte_locals,
        rte_stack: rte_stack,
        rte_ctrl_env: rte_ctrl_env,
        rte_lookup: rte_lookup,
        rte_set: rte_set,
        unwindReturn: unwindReturn,
        make_signature: make_signature,
        empty_sigature: empty_sigature,
        make_posonly_only_signature: make_posonly_only_signature,
        make_posonly_defaults_only_signature: make_posonly_defaults_only_signature,
        make_vararg_only_signature: make_vararg_only_signature,
        make_posonly_defaults_signature: make_posonly_defaults_signature,
        make_args_defaults_signature: make_args_defaults_signature,
        signature_args: signature_args,
        signature_posonlyargs: signature_posonlyargs,
        signature_varargs: signature_varargs,
        signature_kwonlyargs: signature_kwonlyargs,
        signature_kw_defaults: signature_kw_defaults,
        signature_kwargs: signature_kwargs,
        signature_defaults: signature_defaults,
        signature_arity: signature_arity,
        align_args_with_signature: align_args_with_signature,
        make_dict_from_list: make_dict_from_list,
        dict_set: dict_set,
        class_getattr: class_getattr,
        class_getattribute: class_getattribute,
        class_setattribute: class_setattribute,
        getattribute_from_class_mro: getattribute_from_class_mro,
        getattribute_from_obj_mro: getattribute_from_obj_mro,
        make_class: make_class,
        make_builtin_class: make_builtin_class,
        class_set__mro__: class_set__mro__,
        class__mro__: class__mro__,
        builtin_add_method: builtin_add_method,
        populate_builtin_type: populate_builtin_type,
        populate_builtin_object: populate_builtin_object,
        populate_builtin_WrapperDescriptor: populate_builtin_WrapperDescriptor,
        populate_builtin_MethodWrapper: populate_builtin_MethodWrapper,
        populate_builtin_int: populate_builtin_int,
        populate_builtin_bool: populate_builtin_bool,
        populate_builtin_str: populate_builtin_str,
        populate_builtin_NoneType: populate_builtin_NoneType,
        populate_builtin_FunctionType: populate_builtin_FunctionType,
        object_class: object_class,
        is_om_type: is_om_type,
        om: om,
        om_str: om_str,
        om_int: om_int,
        om_WrapperDescriptor: om_WrapperDescriptor,
        om_MethodWrapper: om_MethodWrapper,
        om_is: om_is,
        om_is_falsy: om_is_falsy,
        om_rawset: om_rawset,
        om_rawget: om_rawget,
        om_call: om_call,
        make_fields: make_fields,
        fields_get: fields_get,
        fields_set: fields_set,
        om_type_call: om_type_call,
        om_type_getattribute: om_type_getattribute,
        om_WrapperDescriptor_get: om_WrapperDescriptor_get,
        om_WrapperDescriptor_call: om_WrapperDescriptor_call,
        om_MethodWrapper_call: om_MethodWrapper_call,
        om_object_getattribute: om_object_getattribute,
        om_object_repr: om_object_repr,
        om_bool_repr: om_bool_repr,
        om_bool_bool: om_bool_bool,
        om_int_bool: om_int_bool,
        om_int_add: om_int_add,
        om_int_radd: om_int_radd,
        om_int_sub: om_int_sub,
        om_int_rsub: om_int_rsub,
        om_int_eq: om_int_eq,
        om_int_ne: om_int_ne,
        om_int_lt: om_int_lt,
        om_int_lte: om_int_lte,
        om_int_gt: om_int_gt,
        om_int_gte: om_int_gte,
        om_int_floordiv: om_int_floordiv,
        om_int_repr: om_int_repr,
        om_NoneType_bool: om_NoneType_bool,
        om_function_call: om_function_call,
        unbox_object: unbox_object,
        box_object: box_object,
        class_type: class_type,
        class_object: class_object,
        class_WrapperDescriptor: class_WrapperDescriptor,
        class_MethodWrapper: class_MethodWrapper,
        class_int: class_int,
        class_bool: class_bool,
        class_NoneType: class_NoneType,
        class_str: class_str,
        class_tuple: class_tuple,
        class_list: class_list,
        class_module: class_module,
        class_function: class_function,
        interp_file: interp_file,
        interp_source: interp_source,
        parse: parse,
        interp: interp,
        comp: comp,
        run: run,
        trampoline: trampoline,
        comp_mod: comp_mod,
        comp_stmt_seq: comp_stmt_seq,
        comp_function_args: comp_function_args,
        gen_function_args_seq: gen_function_args_seq,
        comp_stmt: comp_stmt,
        comp_expr: comp_expr,
        comp_expr_opt: comp_expr_opt,
        gen_signature: gen_signature,
        gen_stmt_seq: gen_stmt_seq,
        gen_stmt_empty: gen_stmt_empty,
        gen_Pass: gen_Pass,
        gen_while: gen_while,
        gen_if: gen_if,
        gen_assert: gen_assert,
        gen_var_set: gen_var_set,
        gen_var_get: gen_var_get,
        gen_Expr: gen_Expr,
        gen_logical_and: gen_logical_and,
        gen_logical_or: gen_logical_or,
        gen_BoolOp: gen_BoolOp,
        gen_BoolOp_seq: gen_BoolOp_seq,
        gen_logical_or: gen_logical_or,
        gen_BoolOp: gen_BoolOp,
        gen_BoolOp_seq: gen_BoolOp_seq,
        gen_BinOp: gen_BinOp,
        comp_Compare_Op: comp_Compare_Op,
        gen_Compare: gen_Compare,
        sem_Add: sem_Add,
        sem_Sub: sem_Sub,
        sem_Mult: sem_Mult,
        sem_Div: sem_Div,
        sem_Mod: sem_Mod,
        sem_FloorDiv: sem_FloorDiv,
        macro_sem_binary_operator_protocol: macro_sem_binary_operator_protocol,
        sem_Eq: sem_Eq,
        sem_NotEq: sem_NotEq,
        sem_Lt: sem_Lt,
        sem_Gt: sem_Gt,
        sem_LtE: sem_LtE,
        sem_GtE: sem_GtE,
        sem_repr: sem_repr,
        sem_getattribute: sem_getattribute,
        sem_call: sem_call,
        gen_constant: gen_constant,
        sem_constant: sem_constant,
        sem_var_set: sem_var_set,
        sem_var_get: sem_var_get,
        sem_bool: sem_bool,
        gen_funcdef_code: gen_funcdef_code,
        gen_call: gen_call,
        gen_Attribute: gen_Attribute,
        expr_end: expr_end,
        stmt_end: stmt_end
    }
})();
