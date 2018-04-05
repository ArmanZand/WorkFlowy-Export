(function() {
	var g_nodes = null;
	var g_my_nodes = null;
	var g_options = {format: 'text', output_type: "list", rules: []};
	var g_output_notes = false;
	var g_output_toc = false;
	var g_title, g_url;

	function functionRegexFind(txtFind, isRegex, isMatchCase){
		var temp_find="";
		var temp_regexFind = null;
		if(isRegex)
			temp_find = txtFind;
		else
			temp_find = txtFind.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

		if(isMatchCase)
			temp_regexFind = new RegExp(temp_find, "g");
		else
			temp_regexFind = new RegExp(temp_find, "gi");
		return temp_regexFind;
	}

	function FindReplace(txtFind, txtReplace, isRegex, isMatchCase){
		this.regexFind = functionRegexFind(txtFind, isRegex, isMatchCase),
		this.txtReplace = txtReplace
	}

	g_options.findReplace = null;

	g_options.indent_chars = "";
	g_options.prefix_indent_chars = "\t";
	g_options.titleOptions = "titleParents";
	// change option
	function changeOption(type) {
		g_output_notes = document.getElementById("outputNotes").checked;
		g_output_toc = document.getElementById("outputToc").checked;
		changeFormat("indent");
	};

	// change export Mode
	function changeFormat() {
		var text;

		var formatOptions = document.getElementsByName('formatOptions');
		for ( var i = 0; i < formatOptions.length; i++) {
    	if(formatOptions[i].checked) {
				g_options.format = formatOptions[i].value;
        break;
    	}
		}

		var sourceOptions = document.getElementsByName('sourceOptions');
		for ( var i = 0; i < sourceOptions.length; i++) {
			if(sourceOptions[i].checked) {
				g_options.output_type = sourceOptions[i].value;
				break;
			}
		}

		var titleOptions = document.getElementsByName('titleOptions');
		for ( var i = 0; i < titleOptions.length; i++) {
			if(titleOptions[i].checked) {
				g_options.titleOptions = titleOptions[i].value;
				break;
			}
		}

		var indentOptions = document.getElementsByName('indentOptions');
		for ( var i = 0; i < indentOptions.length; i++) {
			if(indentOptions[i].checked) {
				switch (indentOptions[i].value) {
					case "tab":
						g_options.prefix_indent_chars = "\t";
						break;
					case "space":
						g_options.prefix_indent_chars = "    ";
						break;
					case "withoutIndent":
						g_options.prefix_indent_chars = "";
						break;
					case "indentOther":
						g_options.indent_chars = document.getElementById("indentOther").value;
						break;
				}
				break;
			}
		}

		if(document.getElementById("find").value!=""){
			g_options.findReplace = new FindReplace(document.getElementById("find").value, document.getElementById("replace").value, document.getElementById("regex").checked, document.getElementById("matchCase").checked);
		}

		if(document.getElementById("insertLine").checked)
			g_options.item_sep = "\n\n";
		else
			g_options.item_sep = "\n";


		g_options.applyWFERules = document.getElementById("wfeRules").checked;
		g_options.outputToc = document.getElementById("outputToc").checked;
		g_options.outputNotes = document.getElementById("outputNotes").checked;
		g_options.rules.ignore_tags = document.getElementById("stripTags").checked;
		g_options.rules.escapeCharacter = document.getElementById("escapeCharacter").checked;

		console.log("##################### Export the page with options", g_options);
		text = exportLib.toMyText(g_my_nodes, g_options);
		document.getElementById('textArea').innerText = text;
		document.getElementById("popupTitle").innerHTML = makeTitleLabel(g_options.format, g_title, g_url);
		textarea_select();
	};

	function textarea_select() {
		var t = document.getElementById('textArea');
		t.focus();
		t.select();
		setTimeout(function() {
			document.execCommand("copy")
		}, 200);
	};

	function setEventListers() {
		document.getElementById("export").addEventListener("click", function() {
			changeFormat();
		}, false);

		document.getElementById("close").addEventListener("click", function() {
			window.close();
		}, false);

		document.getElementById("addFindReplace").addEventListener("click", function() {
			//changeFormat('addFindReplace');
		}, false);
	}


	function makeTitleLabel(format, title, url) {
		return (format == "markdown") ? '[' + title + '](' + url + ')' : title + ' - ' + url;
	}

	// not use
	function preview() {
		var img = '<img src="' + chrome.extension.getURL('image/space.gif') + '" width="800" height="1" alt="">';
		var html = '<div id="content">' + img + exportLib.toHtml(g_output_toc) + '</div>';
		//$('#contents').load(chrome.extension.getURL("css/theme/"+option.theme+".css");
		$('body').html(html);

		var link = document.createElement("link");
		link.href = chrome.extension.getURL("css/preview/porter.css");
		link.type = "text/css";
		link.rel = "stylesheet";
		document.getElementsByTagName("head")[0].appendChild(link);
	}

	function arrayToTree(nodes, indent_chars, prefix_indent_chars) {
		var start = 0; //nodes[0].node_forest[0]; EP
		var text = nodes[start].title + "\n";
		var indent = "";
		var level = 0;
		var output;
		var parent = -1;
		var root = 0;
		var doctype = "OUTLINE";
		var l = nodes.length;
		var oldestChild = start;

		nodes[start].allSiblings = [start];
		console.log("All siblings of node[" + start.toString() + "]=", nodes[start].allSiblings);
		console.log("Document type is OUTLINE");
		if ((nodes[start].type == "node") || (nodes[start].type == "note")) console.log("nodes[" + start.toString() + "] is of type:", nodes[start].type, ", text is:", nodes[start].title)
		else console.log("nodes[" + start.toString() + "] is of type:", nodes[start].type);

		for (var i = start + 1; i < l; i++) {

			if ((nodes[i].type == "node") || (nodes[i].type == "note")) console.log("nodes[" + i.toString() + "] is of type:", nodes[i].type, ", text is:", nodes[i].title)
			else console.log("nodes[" + i.toString() + "] is of type:", nodes[i].type);

			// Updating level, indentation and heading info
			if (((i > 0) && (nodes[i - 1].type == "title") || (nodes[i - 1].type == "node")) && (nodes[i].type == "node")) {
				level = level + 1;
				console.log("Increase level to " + level.toString());
				parent = i - 1;
				oldestChild = i;
				nodes[oldestChild].allSiblings = []; // fill in info later
				nodes[parent].myType = "HEADING";
				console.log("Node", parent.toString(), "new type: " + nodes[parent].myType);
				nodes[i].myType = "ITEM";
				console.log("Node", i.toString(), "new type: " + nodes[i].myType);

			} else if ((i > 1) && (nodes[i - 1].type == "note") && (nodes[i].type == "node")) {
				level = level + 1;
				console.log("Increase level to " + level.toString());
				parent = i - 2;
				oldestChild = i;
				nodes[oldestChild].allSiblings = []; // fill in info later
				nodes[parent].myType = "HEADING";
				console.log("Node", parent.toString(), "new type: " + nodes[parent].myType);

			} else if ((nodes[i - 1].type == "node") && (nodes[i].type == "eoc")) {
				nodes[i - 1].myType = "ITEM";
				console.log("Node", i.toString() + "-1 : new type: " + nodes[i - 1].myType);

			} else if ((nodes[i - 1].type == "eoc") && (nodes[i].type == "eoc")) {
				level = level - 1;
				console.log("Decrease level to " + level.toString());

				if (level > 0) {
					parent = nodes[parent].parent;
					oldestChild = nodes[parent].children[0];
				} else if (level == 0) parent = -1
				else {
					console.log("dummy node");
					l = nodes.length;
					console.log("insert dummy node: nodes[" + l.toString() + "]");

					parent = l;
					root = l;

					nodes[i - 2].parent = parent;
					console.log("node[" + i.toString() + "-2] = " + nodes[i].title + " has now parent", parent);

					nodes.push({
						type: 'dummy',
						title: null,
						note: '',
						children: [i - 2]
					});
					console.log("node[", parent, "] = " + nodes[parent].title + " has now children", nodes[parent].children);
					console.log("dummy node: nodes[" + l.toString() + "] has title ", nodes[l].title);

					level = level + 1;
					parent = -1;
					doctype = "FRAGMENT"; // #todo don't need this
					console.log("Document type is FRAGMENT");

				}
			}

			// Update level info
			nodes[i].level = level;
			if (level > 0) {
				indent = indent_chars;
				if (level > 1) {
					indent = Array(level).join(prefix_indent_chars) + indent_chars;
				}
			} else indent = "";

			// Update parent and sibling info and create notes
			if (nodes[i].type == "node") {
				if (parent >= 0) {
					console.log("Oldest child is ", oldestChild);
					nodes[oldestChild].allSiblings.push(i);
					console.log("All siblings of node[" + oldestChild.toString() + "]=", nodes[oldestChild].allSiblings);

					nodes[i].parent = parent;
					console.log("node[" + i.toString() + "] = " + nodes[i].title + " has now parent", parent);

					nodes[parent].children.push(i);
					console.log("node[", parent, "] = " + nodes[parent].title + " has now children", nodes[parent].children);
				} else {
					l = nodes.length;
					console.log("insert dummy node:: nodes[" + l.toString() + "]");

					parent = l;
					root = l;

					nodes[i].parent = parent;
					console.log("node[" + i.toString() + "] = " + nodes[i].title + " has now parent", parent);

					nodes.push({
						type: 'dummy',
						title: null,
						note: '',
						children: [0, i]
					});
					console.log("node[", parent, "] = " + nodes[parent].title + " has now children", nodes[parent].children);

					level = level + 1;

					doctype = "FRAGMENT";
					console.log("Document type is FRAGMENT");

				}
			} else if (nodes[i].type == "note") {
				console.log("Set note of item", nodes[i - 1].title, "to", nodes[i].title);
				nodes[i - 1].note = nodes[i].title;
			}

			// Update output
			if (nodes[i].type == "node") {
				output = indent + nodes[i].title + "\n";
				console.log("** Output: ", output);
			} else if (nodes[i].type == "note") {
				output = indent + "[" + nodes[i].title + "]\n";
				console.log("** Output: ", output);
			} else output = "";

			text = text + output;

			// Update level and document info
			nodes[i].level = level;
		}
		return [nodes, root];
	}

	function main() {
		chrome.tabs.query({
			active: true,
			currentWindow: true
		}, function(tabs) {
			chrome.tabs.sendMessage(tabs[0].id, {
				request: 'getTopic'
			}, function(response) {
				g_nodes = response.content;
				g_my_nodes = arrayToTree(g_nodes, "    ", "    ");
				g_title = response.title;
				g_url = response.url;
				changeFormat('text');
			});
		});
		setEventListers();
		//textarea_select();
	}

	window.onload = main;
}());
