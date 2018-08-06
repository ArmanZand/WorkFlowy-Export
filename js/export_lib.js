var exportLib = function(nodes, options, title, email, ALIAS) {
	// private method
	var getElement, exportNodesTree, exportNodesTreeBody;
	var d = new Date();
	var date = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getMonth()] + " " + d.getDate() +", " + d.getFullYear();
	var wfe_count={};
	var wfe_count_ID={};
	var TABLE_REGEXP = /^\s*\|/;
	var BQ_REGEXP = /^\>/;
	var LIST_REGEXP = /^((\*|\-|\+)\s|[0-9]+\.\s)/;
	var WF_TAG_REGEXP = /((^|\s|,|:|;|\/)(#|@)[a-z][a-z0-9\-_:]*($|\s|,|;|\/))/i;
	//  the good regex but use XRegExp and don't solve all probleme too.
	//  (^|\s|[(),.!?';:\/\[\]])([#@]([\p{L}\p{Nd}][\p{L}\p{Nd}\-_]*(:([\p{L}\p{Nd}][\p{L}\p{Nd}\-_]*))*))(?=$|\s|[(),.!?';:\/\[\]])
	var WFE_TAG_REGEXP = /(?:^|\s)#wfe-([\w-]*)(?::([\w-:]*))?/ig;
	var counter_item=[0,0,0,0,0,0];
	var counter_enumeration=[[0, null], [0, null], [0, null], [0, null], [0, null], [0, null]];

	var ignore_item = false;
	var ignore_outline = false;
	var verbatim = true;
	var page_break = false;
	var header = "";
	var body = "";
	var footer = "";
	var nodesTree = arrayToTree(nodes);

	var node = nodes;
	console.log("nodesTree :", nodesTree);

	function WFE(name, parameter=null){
		this.name = name.toLowerCase();
		this.parameter = (parameter==null) ? null : parameter.toLowerCase().split(":");
		this.toString = function(){
			if(typeof WFE_FUNCTION["wfe-"+this.name] == "function"){
				var args = this.parameter;
				console.log("WFE", this.name, args);
				return WFE_FUNCTION["wfe-"+this.name].apply( this, args );
			}
			console.log("WFE no function ", name);
			return "";
		}
	}
	var WFE_FUNCTION = {
		"wfe-testLog": function(p1="A",p2="B",p3="C"){
			return p1+p2+p3;
		},
		"wfe-count": function(name_counter="", name_item="", init=null){
			if(init && !isNaN(init)) wfe_count[name_counter]=parseInt(init)-1;
			if(!wfe_count[name_counter])
				wfe_count[name_counter]=0;
			  wfe_count[name_counter]++;
			if(name_item)
		 		wfe_count_ID[name_counter+":"+name_item]=wfe_count[name_counter];
			return wfe_count[name_counter];
		},
		"wfe-refLast": function(name_counter=""){
			if(wfe_count[name_counter])
				return wfe_count[name_counter];
			return "NaN";
		},
		"wfe-ref": function(name_counter="", name_item=""){
			if(wfe_count_ID[name_counter+":"+name_item])
				return wfe_count_ID[name_counter+":"+name_item];
			return "NaN";
		},
		"wfe-ignore-tags": function(bool=true){
			options.ignore_tags = bool;
			return "";
		},
		"wfe-ignore-item": function(bool=true){
			ignore_item = bool;
			return "";
		},
		"wfe-ignore-outline": function(bool=true){
			ignore_outline = bool;
			return "";
		},
		"wfe-page-break": function(bool=true){
			page_break = bool;
			return "";
		},
		"wfe-style":function(style="Normal"){
			console.log("change style by WFE-style", style, allStyle);
			style = style.charAt(0).toUpperCase() + style.slice(1);
			if(allStyle.hasOwnProperty(style)) {
				node.style = allStyle.get(style);
				node.styleName = allStyle.getName(style);

				if(options.complete && node.complete)
					node.style.changeType("Complete");
				else if(options.complete && node.parent.style && (node.parent.style.type=="Complete" || node.parent.style.type=="CompleteChild"))
					node.style.changeType("CompleteChild");
			}
			return "";
		},

		"wfe-text-align":function(value="left"){
			var property ="aligement";
			if(value.toUpperCase()=="LEFT" || value.toUpperCase()=="L") node.style[property] = "left";
			else if(value.toUpperCase()=="RIGHT" || value.toUpperCase()=="R") node.style[property] = "right";
			else if(value.toUpperCase()=="CENTER" || value.toUpperCase()=="C") node.style[property] = "center";
			else if(value.toUpperCase()=="JUSTIFIED" || value.toUpperCase()=="J") node.style[property] = "justified";
			return "";
		},
		"wfe-indent-first":function(value=0){
			var property ="indentation_first_line";
			if(!isNaN(value)) node.style[property] = value;
			return "";
		},
		"wfe-indent-left":function(value=0){
			var property ="indentation_left";
			if(!isNaN(value)) node.style[property] = value;
			return "";
		},
		"wfe-indent-right":function(value=0){
			var property ="indentation_right";
			if(!isNaN(value)) node.style[property] = value;
			return "";
		},
		"wfe-line-spacing-before":function(value=0){
			var property ="spacing_before";
			if(!isNaN(value)) node.style[property] = value;
			return "";
		},
		"wfe-line-spacing-after":function(value=0){
			var property ="spacing_after";
			if(!isNaN(value)) node.style[property] = value;
			return "";
		},
		"wfe-font-face":function(value="Arial"){
			var property ="font";
			value = value.toUpperCase().replaceAll("_", " ");
			if(allFont.hasOwnProperty(value) > -1) node.style[property] = value;
			return "";
		},
		"wfe-font-size":function(value=11){
			var property ="font_size";
			if(!isNaN(value)) node.style[property] = value;
			return "";
		},
		"wfe-font-weight":function(value="Normal"){
			var property ="bold";
			if(value.toUpperCase()=="BOLD") node.style[property] = true;
			else if(value.toUpperCase()=="NORMAL") node.style[property] = false;
			return "";
		},
		"wfe-font-style":function(value="Normal"){
			var property ="italic";
			if(value.toUpperCase()=="ITALIC") node.style[property] = true;
			else if(value.toUpperCase()=="NORMAL") node.style[property] = false;
			return "";
		},
		"wfe-text-decoration":function(value="Normal"){
			if(value.toUpperCase()=="UNDERLINE") node.style["underline"] = true;
			else if(value.toUpperCase()=="STRIKE") node.style["strike"] = true;
			else if(value.toUpperCase()=="NORMAL"){
				node.style["underline"] = false;
	 			node.style["strike"] = false;
			}
			return "";
		},
		"wfe-font-color":function(value="Black", hex){
			var property ="color";
			value = value.toUpperCase();
			if(value == "RGB" && /^([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');

				var newColorName = "Color"+c;
				COLORSHEETused.addColor(newColorName, [(c>>16)&255, (c>>8)&255, c&255]);
				node.style[property] = newColorName;
			}
			else if(allColor.hasOwnProperty(value)) node.style[property] = value;
			return "";
		},
		"wfe-background":function(value="White", hex){
			var property ="background_color";
			value = value.toUpperCase();
			if(value == "RGB" && /^([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');

				var newColorName = "Color"+c;
				COLORSHEETused.addColor(newColorName, [(c>>16)&255, (c>>8)&255, c&255]);
				node.style[property] = newColorName;
			}
			else if(allColor.hasOwnProperty(value)) node.style[property] = value;
			return "";
		},
		"wfe-scope": function(type="item"){
			type = type.toUpperCase();
			if(type=="ITEM"){
			}
			else if(type=="OUTLINE"){
				node.scopeNode = node;
			}
			return "";
		},
		"wfe-email": function(){
			return email;
		},

		"wfe-verbatim": function(){
			verbatim = false;
			return "";
		},

		"wfe-beamer-slide": function(){
			if(allStyle.hasOwnProperty("Frame") && (node.styleName=="Title" || node.styleName=="Section" || node.styleName=="Subsection")) {
				node.style = allStyle.get("Frame");
				node.styleName = allStyle.getName("Frame");
			}
			return "";
		}
	}

	var ALIASmdSyntax_enumList = [
		[/^1\. /, /^2\. /, /^3\. /, /^4\. /, /^5\. /, /^6\. /, /^7\. /, /^8\. /, /^9\. /, /^10\. /, /^11\. /, /^12\. /, /^13\. /, /^14\. /, /^15\. /, /^16\. /, /^17\. /, /^18\. /, /^19\. /, /^20\. /],
		[/^\(a\) /, /^\(b\) /, /^\(c\) /, /^\(d\) /, /^\(e\) /, /^\(f\) /, /^\(g\) /, /^\(h\) /, /^\(i\) /, /^\(j\) /, /^\(k\) /, /^\(l\) /, /^\(m\) /, /^\(n\) /, /^\(o\) /, /^\(p\) /, /^\(q\) /, /^\(r\) /, /^\(s\) /, /^\(t\) /],
		[/^\(i\) /, /^\(ii\) /, /^\(iii\) /, /^\(iv\) /, /^\(v\) /, /^\(vi\) /, /^\(vii\) /, /^\(viii\) /, /^\(ix\) /, /^\(x\) /, /^\(xi\) /, /^\(xii\) /, /^\(xiii\) /, /^\(xiv\) /, /^\(xv\) /, /^\(xvi\) /, /^\(xvii\) /, /^\(xviii\) /, /^\(xix\) /, /^\(xx\) /],
	]
	var ALIASmdSyntax_enumList_index = [0,0,0,0,0,0,0];
	var ALIASmdSyntax_item = /^[\*|\-|\+] /;
	var ALIASmdSyntax_item_index = 999;
	var ALIASmdSyntax = [
		[/^# /,"#wfe-style:Heading1 "],
		[/^## /,"#wfe-style:Heading2 "],
		[/^### /,"#wfe-style:Heading3 "],
		[/^#### /,"#wfe-style:Heading4 "],
		[/^##### /,"#wfe-style:Heading5 "],
		[/^###### /,"#wfe-style:Heading6 "]
	];

	var ESCAPE_CHARACTER = {
			text: [["",""]],
			markdown: [["\\","\\\\"],["`","\\`"],["*","\\*"],["_","\\_"],["{","\\{"],["}","\\}"],["[","\\["],["]","\\]"],["(","\\("],[")","\\)"],["#","\\#"],["+","\\+"],["-","\\-"],[".","\\."],["!","\\!"]],
			html: [["&","&amp;"],[">","&gt;"],["<","&lt;"],["\"","&quot;"],["\'","&#39;"]],
			latex: [["\\","\\textbackslash "],["ˆ","\\textasciicircum "],["&","\\&"],["%","\\%"],["$","\\$"],["#","\\#"],["_","\\_"],["{","\\{"],["}","\\}"]],
			beamer: [["\\","\\textbackslash "],["ˆ","\\textasciicircum "],["&","\\&"],["%","\\%"],["$","\\$"],["#","\\#"],["_","\\_"],["{","\\{"],["}","\\}"]],
			opml: [["&","&amp;"],[">","&gt;"],["<","&lt;"],["\"","&quot;"],["\'","&#39;"]],
			rtf: [["\\","\\\\"],["{","\\{"],["}","\\}"]]
		};

	getElement = function(line) {
		var e;
		if (line.match(TABLE_REGEXP)) e = "TABLE";
		else if (line.match(BQ_REGEXP)) e = "QUOTE";
		else if (line.match(LIST_REGEXP)) e = "LIST";
		else e = "PARAGRAPH";
		return e;
	};

	//create a regular expression with txtFind isRegex and isMatchCase
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

	var regexMdSyntax = /((?:_.*_)|(?:\*.*\*)|(?:~.*~))/g;

	var regexCode=/`([^`]*)`/g;
	function Code(text){
		this.text=text;
		this.toString = function(format = "text"){
			switch(format){
				case "html" : return "<code style=\"background-color: #d3d3d3;\"> &nbsp;"+this.text+" </code>";
				case "rtf" : return "{\\f2\\cf4\\highlight5 "+this.text+"}";
				case "latex": return "\\verb|"+this.text+"|";
				case "beamer" : return this.toString("latex");
				default : return "`"+this.text+"`";
			}
		}
	}

	var regexCodeLatex=/\$([^$]*)\$/g;
	function CodeLatex(text){
		this.text=text;
		this.toString = function(format = "text"){
			switch(format){
				case "html" : return "<code style=\"background-color: #d3d3d3;\"> &nbsp;"+this.text+" </code>";
				case "rtf" : return "{\\f2\\cf4\\highlight5 "+this.text+"}";
				case "latex": return "$"+this.text+"$";
				case "beamer" : return this.toString("latex");
				default : return "`"+this.text+"`";
			}
		}
	}

	var regexImage = /!\[([^\]]*)\]\(([^\)]*)\)/g;
	function Image(text, link){
		this.link=link;
		this.text=text;
		this.toString = function(format = "text"){
			switch(format){
				case "html" : return "<img src=\""+this.link+"\"  title=\""+this.text+"\"><br /><span style=\"font-style: italic; font-size: 0.9em; color:gray;\">"+this.text+"</span>";
				case "text" : return this.text + " : " +  this.link;
				case "rtf" : return this.toString("text"); //TODO
				case "latex" : return "\\begin{figure}[t]\\includegraphics["+((this.text == "") ? "width=.75\\textwidth" : this.text)+"]{"+this.link+"}\\centering \\end{figure}";
				case "beamer" : return this.toString("latex");
				default : return "!["+this.text+"]("+this.link+")";
			}
		}
	}

	var regexLink = /\[([^\]]*)\]\(([^\)\s]*)(?: ([^\)\s]*))?\)/g;
	function Link(text, link, link2){
		this.link=link;
		this.link2=link2;
		this.text=text;
		this.toString = function(format = "text"){
			switch(format){
				case "html" : return "<a href=\""+this.link+"\" target=\"_blank\">"+this.text+"</a>";
				case "text" : return this.text + " : " +  this.link;
				case "rtf" : return "{\\field{\\*\\fldinst HYPERLINK "+this.link+" }{\\fldrslt\\cf3\\ul "+this.text+"}}";
				case "latex" : return "\\href{"+(this.link2 ? this.link2 : this.link)+"}{"+this.text+"}";
				case "beamer" : return this.toString("latex");
				case "markdown" : return "["+this.text+"]("+this.link+")";
				default : return "["+this.text+"]("+this.link+(this.link2 ? " " + this.link2 : "")+")";
			}
		}
	}

	function insertObj(textList, regex, Obj){
		var result = [];
	  textList.forEach(function(e){
	    	if(e instanceof TextExported){
					var text = e.text;
	        var match = regex.exec(text);
	        var i_prev = 0;
	        while(match!=null){
	          var i = match.index;
	          if(i!=i_prev){
							result.push(new TextExported(text.slice(i_prev, i), e.isUnderline, e.isBold, e.isItalic, e.isStrike));
						}
	          i_prev= regex.lastIndex;
	          result.push(new Obj(...match.slice(1), e));
	          match = regex.exec(text);
	        }
	        if(text.length!=i_prev){
						result.push(new TextExported(text.slice(i_prev, text.length), e.isUnderline, e.isBold, e.isItalic, e.isStrike));
					}
	      }
	      else{
	      	result.push(e);
	      }
	  	});
		result = flatten(result);
		return result;
	}

	function flatten(arr) {
  	return arr.reduce(function (flat, toFlatten) {
    	return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  	}, []);
	}


	function textListToText(textList){
		var result = "";
		textList.forEach(function(e){
			result += e.toString(options.format);
		});
		return result;
	}

	function textListApply(textList, f, args){
    textList.forEach(function(e, i){
      if(e instanceof TextExported)
        textList[i].text = f.apply(textList[i].text , args);
		});
	}

	exportNodesTree = function(nodesTree, options) {
		allStyle = defaultSTYLESHEET.get(options.format);

		options.findReplace.forEach(function(e) {
			if(e!=null){
				e.regexFind = functionRegexFind(e.txtFind, e.isRegex, e.isMatchCase);
			}
		});

		applyRulesNodesTree(nodesTree, options);
		ESCAPE_CHARACTER[options.format].forEach(function(e) {
			title = title.replaceAll(e[0], e[1]);
		});
		var HEADER = {
			text: "",
			markdown: "",
			html: "<!DOCTYPE html>\n<html>\n  <head>\n    <title>" + title + "</title>\n    <style>\n body {margin:72px 90px 72px 90px;}\n img {max-height: 1280px;max-width: 720px;}\n div.page-break {page-break-after: always}\n" + STYLESHEETused.toHTMLstr() + "\n    </style>\n  </head>\n  <body>\n",
			latex: "\\documentclass{article}\n \\usepackage{blindtext}\n \\usepackage[utf8]{inputenc}\n  \\usepackage{ulem}\n \\usepackage{xcolor}\n \\usepackage{tcolorbox} \n\\setlength{\\parindent}{0pt}\n" + COLORSHEETused.toLATEXstr() + "\n \\title{"+title+"}\n \\author{"+email+"}\n \\date{"+date+"}\n \\begin{document}\n \\maketitle\n",
			beamer: "\\documentclass{beamer}\n \\usepackage{ulem}\n \\usepackage{xcolor}\n \\usepackage{tcolorbox} \n\\setlength{\\parindent}{0pt}\n" + COLORSHEETused.toLATEXstr() + "\n \\usetheme{Goettingen}\n \\title{"+title+"}\n \\author{"+email+"}\n \\date{"+date+"}\n \\begin{document}\n \\begin{frame} \\maketitle \\end{frame}\n \\begin{frame}{Table of Contents} \\tableofcontents \\end{frame}\n",
			opml: "<?xml version=\"1.0\"?>\n<opml version=\"2.0\">\n  <head>\n    <ownerEmail>"+email+"</ownerEmail>\n  </head>\n  <body>\n",
			rtf: "{\\rtf1\\ansi\\deff0\n"+
			     FONTSHEETused.toRTFstr()+"\n"+
			     COLORSHEETused.toRTFstr()+"\n"+
			     STYLESHEETused.toRTFstr()+"\n"
		};
		var FOOTER = {
			text: "",
			markdown: "",
			html: "  </body>\n</html>",
			latex: "\\end{document}",
			beamer: "\\end{document}",
			opml: "  </body>\n</opml>",
			rtf: "}"
		};
		// Set default rules
		ignore_item = false;
		ignore_outline = false;
		verbatim= true;
		page_break = false;

		// Create header text
		if(!options.fragment) header = HEADER[options.format];
		console.log("header", header);

		// Create footer text
		if(!options.fragment) footer = FOOTER[options.format];
		console.log("footer", footer);

		// Create body text
		console.log("convert node to text : ", nodesTree, options);
		body = exportNodesTreeBody(nodesTree, options);

		wfe_count={};
		wfe_count_ID={};
		counter_enumeration=[[0, null], [0, null], [0, null], [0, null], [0, null], [0, null]];
		allStyle = {};
		STYLESHEETused = copy(STYLESHEET);
		FONTSHEETused = copy(FONTSHEET);
		COLORSHEETused = copy(COLORSHEET);
		return header + body + footer;
	}

	function applyRulesNodesTree(l_node, options){
		node = l_node;
		if(node.type != "dummy"){
			node.level=node.parent.level+1;

			if(!node.scopeNode && node.parent.scopeNode) node.scopeNode = node.parent.scopeNode;

			if(!options.outputNotes)node.note = [];
			// Not a dummy node
			if(node.children.length != 0){
				node.styleName = options.parentDefaultItemStyle;
				node.indentChars = options.parentIndent_chars;
			}
			else{
				node.styleName = options.childDefaultItemStyle;
				node.indentChars = options.childIndent_chars;
			}
			if(node.indentChars == "") node.indentChars = "-";

			if(node.level>6) node.level=6;

			if(node.scopeNode){
				node.styleName = copy(node.scopeNode.styleName);
				node.style = copy(node.scopeNode.style);
			}
			else{
				switch(options.format){
					case "beamer" :
						if(node.parent.type != "dummy" && (node.parent.styleName!="Title" && node.parent.styleName!="Section" && node.parent.styleName!="Subsection")){
							if(node.styleName == "Bullet")
								node.styleName = "Item";
							else if(node.styleName == "Enumeration")
								node.styleName = "Enumeration";
							else if(node.styleName == "Heading")
								node.styleName = "Heading";
							else
								node.styleName = "Normal";
							break;
						}
						else {
							var frameLevel=2;
							if(frameLevel >= 3 && node.level == 0 && node.children.length != 0) node.styleName = "Title";
							else if (frameLevel >= 2 && node.parent.type != "dummy" && node.parent.styleName=="Section"  && node.children.length != 0) node.styleName = "Subsection";
							else if (frameLevel >= 1 && (node.parent.type == "dummy" || node.parent.styleName=="Title")  && node.children.length != 0) node.styleName = "Section";
							else node.styleName = "Frame";
						}
						break
					case "latex" :
						if(node.styleName == "Heading" && node.level<3)
							node.styleName = "Heading"+(node.level+1)
						else if(node.styleName == "Bullet")
							node.styleName = "Item";
						else if(node.styleName == "Enumeration")
							node.styleName = "Enumeration";
						else
							node.styleName = "Normal";
						break
					case "html" :
						if(node.styleName == "Heading")
							node.styleName = "Heading"+(node.level+1)
						else if(node.styleName == "Bullet")
							node.styleName = "Item";
						else if(node.styleName == "Enumeration")
							node.styleName = "Enumeration";
						else
							node.styleName = "Normal";
						break
					case "rtf" :
						if(node.styleName == "Heading")
							node.styleName = "Heading"+(node.level+1)
						else if(node.styleName == "Bullet")
							node.styleName = "Item"+(node.level+1);
						else if(node.styleName == "Enumeration")
							node.styleName = "Enumeration"+(node.level+1);
						else
							node.styleName = "Normal";
						break
					case "markdown" :
						if(node.styleName == "Heading")
							node.styleName = "Heading"+(node.level+1)
						else if(node.styleName == "Bullet")
							node.styleName = "Item"+(node.level+1);
						else if(node.styleName == "Enumeration")
							node.styleName = "Enumeration"+(node.level+1);
						else
							node.styleName = "Normal";
						break
					case "text" :
						if(node.styleName == "Bullet")
							node.styleName = "Item"+(node.level+1);
						else if(node.styleName == "Enumeration")
							node.styleName = "Enumeration"+(node.level+1);
						else
							node.styleName = "Normal";
						break
					default :
						node.styleName = "Normal";
				}

				node.style = allStyle.get(node.styleName);
				if(options.complete && node.complete)
					node.style.changeType("Complete");
				else if(options.complete && node.parent.style && (node.parent.style.type=="Complete" || node.parent.style.type=="CompleteChild"))
					node.style.changeType("CompleteChild");
			}

			node.title.forEach(function(e, i) {
				node.title[i] = (new TextExported(e.text, e.isUnderline, e.isBold, e.isItalic, e.isStrike));
			});

			node.note.forEach(function(e, i) {
				node.note[i] = (new TextExported(e.text, e.isUnderline, e.isBold, e.isItalic, e.isStrike));
			});

			//find and Replace
			options.findReplace.forEach(function(e) {
				//console.log("apply find and replace",e);
				if(e!=null){
					textListApply(node.title, "".replace, [e.regexFind, e.txtReplace]);
					textListApply(node.note, "".replace, [e.regexFind, e.txtReplace]);
				}
			});

			if (options.applyWFERules)
			{
				// Assign new rules from WFE-tags in item

				ALIAS.forEach(function(e) {
					textListApply(node.title, "".replaceAll, ['#'+e[1], e[0]]);
					textListApply(node.note, "".replaceAll, ['#'+e[1], e[0]]);
				});

				if(options.mdSyntax){

					textListApply(node.title, "".replace, [/\\(.)/ig, function(e,$1){
						var r = $1.charCodeAt(0).toString(16);
						r = Array(5-r.length).join("0")+r;
						return "\\u"+r;
					}]);

					textListApply(node.note, "".replace, [/\\(.)/ig, function(e,$1){
						var r = $1.charCodeAt(0).toString(16);
						r = Array(5-r.length).join("0")+r;
						return "\\u"+r;
					}]);



					ALIASmdSyntax_enumList.forEach(function(e,i){
			      if(node.title[0] instanceof TextExported){
			        if(e[ALIASmdSyntax_enumList_index[node.level]].test(node.title[0].text)){
								node.title[0].text = node.title[0].text.replace(e[ALIASmdSyntax_enumList_index[node.level]], "#wfe-style:Enumeration"+(i+1)+" ");
								ALIASmdSyntax_enumList_index[node.level] ++;
							}
						}
					});
		      if(node.title[0] instanceof TextExported){
		        if(ALIASmdSyntax_item.test(node.title[0].text)){
							if(ALIASmdSyntax_item_index > node.level) ALIASmdSyntax_item_index = node.level;
							node.title[0].text = node.title[0].text.replace(ALIASmdSyntax_item, "#wfe-style:Item"+(node.level+1 - ALIASmdSyntax_item_index)+" ");
						}
						else ALIASmdSyntax_item_index=999;
					}
					ALIASmdSyntax.forEach(function(e) {
						textListApply(node.title, "".replace, [e[0], e[1]]);
						textListApply(node.note, "".replace, [e[0], e[1]]);
					});
				}

				textListApply(node.title, "".replace, [WFE_TAG_REGEXP, function(e,$1,$2){
					var wfe = new WFE($1,$2);
					return wfe.toString();
				}]);

				textListApply(node.note, "".replace, [WFE_TAG_REGEXP, function(e,$1,$2){
					var wfe = new WFE($1,$2);
					return wfe.toString();
				}]);
			}

			if (options.ignore_tags) {
				// Strip off tags
				textListApply(node.title, "".replaceTag, [WF_TAG_REGEXP, " "]);
				textListApply(node.note, "".replaceTag, [WF_TAG_REGEXP, " "]);
			}

			node.title=insertObj(node.title, regexCodeLatex, CodeLatex);
			node.note=insertObj(node.note, regexCodeLatex, CodeLatex);

			if(options.mdSyntax){
				node.title=insertObj(node.title, regexCode, Code);
				node.title=insertObj(node.title, regexImage, Image);
				node.title=insertObj(node.title, regexLink, Link);
				node.title=insertObj(node.title, regexMdSyntax, mdSyntaxToList);

				node.note=insertObj(node.note, regexCode, Code);
				node.note=insertObj(node.note, regexImage, Image);
				node.note=insertObj(node.note, regexLink, Link);
				node.title=insertObj(node.title, regexMdSyntax, mdSyntaxToList);


				textListApply(node.title, "".replace, [/\\u([\dA-F]{4})/gi, function(e,$1){
					return String.fromCharCode(parseInt($1, 16));
				}]);

				textListApply(node.note, "".replace, [/\\u([\dA-F]{4})/gi, function(e,$1){
					return String.fromCharCode(parseInt($1, 16));
				}]);
			}

			console.log("style :", node.style);
			STYLESHEETused.addStyle(node.styleName);
			if(node.note.length != 0) STYLESHEETused.addStyle("Note");
			if((STYLESHEETused[node.styleName] instanceof Style_rtf) && (node.style instanceof Style_rtf)) node.style.id = STYLESHEETused[node.styleName].id;
			COLORSHEETused.addColor(node.style.color);
			COLORSHEETused.addColor(node.style.background_color);
			FONTSHEETused.addFont(node.style.font);

			if((node.style instanceof Style_Bullet) || (node.style instanceof Style_rtf)){
				var i=-1;
				switch (node.style.name) {
					case "Enumeration1" :
						i=0;
						break;
					case "Enumeration2" :
						i=1;
						break;
					case "Enumeration3" :
						i=2;
						break;
					case "Enumeration4" :
						i=3;
						break;
					case "Enumeration5" :
						i=4;
						break;
					case "Enumeration6" :
						i=5;
						break;
				}
				if(i!= -1){
					if(counter_enumeration[i][1] != node.parent)	counter_enumeration[i]=[0, node.parent];
					counter_enumeration[i][0]++;
					if(node.style instanceof Style_Bullet) node.style.bullet=counter_enumeration[i][0]+". ";
					else if (node.style instanceof Style_rtf) node.style.counter = counter_enumeration[i][0];
				}
				else if(node.style.name.includes("Item")){
					node.style.bullet = node.indentChars + " ";
				}
			}

			node.indent = Array(node.level+1).join(options.prefix_indent_chars);

			if(verbatim){
				ESCAPE_CHARACTER[options.format].forEach(function(e) {
					textListApply(node.title, "".replaceAll, [e[0], e[1]]);
					textListApply(node.note, "".replaceAll, [e[0], e[1]]);
				});
			}
		}
		node.page_break = page_break;
		if(ignore_outline){
			node.parent.children.remove(node);
			node.children = [];
		}
		else if(ignore_item) {
			for(var i=0; i<node.children.length; i++){
		    node.children[i].parent = node.parent;
				node.children[i].scopeNode = node.scopeNode;
		  }
			node.parent.children.replace(node, node.children);
		}
		ignore_item = false;
		ignore_outline = false;
		verbatim = true;
		page_break = false;

		node.doneApplyRulesNodesTree=true; //rapide fix !  Don't exacly understand why with ignore item the children are call applyRulesNodesTree twice
		var i = 0;
		while(i < l_node.children.length){
			var childNode = l_node.children[i];
			ALIASmdSyntax_enumList_index.forEach(function(e,j){
				if(j>childNode.level) ALIASmdSyntax_enumList_index[j]=0;
			})
			if(!childNode.doneApplyRulesNodesTree) applyRulesNodesTree(childNode, options);
			if(childNode == l_node.children[i])i++;
		}
	}

	exportNodesTreeBody = function(l_node, options) {
		node = l_node;
		var indent = node.indent;
		var output = "";
		var output_after_children = "";
		var text = textListToText(node.title);
		var note = textListToText(node.note);
		var noteList = node.note;
		var indent_chars = node.indentChars;
		var level = node.level;


		if(node.type == "node"){
			// Update output
			if(options.format == 'markdown'){
				indent = Array(node.style.level+1).join(options.prefix_indent_chars);
				output += indent + node.style.toExport(text);
				if ((note !== "") && options.outputNotes) output += STYLESHEETused["Note"].toExport(note);
			}

			else if (options.format == 'html') {
				text = text.replace(/--/g, "&ndash;");
				indent = Array(node.level+1).join("\t");
				if(node.styleName == "Item"){
					var olderSibling = node.olderSibling();
					var youngerSibling = node.youngerSibling();
					if(!olderSibling || !(olderSibling.styleName == "Item"))
						output += indent + "<ul>" + options.item_sep;
					if(!youngerSibling || !(youngerSibling.styleName == "Item"))
						output_after_children += indent + "</ul>" + options.item_sep;
				}
				if(node.styleName == "Enumeration"){
					var olderSibling = node.olderSibling();
					var youngerSibling = node.youngerSibling();
					if(!olderSibling || !(olderSibling.styleName == "Enumeration"))
						output += indent + "<ol>" + options.item_sep;
					if(!youngerSibling || !(youngerSibling.styleName == "Enumeration"))
						output_after_children += indent + "</ol>" + options.item_sep;
				}
				output += indent + node.style.toExport(text);

				if ((note !== "") && options.outputNotes) output += "\n" + indent + STYLESHEETused["Note"].toExport(note);

				output += options.item_sep;
				if (node.page_break)
						output = output + "<div class=\"page-break\"></div>\n";
			}

			else if (options.format == 'latex'){
				if (node.styleName == "Item"){
					var olderSibling = node.olderSibling();
					var youngerSibling = node.youngerSibling();
					if(!olderSibling || !(olderSibling.styleName == "Item"))
						output += "\\begin{itemize}\n";
					if(!youngerSibling || !(youngerSibling.styleName == "Item"))
						output_after_children += indent + "\\end{itemize}\n";
				}
				else if (node.styleName == "Enumeration"){
					var olderSibling = node.olderSibling();
					var youngerSibling = node.youngerSibling();
					if(!olderSibling || !(olderSibling.styleName == "Enumeration"))
						output += "\\begin{enumerate}\n";
					if(!youngerSibling || !(youngerSibling.styleName == "Enumeration"))
						output_after_children += indent + "\\end{enumerate}\n";
				}
				else if (node.styleName == "Heading1"){
					output_after_children +=  "\\end{section}\n";
				}
				else if (node.styleName == "Heading2"){
					output_after_children += "\\end{subsection}\n";
				}
				else if (node.styleName == "Heading3"){
					output_after_children += "\\end{subsubsection}\n";
				}
				output += node.style.toExport(text);

				if ((note !== "") && (options.outputNotes))
					output += STYLESHEETused["Note"].toExport(note);

				if (node.page_break)
					output += "\\pagebreak ";
			}

			else if (options.format == 'beamer'){
				if (node.styleName == "Item"){
					var olderSibling = node.olderSibling();
					var youngerSibling = node.youngerSibling();
					if(!olderSibling || !(olderSibling.styleName == "Item"))
						output += "\\begin{itemize}\n";
					if(!youngerSibling || !(youngerSibling.styleName == "Item"))
						output_after_children += "\\end{itemize}\n";
				}
				else if (node.styleName == "Enumeration"){
					var olderSibling = node.olderSibling();
					var youngerSibling = node.youngerSibling();
					if(!olderSibling || !(olderSibling.styleName == "Enumeration"))
						output += "\\begin{enumerate}\n";
					if(!youngerSibling || !(youngerSibling.styleName == "Enumeration"))
						output_after_children += "\\end{enumerate}\n";
				}
				else if (node.styleName == "Frame"){
					output_after_children += "\\end{frame}\n";
				}

				output += node.style.toExport(text);


				if ((note !== "") && (options.outputNotes))
					output += STYLESHEETused["Note"].toExport(note);

				if (node.page_break)
					output += "\\pagebreak ";
			}

			else if (options.format == 'opml') {
				indent = Array(node.level+1).join("\t");
				output += indent + "<outline text=\"" + text + "\"";
				if (options.outputNotes) output += " _note=\"" + note + "\"";
				if (options.complete && node.complete) output +=" _complete=\"true\"";
				if(node.children.length == 0) output += "/>" + options.item_sep;
				else {
					output += ">" + options.item_sep;
					output_after_children += indent + "</outline>" + options.item_sep;
				}
			}

			else if (options.format == 'rtf') {
				text = text.replace(/--/g, "\\endash ");
				var str="";
				for (var i = 0; i < text.length; i++) {
					if(text.charCodeAt(i)>127) str += "{\\uc1\\u"+ text.charCodeAt(i)+"*}";
					else str+=text.charAt(i);
				}
				text = str;

				if(node.styleName.includes("Item")){
					text = "{\\f3\\'B7} " + text;
				}

				else if(node.styleName.includes("Enumeration")){
					text = "{\\f3 "+node.style.counter+"} " + text;
				}

				output += node.style.toExport(text);
				if ((note !== "") && options.outputNotes) output += "\n" + STYLESHEETused["Note"].toExport(note);
				output += options.item_sep;

				if (node.page_break)
					output = output + "\\page";
			}

			else {
				output += indent + node.style.toExport(text);
				if ((note !== "") && options.outputNotes) output += "\n" + STYLESHEETused["Note"].toExport(note);
				if (node.page_break) output += "\n";
				output += options.item_sep;
			}
		}
		//console.log(node.note);
		console.log("Output: ", output);
		console.log("Apply recursion to: ", node.children);
		for (var i = 0; i < l_node.children.length; i++)
		{
			output += exportNodesTreeBody(l_node.children[i], options);
		}

		output += output_after_children;
		return output;
	};

	return exportNodesTree(nodesTree, options);
}
