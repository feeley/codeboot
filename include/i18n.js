CodeBootVM.prototype.langsUI = [
//    ['de', 'Deutsch'],   // German
    ['en', 'English'],   // English
//    ['es', 'Español'],   // Spanish
    ['fr', 'Français'],  // French
//    ['hi', 'हिन्दी'],       // Hindi
//    ['ja', '日本語'],     // Japanese
//    ['pt', 'Português'], // Portuguese
//    ['zh', '普通话'],     // Mandarin
];

CodeBootVM.prototype.translateDict = {

    '{} step': {
        'de': '{} Schritt',
        'es': '{} paso',
        'fr': '{} pas',
        'hi': '{} कदम',
        'ja': '{} ステップ',
        'pt': '{} degrau',
        'zh': '{} 步',
    },

    '{} steps': {
        'de': '{} Schritte',
        'es': '{} pasos',
        'fr': '{} pas',
        'hi': '{} कदम',
        'ja': '{} ステップ',
        'pt': '{} degraus',
        'zh': '{} 脚步',
    },

    'Delete file "{}"? This cannot be undone.': {
        'de': 'Datei löschen "{}"? Das kann nicht rückgängig gemacht werden.',
        'es': '¿Borrar archivo "{}"? Esto no se puede deshacer.',
        'fr': 'Effacer fichier "{}"? Ceci ne peut être défait.',
        'hi': 'फ़ाइल को हटाएं "{}"? इसे असंपादित नहीं किया जा सकता है।',
        'ja': 'ファイルを削除する "{}"？これは、元に戻すことはできません。',
        'pt': 'Excluir arquivo "{}"? Isto não pode ser desfeito.',
        'zh': '删除文件 "{}"？这不能被撤消。',
    },

    'About codeBoot {}': {
        'de': 'Über codeBoot {}',
        'es': 'Acerca de codeBoot {}',
        'fr': 'À propos de codeBoot {}',
        'hi': 'codeBoot {} के बारे में',
        'ja': 'codeBoot {} について',
        'pt': 'Sobre codeBoot {}',
        'zh': '关于 codeBoot {}',
    },

    'Help': {
        'de': 'Beistand',
        'es': 'Ayuda',
        'fr': 'Aide',
        'hi': 'मदद',
        'ja': 'ヘルプ',
        'pt': 'Ajuda',
        'zh': '帮助',
    },

    'Cancel': {
        'de': 'Abbrechen',
        'es': 'Anular',
        'fr': 'Annuler',
        'hi': 'रद्द करना',
        'ja': 'キャンセル',
        'pt': 'Anular',
        'zh': '取消',
    },

    'OK': {
        'de': 'Akzeptieren',
        'es': 'Aceptar',
        'fr': 'Accepter',
        'hi': 'स्वीकार करना',
        'ja': '受け入れる',
        'pt': 'Aceitar',
        'zh': '接受',
    },

    'Filename must not be empty': {
        'fr': 'Le nom de fichier ne doit pas être vide',
    },

    'Filename must not be an existing file': {
        'fr': 'Le nom de fichier ne doit pas être celui d\'un fichier existant',
    },

    'Close tab': {
        'fr': 'Fermer onglet',
    },

    'Rename file': {
        'fr': 'Renommer fichier',
    },

    'Download file': {
        'fr': 'Télécharger fichier',
    },

    'Share by email': {
        'fr': 'Partager par courriel',
    },

    'Copy to clipboard': {
        'fr': 'Copier au presse-papier',
    },

    'Delete file': {
        'fr': 'Effacer fichier',
    },

    'Editor': {
        'fr': 'Éditeur',
    },

    'Text': {
        'fr': 'Texte',
    },

    'Spreadsheet': {
        'fr': 'Tableur',
    },

    'Language': {
        'fr': 'Langage',
    },

    'New file': {
        'fr': 'Nouveau fichier',
    },

    'Animation speed': {
        'fr': 'Vitesse d\'animation',
    },

    'Slow': {
        'fr': 'Lent',
    },

    'Normal': {
        'fr': 'Normal',
    },

    'Fast': {
        'fr': 'Rapide',
    },

    'Lightning': {
        'fr': 'Éclair',
    },

    'Editing': {
        'fr': 'Édition',
    },

    'Line numbers': {
        'fr': 'Numéros de ligne',
    },

    'Large font': {
        'fr': 'Grande police',
    },

    'Playground': {
        'fr': 'Terrain de jeu',
    },

    'Show drawing window': {
        'fr': 'Afficher fenêtre de dessin',
    },

    'Show pixels window': {
        'fr': 'Afficher fenêtre de pixels',
    },

    'Show chart window': {
        'fr': 'Afficher fenêtre de graphique',
    },

    'Show HTML window': {
        'fr': 'Afficher fenêtre de HTML',
    },

    'Single step/Pause': {
        'fr': 'Un pas/Pause',
    },

    'Execute with animation': {
        'fr': 'Exécuter avec animation',
    },

    'Execute to end': {
        'fr': 'Exécuter jusqu\'à la fin',
    },

    'Stop': {
        'fr': 'Arrêter',
    },

    'Close': {
        'fr': 'Fermer',
    },

    'Clone': {
        'fr': 'Cloner',
    },

};

