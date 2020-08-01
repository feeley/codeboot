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
