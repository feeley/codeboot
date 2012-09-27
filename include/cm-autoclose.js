(function() {
    CodeMirror.defaults['autoInsertBracesEnabled'] = true;

    CodeMirror.defineExtension("autoInsertBraces", function(cm) {
        if (cm.getOption('autoInsertBracesEnabled')) {
            var mode = cm.getOption('mode');
            
            if (mode == 'javascript') {
                var pos = cm.getCursor();
                var tok = cm.getTokenAt(pos);
                var state = tok.state;

                if (state.mode && state.mode !== 'javascript') {
                    throw CodeMirror.Pass; // With mixed content, give up
                }
                
                if (tok.string === "{") {
                    cm.replaceSelection("\n\n}");
                    cm.indentLine(pos.line + 1);
                    cm.indentLine(pos.line + 2);
                    cm.setCursor({line: pos.line + 1, ch: cm.getLine(pos.line + 1).length});
                    return;
                }
            }
        }
        
        throw CodeMirror.Pass;
    });
})();
