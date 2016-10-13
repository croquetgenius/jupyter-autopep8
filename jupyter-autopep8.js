// Copyright (c) Jupyter-Contrib Team.
// Distributed under the terms of the Modified BSD License.

define(function (require, exports, module) {
    'use strict';

    var Jupyter = require('base/js/namespace');
    var keyboard = require('base/js/keyboard');
    var utils = require('base/js/utils');
    var confMod = require('services/config');
    var Cell = require('notebook/js/cell').Cell;
    var CodeCell = require('notebook/js/codecell').CodeCell;

    var add_edit_shortcuts = {};
    var replace_in_cell = false; //bool to enable/disable replacements 
    var exec_code_verbose = true;
    var kName; // name of current kernel
    var kernelLanguage; // language associated with kernel

    var cfg = {code_format_hotkey: 'Ctrl-L'};

    var kMap = { // map of parameters for supported kernels
        python: {
            library: 'import autopep8, re',
            exec: yapf_format,
            post_exec: ''
        }
    };


    function initialize() {
        var base_url = utils.get_body_data("baseUrl");
        var config = new confMod.ConfigSection('notebook', {base_url: base_url});
        config.load();
        config.loaded.then(function config_loaded_callback() {
            for (var key in cfg) {
                if (config.data.hasOwnProperty(key)) {
                    cfg[key] = config.data[key];
                }
            }
            code_format_hotkey();
        })
    }

    function code_exec_callback(msg) {
        if (msg.msg_type == "error") {
            if (exec_code_verbose) alert("CODE prettify extension\n Error: " + msg.content.ename + "\n" + msg.content.evalue);
            return;
        }
        if (replace_in_cell) {
            var ret = msg.content.data['text/plain'];
            for (var i = 1; i < ret.length; i++) {
                if (ret[i - 1] == '\\' && ret[i] == 'n' && (i == 1 || ret[i - 2] != "\\")) {
                    var p = i - 2 >= 0 ? ret.substring(0, i - 1) : "";
                    var s = i + 1 <= ret.length ? ret.substring(i + 1) : "";
                    ret = p + "\n" + s;
                    i = 0;
                }

            }

            ret = ret
                .substring(1, ret.length - 2)
                .replace(/\\'/g, "'")
                .replace(/\\"/g, '"')
                .replace(/\\\//g, '/')
                .replace(/\\x3c/g, '<')
                .replace(/\\x3e/g, '>')
                .replace(/\\\\/g, '\\');
            var selected_cell = Jupyter.notebook.get_selected_cell();
            selected_cell.set_text(String(ret));
        }
    }


    function exec_code(code_input) {
        console.log(code_input);
        Jupyter.notebook.kernel.execute(code_input, {iopub: {output: code_exec_callback}}, {silent: false});
    }


    function yapf_format(index) {
        Jupyter.notebook.select(index);
        var selected_cell = Jupyter.notebook.get_selected_cell();
        if (selected_cell instanceof CodeCell) {
            var text = selected_cell.get_text()
                .replace(/\\n/gm, "$!$") // Replace escaped \n by $!$
                .replace(/\"/gm, '\\"'); // Escape double quote
            var text = selected_cell.get_text();
            text = JSON.stringify(text)
                .replace(/([^\\])\\\\\\n/g, "$1");// [continuation line] replace \ at eol (but result will be on a single line)
            var code_input = 'autopep8.fix_code(' + text + ')';
            //console.log("INPUT",code_input)
            exec_code(code_input, index)
        }
    }

    function autoFormat() {
        replace_in_cell = true;
        kMap[kernelLanguage].exec()
    }


    function code_format_button() {
        if ($('#code_format_button').length == 0) {
            Jupyter.toolbar.add_buttons_group([{
                'label': 'Code formatting',
                'icon': 'fa-legal',
                'callback': autoFormat,
                'id': 'code_format_button'
            }]);
        }
    }

    function code_format_hotkey() {
        add_edit_shortcuts[cfg['code_format_hotkey']] = {
            help: "code formatting",
            help_index: 'yf',
            handler: autoFormat
        };
    }

    function getKernelInfos() {
        kName = Jupyter.notebook.kernel.name;
        kernelLanguage = Jupyter.notebook.metadata.kernelspec.language.toLowerCase();
        var knownKernel = kMap[kernelLanguage];
        if (!knownKernel) {
            $('#code_format_button').remove();
            alert("Sorry; code prettify nbextension only works with a Python, R or javascript kernel");
        } else {
            code_format_button();
            Jupyter.keyboard_manager.edit_shortcuts.add_shortcuts(add_edit_shortcuts);
            replace_in_cell = false;
            exec_code(kMap[kernelLanguage].library)
        }
    }


    function load_notebook_extension() {
        initialize();

        if (typeof Jupyter.notebook.kernel !== "undefined" && Jupyter.notebook.kernel != null) {
            getKernelInfos();
        }

        // only if kernel_ready (but kernel may be loaded before)
        $([Jupyter.events]).on("kernel_ready.Kernel", function () {
            console.log("code_prettify: restarting");
            getKernelInfos();
        });
    }

    return {
        load_ipython_extension: load_notebook_extension
    };
});
