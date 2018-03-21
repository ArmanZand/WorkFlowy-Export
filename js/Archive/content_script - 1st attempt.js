(function(global) {
	var g_timerID;
	var g_textCountFlag;
	var g_CounterMsg = chrome.i18n.getMessage('Clicktocount');
	var g_naviSwitch = true;

	// EP 22/08/17
	function elementsToArray(node) {
		var list = [];
		var e = node.querySelectorAll('div.addedToSelection div.project div.name, div.addedToSelection div.project div.notes, div.addedToSelection div.children div.childrenEnd, div.addedToSelection+div.childrenEnd, div.addedToSelection div.name, div.addedToSelection div.notes');
		// HTML of an item is as follows:
		//
		//<div class="name ">
		//   <a class="bullet" href="/#/18a6fdffe459"></a>
		//   <div class="content" contenteditable="">TITLE</div>
		//   <span class="parentArrow"></span>
		// </div>

		if (e.length == 0) return (elementsToArrayOld(node));

		//list.push({node_forest: [1], level: 0});
		for (var i = 0; i < e.length; i++) {
			if (e[i].matches('div.childrenEnd')) {
				list.push({
					title: '',
					type: 'eoc'
				});
				console.log(list[list.length - 1]);
			} else {
				text = e[i].getElementsByClassName("content")[0];
				if (e[i].className.match('notes') && text.textContent.length > 1) {
					list.push({
						title: text.textContent.replace(/\n+$/g, ''),
						type: 'note',
						children: []
					});
					console.log(list[list.length - 1]);
				} else if (e[i].className.match('name')) {
					list.push({
						title: text.textContent,
						type: 'node',
						url: e[i].querySelector('a').href,
						children: [],
						note: ''
					});
					console.log(list[list.length - 1]);
				}
			}
		}
		console.log("Processed", list.length, "nodes");
		return arrayToTree(list, "    ", "    ");
	}

	function elementsToArrayOld(node) {
		var list = [];
		var e = node.querySelectorAll('div.project div.name, div.project div.notes, div.children div.childrenEnd');
		// HTML of an item is as follows:
		//
		//<div class="name ">
		//   <a class="bullet" href="/#/18a6fdffe459"></a>
		//   <div class="content" contenteditable="">TITLE</div>
		//   <span class="parentArrow"></span>
		// </div>

		/* // title in first line
		list.push({title: e[0].textContent, type: 'title', children: []});

		// notes in first line
		var text = e[1].getElementsByClassName("content")[0];
		if (text.textContent.length > 1) {
		  list.push({title: text.textContent.replace(/\n+$/g,''), type: 'note', children: []});
		} */

		//list.push({node_forest: [1], level: 0});
		for (var i = 0; i < e.length; i++) {
			if (e[i].matches('div.childrenEnd')) {
				list.push({
					title: '',
					type: 'eoc'
				});
			} else {
				text = e[i].getElementsByClassName("content")[0];
				if (e[i].className.match('notes') && text.textContent.length > 1) {
					list.push({
						title: text.textContent.replace(/\n+$/g, ''),
						type: 'note',
						children: []
					});
				} else if (e[i].className.match('name')) {
					list.push({
						title: text.textContent,
						type: 'node',
						url: e[i].querySelector('a').href,
						children: [],
						note: ''
					});
				};
			};
		};
		console.log("Processed", list.length, "nodes");
		return arrayToTree(list, "    ", "    ");
	}

	function arrayToTree(nodes, indent_chars, prefix_indent_chars) {
		var start = 0; //nodes[0].node_forest[0];
		var text = nodes[start].title + "\n";
		var indent = "";
		var level = 0;
		var output;
		var parent = -1;
		var oldestChild;
		var doctype = "OUTLINE";
		console.log("Document type is OUTLINE");
		if ((nodes[start].type == "node") || (nodes[start].type == "note")) console.log("nodes["+start.toString()+"] is of type:", nodes[start].type, ", text is:", nodes[start].title)
				else console.log("nodes["+start.toString()+"] is of type:", nodes[start].type);
			
		for (var i = start+1; i < nodes.length; i++) {
			
			if ((nodes[i].type == "node") || (nodes[i].type == "note")) console.log("nodes["+i.toString()+"] is of type:", nodes[i].type, ", text is:", nodes[i].title)
				else console.log("nodes["+i.toString()+"] is of type:", nodes[i].type);
			
			// Updating level, indentation and heading info 
			if (((i > 1) && (nodes[i-1].type == "title") || (nodes[i-1].type == "node")) && (nodes[i].type == "node")) {
				level = level + 1;	
				console.log("Increase level to " + level.toString());
				oldestChild = i;
				nodes[oldestChild].allSiblings = []; // fill in info when reached eoc
				parent = i-1;
				nodes[parent].myType = "HEADING";
				console.log("Node", parent.toString() , "new type: " + nodes[parent].myType);
				//nodes[i].myType = "item";
				//console.log("Node", i.toString() , "new type: " + nodes[i].myType);
				
			} else if ((i > 2) && (nodes[i-1].type == "note") && (nodes[i].type == "node")) {
				level = level + 1;	
				console.log("Increase level to " + level.toString());
				oldestChild = i;
				nodes[oldestChild].allSiblings = []; // fill in info when reached eoc
				parent = i-2;
				nodes[parent].myType = "HEADING";
				console.log("Node", parent.toString() , "new type: " + nodes[parent].myType);
				
			} else if ((nodes[i-1].type == "node") && (nodes[i].type == "eoc")) {
				nodes[i-1].myType = "ITEM";
				
				// Update sibling info
				nodes[oldestChild].push(i);
					
				console.log("Node", i.toString() + "-1 : new type: " + nodes[i-1].myType);
				
			} else if ((nodes[i-1].type == "eoc") && (nodes[i].type == "eoc")) {
				level = level - 1;
				console.log("Decrease level to " + level.toString());
				
				if (level > 0) parent = nodes[parent].parent;
			}
			
			// Update level info
			nodes[i].level = level;
			if (level > 0) {
				indent = indent_chars;
				if (level > 1) {
					indent = Array(level).join(prefix_indent_chars) + indent_chars;
				}
			} else indent = "";
						
			// Update node parent info and node parent's children as well as notes
			if (nodes[i].type == "node") {
				nodes[i].parent = parent;
				console.log("node[" + i.toString() + "] = " + nodes[i].title + " has now parent", parent);
				if (parent > 0) {
					nodes[parent].children.push(i);
					console.log("node[", parent, "] = " + nodes[parent].title + " has now children", nodes[parent].children);
				}
				else if (parent<0) {
					console.log("all siblings of oldest child node[", oldestChild, "] are", nodes[oldestChild].allSiblings);
					//nodes[0].node_forest.push(i);
					//console.log("node[", parent, "] = " + nodes[parent].title + " has now children", nodes[parent].node_forest);
				}
				else console.log("parent is negative!!!!!!!");
			}
			else if (nodes[i].type == "note") {
				console.log("Set note of item", nodes[i-1].title, "to", nodes[i].title);
				nodes[i-1].note = nodes[i].title;
			}
			
			// Update output 
			if (nodes[i].type == "node") {
				output = indent + nodes[i].title + "\n";
				console.log("Output: ", output);
			} else if (nodes[i].type == "note") {
				output = indent + "[" + nodes[i].title + "]\n";
				console.log("Output: ", output);
			} else output = "";
				
			text = text + output;
			
			// Update level and document info
			nodes[i].level = level;
			if (level < 0) {
				doctype = "FRAGMENT";
				console.log("Document type is FRAGMENT");
			}
		}
		return nodes;
	}
	
	function setCSS(css) {
		if (document.head) {
			var style = document.createElement("style");
			style.innerHTML = css;
			document.head.appendChild(style);
		}
	}

	function loadFontAwesome() {
		var link = document.createElement("link");
		link.href = chrome.extension.getURL("css/theme/font.css");
		link.type = "text/css";
		link.rel = "stylesheet";
		document.getElementsByTagName("head")[0].appendChild(link);
	}

	function injectCSS() {
		chrome.storage.sync.get(["theme_enable", "theme", "custom_css"], function(option) {
			loadFontAwesome();
			if (!option.theme_enable) return;

			if (option.theme != "CUSTOM") {
				var link = document.createElement("link");
				link.href = chrome.extension.getURL("css/theme/" + option.theme + ".css");
				link.type = "text/css";
				link.rel = "stylesheet";
				document.getElementsByTagName("head")[0].appendChild(link);
			}
			if (option.custom_css.length > 0) setCSS(option.custom_css);
		});
	}

	function addTextCounter() {
		var styles = {
			"font-size": "13px",
			color: '#fff',
			"background-image": $("#header").css("background-image"),
			"background-color": $("#header").css("background-color"),
			float: "right"
		};
		styles["padding"] = "8px 20px 8px 0px";
		$('<a></a>', {
			id: 'textCounter'
		}).css(styles).appendTo($("#header"));
		$('#textCounter').html(g_CounterMsg);

		jQuery('#textCounter').click(function() {
			if (g_textCountFlag) {
				clearInterval(g_timerID);
				$('#textCounter').html(g_CounterMsg);
			} else {
				textCounter();
				g_timerID = setInterval(textCounter, 1000);
			}
			g_textCountFlag = !g_textCountFlag;
		});
	}

	function textCounter() {
		var content = elementsToArray(document.querySelector('div.selected'));
		var chars = 0;
		for (var i = 0; i < content.length; i++) {
			if (content[i].type != 'node') continue;
			chars = chars + content[i].title.length;
		}
		var html = chars + ' letters';
		$('#textCounter').html(html);
	}

	function getHtml(list) {
		var html = '';
		for (var i = 0; i < list.length; i++) {
			var url = list[i].url;
			var title = list[i].title.replace(/ - WorkFlowy$/, '');
			html = html.concat('<li><a href="' + url + '">' + title + '</a></li>');
		}
		return html;
	}

	function getRootNode() {
		var tree = $('#bookmark');
		return {
			"tree": tree,
			"node": tree.tree('getNodeById', 1)
		};
	}

	function addNaviSwitch() {
		var styles = {
			"font-size": "13px",
			"background-image": $("#header").css("background-image"),
			"background-color": $("#header").css("background-color"),
			float: "right"
		};
		styles["padding"] = "8px 18px 8px 0px";
		$('<a></a>', {
			id: 'naviSwitch',
			class: 'naviSwitchOn'
		}).css(styles).appendTo($("#header"));

		jQuery('#naviSwitch').click(function() {
			if (g_naviSwitch) {
				$('a#naviSwitch').removeClass('naviSwitchOn');
				$('a#naviSwitch').addClass('naviSwitchOff');
				$('#navigationBar').css("display", "none");
			} else {
				$('a#naviSwitch').removeClass('naviSwitchOff');
				$('a#naviSwitch').addClass('naviSwitchOn');
				$('#navigationBar').css("display", "block");
			}
			g_naviSwitch = !g_naviSwitch;
		});
	}

	function addBookmark(url, title) {
		if (typeof url === "undefined") url = location.href;
		if (typeof title === "undefined") title = document.title;
		var info = getRootNode();
		title = title.replace(/\s\-\sWorkFlowy$/, '');
		info.tree.tree('appendNode', {
			label: title,
			url: url
		}, info.node);
		saveBookmark();
	}

	function addBookmarkFolder() {
		var info = getRootNode();
		var title = window.prompt(chrome.i18n.getMessage('Inputfoldername'), "");
		if (typeof title === "undefined" || title == null || title.length == 0) return;

		info.tree.tree('appendNode', {
			label: title
		}, info.node);
		saveBookmark();
	}

	function saveBookmark() {
		setTimeout(function() {
			var tree = $('#bookmark');
			chrome.storage.sync.set({
				'bookmarks': tree.tree('toJson')
			});
		}, 1000);
	}

	function getSelectedNode() {
		var tree = $('#bookmark');
		return tree.tree('getSelectedNode');
	}

	function deleteBookmark() {
		var node = getSelectedNode();
		if (!node) return;
		if (window.confirm(chrome.i18n.getMessage('ConfirmDelete'))) {
			$('#bookmark').tree('removeNode', node);
			saveBookmark();
		}
	}

	function editBookmark() {
		var node = getSelectedNode();
		if (!node) return;
		var title = window.prompt(chrome.i18n.getMessage('Edittitle'), node.name);
		if (typeof title === "undefined" || title == null || title.length == 0) return;

		var tree = $('#bookmark');
		tree.tree('updateNode', node, title);
		saveBookmark();
	}

	function buildBookmarkTree(bookmarks) {
		// Build Tree
		var bookmarkArea = $('#navigationBar #bookmark');
		bookmarkArea.tree({
			dragAndDrop: true,
			autoOpen: 0,
			keyboardSupport: false,
			data: bookmarks
		});
		bookmarkArea.bind('tree.click',
			function(event) {
				var node = event.node;
				if (typeof node.url !== "undefined") location.href = node.url;
				setTimeout(function() {
					refreshTopicNavi();
				}, 500);
			}
		);
		bookmarkArea.bind('tree.dblclick',
			function(event) {}
		);
		bookmarkArea.bind('tree.move', function(event) {
			saveBookmark();
		});
	}

	function getBookmarkMenu() {
		return '<span id="addBookmark" class="naviMenuItem" title="' + chrome.i18n.getMessage('Addtobookmark') + '"></span>\
            <span id="addFolderLink" class="naviMenuItem" title="' + chrome.i18n.getMessage('Folder') + '"></span>\
            <span id="editLink" class="naviMenuItem" title="' + chrome.i18n.getMessage('Edit') + '"></span>\
            <span id="deleteLink" class="naviMenuItem" title="' + chrome.i18n.getMessage('Delete') + '"></span>';
	}

	function setupBookmarkArea() {
		var bookmarks = [];
		chrome.storage.sync.get(["bookmarks"], function(option) {
			if (!option.bookmarks) {} else {
				bookmarks = JSON.parse(option.bookmarks);
			}
			$('#bookmarkMenu').html(getBookmarkMenu());
			buildBookmarkTree(bookmarks);

			$('#addBookmark').click(function() {
				addBookmark();
				return false
			});
			$('#addFolderLink').click(function() {
				addBookmarkFolder();
				return false
			});
			$('#editLink').click(function() {
				editBookmark();
				return false
			});
			$('#deleteLink').click(function() {
				deleteBookmark();
				return false
			});
		});
	}

	function refreshTopicNavi() {
		var content = elementsToArray(document.querySelector('div.selected'));
		var md = exportLib.toMarkdown(content, {
			outputHeadingLink: true
		});
		var headings = md.match(/^#+ .+?\n/mg);

		if (!headings || headings.length == 0) return;

		var naviMd = '';
		for (var i = 0; i < headings.length; i++) {
			var level = headings[i].match(/^(#+)\s/)[0].length - 2;
			if (level <= 0 || level > 2) continue;
			headings[i].match(/\[([^\]]+?)]/);
			var hd = headings[i].replace(/\[([^\]]+?)]/, '[' + RegExp.$1 + ']');
			naviMd = naviMd + hd.replace(/^#+/, new Array(level).join('\t') + '*');
		}
		var html = marked(naviMd, {
			renderer: exportLib.getRenderer(true)
		});
		$('#navigationBar #topicNavi').html(html);
	}

	function setupTopicNavi() {
		//$('#navigationBar').hover(function () { refreshTopicNavi();}, function() {}); EP -- this and the change in line 298 (main) seems to disable the navigation bar popping up 
	}

	function getContent(callback) {
		var content = elementsToArray(document.querySelector('div.selected'));
		var url = location.href;
		var title = document.title;
		callback({
			content: content,
			url: url,
			title: title
		});
	}

	function createNavigationBar() {
		var navigationBar = '\
  　 <div id="navigationBar">\
       <div class="menuHeader">' + chrome.i18n.getMessage('Topicnavigation') + '</div>\
       <div id="topicNavi"></div>\
       <div class="menuHeader">' + chrome.i18n.getMessage('Bookmark') + '<span id="bookmarkMenu"></span></div>\
       <div id="bookmark"></div>\
     </div>';
		$('body').append(navigationBar);
		addNaviSwitch();
		setupBookmarkArea();
		setupTopicNavi();
	}

	function main() {
		g_textCountFlag = false;

		// show icon in address bar
		chrome.runtime.sendMessage({
			type: 'showIcon'
		}, function() {});

		$(document).ready(function() {
			injectCSS();
			// createNavigationBar(); EP
			addTextCounter();
		});

		chrome.extension.onMessage.addListener(function(msg, sender, callback) {
			switch (msg.request) {
				case 'preview':
					var nodes = elementsToArray(document.querySelector('div.selected'));
					callback({
						html: exportLib.toPreviewHTML(nodes),
						title: document.title
					});
					break;
				case 'getTopic':
					getContent(callback);
					break;
				case 'bookmark':
					addBookmark(msg.info.url, msg.info.title);
					break;
			};
		});
	}
	main();
})();