CodeBootVM.prototype.translate = function (lang, str) {

    var vm = this;

    var x = vm.translateDict[str];

    if (x !== void 0) {
        x = x[lang];
        if (x !== void 0) {
            return x;
        }
    }

    return str;
};

CodeBootVM.prototype.polyglotHTML = function (str, args) {

    var vm = this;

    var HTML = '';

    if (!args) args = [];

    for (var i=0; i<vm.langsUI.length; i++) {
        var lang = vm.langsUI[i][0];
        HTML += '<span class="cb-' + lang + '">' +
                vm.escapeHTML(vm.format(vm.translate(lang, str), args)) +
                '</span>';
    }

    return HTML;
};

CodeBootVM.prototype.format = function (str, args) {

    var vm = this;

    var result = '';
    var i = 0;

    while (i < str.length) {
        var c = str[i++];
        if (c !== '{') {
            result += c;
        } else {
            var j = i;
            while (j < str.length) {
                c = str[j];
                if (!(c >= '0' && c <= '9')) break;
                j++;
            }
            var n = (j === i) ? 1 : parseInt(str.slice(i, j));
            i = j;
            if (i < str.length && c == '}') {
                result += arguments[n];
                i++;
            }
        }
    }

    return result;
};

CodeBootVM.prototype.tformat = function (str) {

    var vm = this;

    return vm.format(vm.translate('fr', str), arguments);
};

CodeBootVM.prototype.escapeHTML = function (str) {

    var vm = this;

    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
};

CodeBootVM.prototype.confirmHTML = function (html, cont) {

    var vm = this;

    var dialog = vm.root.querySelector('.cb-modal-dialog');
    var body = dialog && dialog.querySelector('.modal-body');
    var footer = dialog && dialog.querySelector('.modal-footer');

    if (!body || !footer) {
        // use the builtin confirm dialog, which is unfortunately synchronous
        // and doesn't handle HTML
        cont(window.confirm(html));
    } else {

        body.innerHTML = html;

        var has_confirmed_ok = false;

        function confirm_ok() {
            has_confirmed_ok = true;
            $(dialog).modal('hide');
        }

        var cancel = document.createElement('button');
        cancel.className = 'btn btn-secondary';
        cancel.setAttribute('data-dismiss', 'modal');
        cancel.innerHTML = vm.polyglotHTML('Cancel');

        var ok = document.createElement('button');
        ok.className = 'btn btn-primary';
        ok.innerHTML = vm.polyglotHTML('OK');

        ok.addEventListener('click', confirm_ok);

        footer.innerHTML = '';
        footer.appendChild(cancel);
        footer.appendChild(ok);

        $(dialog).on('hidden.bs.modal', function (event) {
            $(dialog).modal('dispose');
            cont(has_confirmed_ok);
        });

        $(dialog).modal({}); // show the modal dialog
    }
};

CodeBootVM.prototype.alertHTML = function (html, cont) {

    var vm = this;

    var dialog = vm.root.querySelector('.cb-modal-dialog');
    var body = dialog && dialog.querySelector('.modal-body');
    var footer = dialog && dialog.querySelector('.modal-footer');

    if (!cont) cont = function () { };

    if (!body || !footer) {
        // use the builtin alert, which is unfortunately synchronous
        // and doesn't handle HTML
        window.alert(html);
        cont();
    } else {

        body.innerHTML = html;

        function done() {
            $(dialog).modal('hide');
        }

        var ok = document.createElement('button');
        ok.className = 'btn btn-primary';
        ok.innerHTML = vm.polyglotHTML('OK');

        ok.addEventListener('click', done);

        footer.innerHTML = '';
        footer.appendChild(ok);

        $(dialog).on('hidden.bs.modal', function (event) {
            $(dialog).modal('dispose');
            cont();
        });

        $(dialog).modal({}); // show the modal dialog
    }
};
