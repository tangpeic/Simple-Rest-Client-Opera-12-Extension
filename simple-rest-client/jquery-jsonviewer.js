/* jQuery wrapper of s-a-s-h's JSON viewer
 * https://addons.opera.com/addons/extensions/details/jsonviewer/1.2/
 * 
 * Copyright 2011 s-a-s-h
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function( $ ){

    var idCounter = 0;

	$.fn.jsonviewer = function(jsonStr) {
		addUi(this[0]);
		jsonStr = trim(jsonStr);
		var json = JSON.parse(jsonStr);
		parseVar(this[0], json, true);
	}
	
	function hasClass(ele,cls) {
		return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
	}
	function addClass(ele,cls) {
		if (!hasClass(ele,cls)) ele.className += " "+cls;
	}
	function removeClass(ele,cls) {
		if (hasClass(ele,cls)) {
			var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
			ele.className=ele.className.replace(reg,' ');
		}
	}
	
    /**
     *
     * @param regionId id of region. All collapsible regions are numbered beginning with 0
     * @param collapse
     */
    function toggle(regionId, collapse) {
        var button = document.getElementById('btn' + regionId);
        if (!isSet(button)) return;
        if (!isSet(collapse)) collapse = hasClass(button, 'toggle-btn-min');
		removeClass(button, (collapse ? 'toggle-btn-min' : 'toggle-btn-plus'));
		addClass(button, (collapse ? 'toggle-btn-plus' : 'toggle-btn-min'));
        //button.innerText = collapse ? '+' : '-';
        var region = document.getElementById('region' + regionId);
        region.style.display = collapse ? 'none' : '';
        var ellipsis = document.getElementById('ellipsis' + regionId);
        ellipsis.style.display = collapse ? '' : 'none';
    }

    function isSet(value) {
        return value != undefined && value != null;
    }

    function toggleAll(collapse) {
        for (var i = 0; i < idCounter; i++) toggle(i, collapse);
    }

    function addTag(parent, options /* tag: string, style: string, class: string, text: string, html: string */) {
        var tagName = options['tag'] || 'span';
        var node = document.createElement(tagName);
        for (var attr in options) {
            var value = options[attr];
            attr = (attr == 'cls') ? 'class' : attr; // workaround to use cls w/o qoutes instead class because class requires quotes
            if (attr == 'tag') {
                // nothing
            } else if (attr == 'text') {
                node.innerText = value;
            } else if (attr == 'html') {
                node.innerHTML = value;
            } else {
                node.setAttribute(attr, value);
            }
        }
        parent.appendChild(node);
        return node;
    }

    function addText(parent, text) {
        var span = document.createElement('span');
        span.innerText = text;
        parent.appendChild(span);
    //    parent.innerText = parent.innerText + text;
    }

    function addStyle(name, params) {
        var text = '';
        var head = document.getElementsByTagName("head")[0];
        for (var key in params) {
            if (text != '') text += '; ';
            var value = params[key];
            if (key == 'content') value = '"' + value + '"';
            text += key + ': ' + value;
        }
        text = name + ' {' + text + '} ';
        addTag(head, { tag: 'style', text: text });
    }

    function addToggleBtn(parent) {
        var btn = addTag(parent, {
            id: 'btn' + idCounter,
            html: '&nbsp;',
            cls: 'toggle-btn toggle-btn-min'
        });
        var id = idCounter;
        btn.onclick = function() {
            toggle(id, null);
        };
    }

    function addCollapsible(parent, prefix, suffix, addToggle) {
        if (addToggle) addToggleBtn(parent);
        addText(parent, prefix);

        var id = idCounter;
        var ellipsis = addTag(parent, {
            id: 'ellipsis' + idCounter,
            text: '...',
            cls: 'ellipsis',
            style: 'display: none'
        });
        ellipsis.ondblclick = function() {toggle(id, false); };

        var res = addTag(parent, {
            tag: 'div',
            id: 'region' + idCounter,
            cls: 'sub-items'
        });
        addText(parent, suffix);
        idCounter++;
        return res;
    }

    function parseMap(parent, map, addBtn) {
        var list = addCollapsible(parent, '{', '}', addBtn);
        var mapSize = 0;
        var key;
        for (key in map) mapSize++;
        var i = 0;
        for (key in map) {
            var value = map[key];
            var collapsible = value instanceof Object || value instanceof Array;
            var node;
            if (collapsible) {
				node = addTag(list, { tag: 'div', cls: 'sub-item' });
			} else {
				node = addTag(list, { tag: 'div' });
			}
            if (collapsible) addToggleBtn(node);
            addTag(node, { text: '"', cls: 'hide-but-copy' });
            addTag(node, { text: key, cls: 'key' });
            addTag(node, { text: '"', cls: 'hide-but-copy' });
            addTag(node, { text: ': ', cls: 'key' });
            parseVar(node, value, !collapsible);
            if (++i < mapSize) addText(node, ',');
        }
    }

    function parseArray(parent, array, addBtn) {
        var list = addCollapsible(parent, '[', ']', addBtn);
        for (var i in array) {
            var node = addTag(list, { tag: 'div', cls: 'sub-item' });
            var value = array[i];
            parseVar(node, value, true);
            if (i < array.length - 1) addText(node, ',');
        }
    }

    function parseString(parent, value) {
	value = JSON.stringify(value);
	value = value.substring(1,value.length-1);
        var r1 = /^(https?|ftps?|mailto|callto):\S+$/i;  // address starting with protocol without spaces
        var r2 = /^(\\\\|\/\/|\w:\\)/i;  // windows/unix remote paths
        var r3 = /^(www|ftp)(\.\w+){2,}/i;
        var r4 = /^[\w.]+\?[\w.]+=/i;
        if (r1.test(value) || r2.test(value) || r3.test(value) || r4.test(value)) {
            addTag(parent, { text: '"', cls: 'hide-but-copy' });
            addTag(parent, { tag: 'a', text: value, href: value, target: 'blank' });
            addTag(parent, { text: '"', cls: 'hide-but-copy' });
        } else {
            addTag(parent, { text: '"' + value + '"', cls: 'string' });
        }
    }

    /**
     *
     * @param parent parent DOM element where to add new elements
     * @param value - value to be pretty printed
     * @param addBtn if value is map or array then this defines if this function adds toggle button
     */
    function parseVar(parent, value, addBtn) {
        if (value == null) {
            addTag(parent, { text: 'null', cls: 'null' });
        } else if (typeof value == 'string') {
            parseString(parent, value);
        } else if (typeof value == 'number') {
            addTag(parent, { text: value, cls: 'number' });
        } else if (typeof value == 'boolean') {
            addTag(parent, { text: value, cls: 'boolean' });
        } else if (value instanceof Array) {
            parseArray(parent, value, addBtn);
        } else if (value instanceof Object) {
            parseMap(parent, value, addBtn);
        }
    }

    function createStyles() {
        addStyle('body', { 'font-family': 'courier new, monospace', 'font-size' : '14px' });
        addStyle('.boolean', { color: 'blue', 'font-weight': 'bold' });
        addStyle('.string', { color: 'blue' });
        addStyle('.number', { color: 'green' });
        addStyle('.null', { color: 'red', 'font-weight': 'bold' });
        addStyle('.key', { 'font-weight' : 'bold' });
        addStyle('.sub-items', { 'margin-left': '20px' });
        addStyle('.toggle-btn', { cursor: 'pointer', font: 'bold', 'margin-right': '10px;', 'margin-left': '-18px' });
        addStyle('.ellipsis', { border: 'gray 1px solid', background: '#d3d3d3' });
    }

    function addUi(parent) {
        addTag(parent, {
            tag: 'a',
            href: '',
            text: 'Collapse all'
        }).onclick = function() { toggleAll(true); return false; };
        addText(parent, ' ');
        addTag(parent, {
            tag: 'a',
            href: '',
            text: 'Expand all'
        }).onclick = function() { toggleAll(false); return false; };
        addTag(parent, { tag: 'br' });
        addTag(parent, { tag: 'br' });
    }

    function msg(message) {
        window.status = message;
    }

    function trim(str) {
        return str == null ? null : str.replace(/^\s+|\s+$/g,"");
    }

    function processJson() {
        var debug = false;
        var nodes = document.body.childNodes;
        if (nodes.length == 0) {
            if (debug) msg('Not json: body has 0 children');
            return;
        }
        var pre = nodes[0];

        if (pre.tagName != 'PRE') {
            if (debug) msg('Not json: expected pre tag but found ' + pre.tagName + ' tag');
            return;
        }
        var jsonStr = pre.innerText;
        if (jsonStr == null) {
            if (debug) msg('Not json: pre\'s inner text is null');
            return;
        }
        jsonStr = trim(jsonStr);
        if (jsonStr.length < 2) {
            if (debug) msg('Not json: shorter than 2 characters (which are needed for brackets)');
            return;
        }
        var first = jsonStr.charAt(0);
        var last = jsonStr.charAt(jsonStr.length - 1);
        if (!(first == '[' && last == ']') && !(first == '{' && last == '}')) {
            if (debug) msg('Not json: it must be surrounded with square or curly brackets');
            return;
        }

        var json = eval('(' + jsonStr + ')');
        if (json == null) {
            if (debug) msg('Not json: eval() failed to parse');
            return;
        }

        document.body.removeChild(pre);
        createStyles();
        addUi(document.body);
        parseVar(document.body, json, false);
        if (debug) msg('JSON parsed successfully');
    }

    // DomContentLoaded doesn't work in extensions when current document is plain document (not DOM).
    // This line can be used in userJS but not in extensions:
    //document.addEventListener('DOMContentLoaded', processJson, false);
    // this is workaround:
    function checkLoaded() {
        setTimeout(function() {
            if (/loaded|complete/i.test(document.readyState)) processJson(); else checkLoaded();
        }, 100);
    }

    // checkLoaded();

})( jQuery );
