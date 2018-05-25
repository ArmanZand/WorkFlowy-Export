var exportLib = function(nodes, options, email) {
	// private method
	var hasChild, getElement, exportNodesTree, exportNodesTreeBody;
	var wfe_count={};
	var wfe_count_ID={};
	var TABLE_REGEXP = /^\s*\|/;
	var BQ_REGEXP = /^\>/;
	var LIST_REGEXP = /^((\*|\-|\+)\s|[0-9]+\.\s)/;
	var WF_TAG_REGEXP = /((^|\s|,|:|;)(#|@)[a-z][a-z0-9\-_:]*)/ig;
	var WFE_TAG_REGEXP = /#wfe-([\w-]*)(?::([\w-:]*))?/ig;
	var counter_item=[0,0,0,0,0,0];
	var counter_enumeration=[0,0,0,0,0,0];
	var previus_styleName=null;
	var styleName="default";
	var nodesStyle;
	var escapeCharacter = true;
	var header = "";
	var body = "";
	var footer = "";
	var my_nodes = arrayToTree(nodes);

	//import the WorkFlowy text in Nodes
	function arrayToTree(nodes) {
		var start = 0; //nodes[0].node_forest[0]; EP
		var level = 0;
		var parent = -1;
		var root = 0;
		var doctype = "OUTLINE";
		var l = nodes.length;
		var oldestChild = start;
		nodes[start].allSiblings = [start];
		console.log("All siblings of node[" + start.toString() + "]=", nodes[start].allSiblings);
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

			// Update level and document info
			nodes[i].level = level;
		}
		return [nodes, root];
	}

	function WFE(name, parameter=null){
		this.name = name;
		this.parameter = (parameter==null) ? null : parameter.split(":");
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
			options.ignore_item = bool;
			return "";
		},
		"wfe-ignore-outline": function(bool=true){
			options.ignore_outline = bool;
			return "";
		},
		"wfe-page-break": function(bool=true){
			options.page_break = bool;
			return "";
		},
		"wfe-style":function(style="default"){
			if(STYLESHEET.hasOwnProperty(style)) {
				styleName=style;
				if(options.format == 'html')
					nodesStyle = new Style(STYLESHEET[styleName].Id);
				else
					nodesStyle = copy(STYLESHEET[styleName]);
			}
			return "";
		},

		"wfe-text-align":function(value=0){
			var property ="aligement";
			if(value.toUpperCase()=="LEFT" || value.toUpperCase()=="L") nodesStyle[property] = "left";
			else if(value.toUpperCase()=="RIGHT" || value.toUpperCase()=="R") nodesStyle[property] = "right";
			else if(value.toUpperCase()=="CENTER" || value.toUpperCase()=="C") nodesStyle[property] = "center";
			else if(value.toUpperCase()=="JUSTIFIED" || value.toUpperCase()=="J") nodesStyle[property] = "justified";
			return "";
		},
		"wfe-indent-first":function(value=0){
			var property ="indentation_first_line";
			if(!isNaN(value)) nodesStyle[property] = value;
			return "";
		},
		"wfe-indent-left":function(value=0){
			var property ="indentation_left";
			if(!isNaN(value)) nodesStyle[property] = value;
			return "";
		},
		"wfe-indent-right":function(value=0){
			var property ="indentation_right";
			if(!isNaN(value)) nodesStyle[property] = value;
			return "";
		},
		"wfe-line-spacing-before":function(value=0){
			var property ="spacing_before";
			if(!isNaN(value)) nodesStyle[property] = value;
			return "";
		},
		"wfe-line-spacing-after":function(value=0){
			var property ="spacing_after";
			if(!isNaN(value)) nodesStyle[property] = value;
			return "";
		},
		"wfe-font-face":function(value="Arial"){
			var property ="font";
			if(value.toUpperCase()=="ARIAL") nodesStyle[property] = "Arial";
			else if(value.toUpperCase()=="TIMES_NEW_ROMAN") nodesStyle[property] = "Times New Roman";
			else if(value.toUpperCase()=="COURIER") nodesStyle[property] = "Courier";
			else if(value.toUpperCase()=="SYMBOL") nodesStyle[property] = "Symbol";
			return "";
		},
		"wfe-font-size":function(value=11){
			var property ="font_size";
			if(!isNaN(value)) nodesStyle[property] = value;
			return "";
		},
		"wfe-font-weight":function(value="Normal"){
			var property ="bold";
			if(value.toUpperCase()=="BOLD") nodesStyle[property] = true;
			else if(value.toUpperCase()=="NORMAL") nodesStyle[property] = false;
			return "";
		},
		"wfe-font-style":function(value="Normal"){
			var property ="italic";
			if(value.toUpperCase()=="ITALIC") nodesStyle[property] = true;
			else if(value.toUpperCase()=="NORMAL") nodesStyle[property] = false;
			return "";
		},
		"wfe-text-decoration":function(value="Normal"){
			var property ="underline";
			if(value.toUpperCase()=="UNDERLINE") nodesStyle[property] = true;
			else if(value.toUpperCase()=="NORMAL") nodesStyle[property] = false;
			return "";
		},
		"wfe-font-color":function(value="Black"){
			var property ="color";
			if(value.toUpperCase()=="WHITE") nodesStyle[property] = "White";
			else if(value.toUpperCase()=="BLACK") nodesStyle[property] = "Black";
			else if(value.toUpperCase()=="BLUE") nodesStyle[property] = "Blue";
			else if(value.toUpperCase()=="DARKGREY") nodesStyle[property] = "DarkGrey";
			else if(value.toUpperCase()=="LIGHTGREY") nodesStyle[property] = "LightGrey";
			return "";
		},
		"wfe-background":function(value="White"){
			var property ="background_color";
			if(value.toUpperCase()=="WHITE") nodesStyle[property] = "White";
			else if(value.toUpperCase()=="BLACK") nodesStyle[property] = "Black";
			else if(value.toUpperCase()=="BLUE") nodesStyle[property] = "Blue";
			else if(value.toUpperCase()=="DARKGREY") nodesStyle[property] = "DarkGrey";
			else if(value.toUpperCase()=="LIGHTGREY") nodesStyle[property] = "LightGrey";
			return "";
		},

		"wfe-email": function(){
			return email;
		},

		"wfe-verbatim": function(){
			escapeCharacter = false;
			return "";
		}
	}

	var ALIAS=[
		["#wfe-style:Heading1","#h1"],
		["#wfe-style:Heading2","#h2"],
		["#wfe-style:Heading3","#h3"],
		["#wfe-style:Heading4","#h4"],
		["#wfe-style:Heading5","#h5"],
		["#wfe-style:Heading6","#h6"],
		["#wfe-style:Item1","#item"]
	];

	var RTF_aligement={left:"\\ql", right:"\\qr", center:"\\qc", justified:"\\qj"};
	var HTML_aligement={left:"text-align: left;  ", right:"text-align: right;  ", center:"text-align: center;  ", justified:"text-align: justify;  "};
	var FONTSHEET={
		"Arial":0,
		"Times New Roman":1,
		"Courier":2,
		"Symbol":3,
		toRTFstr : function(){
			var str = "{\\fonttbl";
			for(var key in this){
				if (this.hasOwnProperty(key) && typeof(this[key])!="function") {
					str += "{\\f" + this[key] + " " + key + ";}";
				}
			}
			str += "}";
			return str;
		}
	};

	function Color(Id, Red, Green, Blue) {
  		this.Id = Id;
  		this.Red = Red;
  		this.Green = Green;
  		this.Blue = Blue;
			this.toRTFstr = function(){return "\\red"+this.Red+"\\green"+this.Green+"\\blue"+this.Blue};
			this.toHTMLstr = function(){return "rgb("+this.Red+","+this.Green+","+this.Blue+")"};
	};
	var COLORSHEET={
		White : new Color(1,255,255,255),
		Black : new Color(2,0,0,0),
		Blue : new Color(3,0,0,130),
		DarkGrey : new Color(4,25,25,25),
		LightGrey : new Color(5,180,180,180),
		toRTFstr : function(){
			var str = "{\\colortbl;";
			for(var key in this){
				if (this.hasOwnProperty(key) && typeof(this[key])=="object") {
					str += this[key].toRTFstr() + ";";
				}
			}
			str += "}";
			return str;
		}
	};
	function Style(Id, aligement=null, indentation_first_line=NaN, indentation_left=NaN, indentation_right=NaN, spacing_before=NaN, spacing_after=NaN, font=null, font_size=NaN, bold=NaN, italic=NaN, underline=NaN, color=null, background_color=null, level=-1, before="", after="") {
		this.Id = Id;
		this.aligement = aligement;
		this.indentation_first_line = indentation_first_line;
		this.indentation_left = indentation_left;
		this.indentation_right = indentation_right;
		this.spacing_before = spacing_before;
		this.spacing_after = spacing_after;
		this.font = font;
		this.font_size = font_size;
		this.bold = bold;
		this.italic = italic;
		this.underline = underline;
		this.color = color;
		this.background_color = background_color;
		this.before=before;
		this.after=after;
		this.level=level;
		this.toRTFstr = function(){
			var str = this.before+
							"\\s"+this.Id+
							RTF_aligement[this.aligement]+
							"\\fi"+(20*Number(this.indentation_first_line))+
							"\\li"+(20*Number(this.indentation_left))+
							"\\ri"+(20*Number(this.indentation_right))+
							"\\sb"+(20*Number(this.spacing_before))+
							"\\sa"+(20*Number(this.spacing_after))+
							"\\f"+FONTSHEET[this.font]+
							"\\fs"+(2*this.font_size);
			if(this.bold) str += "\\b";
			if(this.italic) str +="\\i";
			if(this.underline) str += "\\ul";
			str += "\\cf"+COLORSHEET[this.color].Id +
			  		 "\\highlight"+COLORSHEET[this.background_color].Id+
						 this.after;
			return str;
		},
		this.toHTMLstr = function(){
			var str = "";
			if(this.aligement!=null) str += HTML_aligement[this.aligement];
			if(!isNaN(this.indentation_first_line)) str += "text-indent: "+this.indentation_first_line+"px;  ";
			if(!isNaN(this.indentation_left)) str += "margin-left: "+this.indentation_left+"px;  ";
			if(!isNaN(this.indentation_right)) str += "margin-right: "+this.indentation_right+"px;  ";
			if(!isNaN(this.spacing_before)) str += "margin-top: "+this.spacing_before+"px;  ";
			if(!isNaN(this.spacing_after)) str += "margin-bottom: "+this.spacing_after+"px;  ";
			if(this.font!=null) str += "font-family: "+this.font+";  ";
			if(!isNaN(this.font_size)) str += "font-size: "+(this.font_size)+"px;  ";
			if(!isNaN(this.bold)){if(this.bold) str += "font-weight: bold;  "; else str += "font-weight: normal;";};
			if(!isNaN(this.italic)){if(this.italic) str +="font-style: italic;  "; else str +="font-style: normal;  ";};
			if(!isNaN(this.underline)){if(this.underline) str += "text-decoration: underline;  "; else str += "text-decoration: none;  ";};
			if(this.color!=null) str += "color: "+COLORSHEET[this.color].toHTMLstr()+";  ";
			if(this.background_color!=null) str += "background-color: "+COLORSHEET[this.background_color].toHTMLstr()+";  ";
			return this.before+str+this.after;
		},
		this.toTextstr = function(){
			return this.before+this.after;
		}
	};
	var idStyleToHTMLBalise=["p","h1","h2","h3","h4","h5","h6","p","li","li","li","li","li","li","li","li","li","li","li","li"];
	var STYLESHEET={
		Normal : new Style(0,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",-1),
		Heading1 : new Style(1,"left",0,0,0,0,10,"Arial",16,true,false,false,"Black","White",1),
		Heading2 : new Style(2,"left",0,0,0,0,10,"Arial",14,true,false,false,"Black","White",2),
		Heading3 : new Style(3,"left",0,0,0,0,10,"Arial",12,true,false,false,"Black","White",3),
		Heading4 : new Style(4,"left",0,0,0,0,10,"Arial",11,true,false,false,"Black","White",4),
		Heading5 : new Style(5,"left",0,0,0,0,10,"Arial",11,true,false,false,"Black","White",5),
		Heading6 : new Style(6,"left",0,0,0,0,10,"Arial",11,true,false,false,"Black","White",6),
		Note : new Style(7,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",-1),
		Item1 : new Style(8,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",1),
		Item2 : new Style(9,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",2),
		Item3 : new Style(10,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",3),
		Item4 : new Style(11,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",4),
		Item5 : new Style(12,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",5),
		Item6 : new Style(13,"left",0,0,0,0,10,"Arial",11,false,false,false,"Black","White",6),
		Enumeration1 : new Style(14,"left", 0,0,0,0,10,"Arial",11,false,false,false,"Black","White",1),
		Enumeration2 : new Style(15,"left", 0,0,0,0,10,"Arial",11,false,false,false,"Black","White",2),
		Enumeration3 : new Style(16,"left", 0,0,0,0,10,"Arial",11,false,false,false,"Black","White",3),
		Enumeration4 : new Style(17,"left", 0,0,0,0,10,"Arial",11,false,false,false,"Black","White",4),
		Enumeration5 : new Style(18,"left", 0,0,0,0,10,"Arial",11,false,false,false,"Black","White",5),
		Enumeration6 : new Style(19,"left", 0,0,0,0,10,"Arial",11,false,false,false,"Black","White",6),
		toRTFstr : function(){
			var str = "{\\stylesheet";
			for(var key in this){
				if (this.hasOwnProperty(key) && typeof(this[key])=="object") {
					str += "{" + this[key].toRTFstr() + " " + key + ";}";
				}
			}
			str += "}";
			return str;
		},
		toHTMLstr : function(){
			var str = "";
			for(var key in this){
				if (this.hasOwnProperty(key) && typeof(this[key])=="object") {
					str += idStyleToHTMLBalise[this[key].Id] + "." + key + "{" + this[key].toHTMLstr() + "}\n" ;
				}
			}
			return str;
		},
		styleName : function(idStyle){
				for(var key in this){
					if (this.hasOwnProperty(key) && typeof(this[key])=="object") {
						if(this[key].Id==idStyle) return key;
					}
				}
				return "";
		}
	};

	var ESCAPE_CHARACTER = {
			text: [["",""]],
			markdown: [["\\","\\\\"],["`","\\`"],["*","\\*"],["_","\\_"],["{","\\{"],["}","\\}"],["[","\\["],["]","\\]"],["(","\\("],[")","\\)"],["#","\\#"],["+","\\+"],["-","\\-"],[".","\\."],["!","\\!"]],
			html: [["&","&amp;"],[">","&gt;"],["<","&lt;"],["\"","&quot;"],["\'","&#39;"]],
			latex: [["\\","\\textbackslash "],["ˆ","\\textasciicircum "],["&","\\&"],["%","\\%"],["$","\\$"],["#","\\#"],["_","\\_"],["{","\\{"],["}","\\}"]],
			beamer: [["\\","\\textbackslash "],["ˆ","\\textasciicircum "],["&","\\&"],["%","\\%"],["$","\\$"],["#","\\#"],["_","\\_"],["{","\\{"],["}","\\}"]],
			opml: [["",""]],
			rtf: [["\\","\\\\"],["{","\\{"],["}","\\}"]]
		};

	hasChild = function(nodes, pos) {
		if (nodes[pos].type != "node") return false;
		for (var i = pos + 1; i < nodes.length; i++) {
			if (nodes[i].type == "eoc") return false;
			if (nodes[i].type == "node") return true;
		};
		return false;
	};

	getElement = function(line) {
		var e;
		if (line.match(TABLE_REGEXP)) e = "TABLE";
		else if (line.match(BQ_REGEXP)) e = "QUOTE";
		else if (line.match(LIST_REGEXP)) e = "LIST";
		else e = "PARAGRAPH";
		return e;
	};

	function copy(mainObj) {
  	let objCopy = {}; // objCopy will store a copy of the mainObj
  	let key;
  	for (key in mainObj) {
    	objCopy[key] = mainObj[key]; // copies each property to the objCopy object
  	}
  	return objCopy;
	}


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

	var regexCode=/`([^`]*)`/g;
	function Code(text){
		this.text=text;
		this.toString = function(format = "text"){
			switch(format){
				case "html" : return "<code style=\"background-color: #d3d3d3;\"> &nbsp;"+this.text+" </code>";
				case "rtf" : return "{\\f2\\cf4\\highlight5 "+this.text+"}"
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
				case "html" : return "<img src=\""+this.link+"\"  title=\""+this.text+"\"><br /><span style=\"font-style: italic; font-size: 0.9em; color:grey;\">"+this.text+"</span>";
				case "text" : return this.text + " : " +  this.link;
				case "rtf" : return this.toString("text"); //TODO
				case "beamer" : return "\\begin{figure}[t]\\includegraphics["+this.text+"]{"+this.link+"}\\centering \\end{figure}";
				default : return "!["+this.text+"]("+this.link+")";
			}
		}
	}

	var regexLink = /\[([^\]]*)\]\(([^\)]*)\)/g;
	function Link(text, link){
		this.link=link;
		this.text=text;
		this.toString = function(format = "text"){
			switch(format){
				case "html" : return "<a href=\""+this.link+"\" target=\"_blank\">"+this.text+"</a>";
				case "text" : return this.text + " : " +  this.link;
				case "rtf" : return "{\\field{\\*\\fldinst HYPERLINK "+this.link+" }{\\fldrslt\\cf3\\ul "+this.text+"}}";
				case "beamer" : return "\\href{"+this.link+"}{"+this.text+"}";
				default : return "["+this.text+"]("+this.link+")";
			}
		}
	}

	function insertObj(textList, regex, Obj){
		var result = [];
	  textList.forEach(function(text){
	    	if(typeof text == "string"){
	        var match = regex.exec(text);
	        var i_prev = 0;
	        while(match!=null){
	          var i = match.index;
	          if(i!=i_prev) result.push(text.slice(i_prev, i));
	          i_prev= regex.lastIndex;
	          result.push(new Obj(...match.slice(1)));
	          match = regex.exec(text);
	        }
	        if(text.length!=i_prev) result.push(text.slice(i_prev, text.length));
	      }
	      else{
	      	result.push(text);
	      }
	  	});
		return result;
	}

	function textListToText(textList){
		var result = "";
		textList.forEach(function(text){
	    if(typeof text == "string")
				result += text;
			else
				result += text.toString(options.format);
		});
		return result;
	}

	exportNodesTree = function(nodes, index, level, options) {
		options.findReplace.forEach(function(e) {
			if(e!=null){
				e.regexFind = functionRegexFind(e.txtFind, e.isRegex, e.isMatchCase);
			}
		});

		var HEADER = {
			text: "",
			markdown: "",
			html: "<!DOCTYPE html>\n<html>\n  <head>\n    <title>" + nodes[index].title + "</title>\n    <style>\n body {margin:72px 90px 72px 90px;}\n img {max-height: 1280px;max-width: 720px;}\n div.page-break {page-break-after: always}\n" + STYLESHEET.toHTMLstr() + "\n    </style>\n  </head>\n  <body>\n",
			latex: "\\documentclass{article}\n \\usepackage{blindtext}\n \\usepackage[utf8]{inputenc}\n \\title{TEMP_TITLE}\n \\author{"+email+"}\n \\date{\\today}\n \\begin{document}\n \\maketitle",
			beamer: "",
			opml: "<?xml version=\"1.0\"?>\n<opml version=\"2.0\">\n  <head>\n    <ownerEmail>"+email+"</ownerEmail>\n  </head>\n  <body>\n",
			rtf: "{\\rtf1\\ansi\\deff0\n"+
			     FONTSHEET.toRTFstr()+"\n"+
			     COLORSHEET.toRTFstr()+"\n"+
			     STYLESHEET.toRTFstr()+"\n"
		};
		var FOOTER = {
			text: "",
			markdown: "",
			html: "  </body>\n</html>",
			latex: "\\end{document}",
			beamer: "",
			opml: "  </body>\n</opml>",
			rtf: "}"
		};
		// Set default rules
		options.ignore_item = false;
		options.ignore_outline = false;
		options.page_break = false;

		// Create header text
		if(!options.fragment) header = HEADER[options.format];
		console.log("header", header);

		// Create footer text
		if(!options.fragment) footer = FOOTER[options.format];
		console.log("footer", footer);

		// Create body text
		body = exportNodesTreeBody(nodes, index, level, options);

		wfe_count={};
		wfe_count_ID={};
		counter_enumeration=[0,0,0,0,0,0];
		return header + body + footer;
	}

	exportNodesTreeBody = function(nodes, index, level, options) {
		var start = 0; //nodes[0].node_forest[0]; // EP
		var indent = "";
		var output = "";
		var output_after_children = "";
		var children_level;
		var text = "";
		var textList = [];
		var note = "";
		var output_children;
		escapeCharacter= true;

		if(options.parentDefaultItemStyle =="Bullet" && level>6) level=6;

		if(options.parentDefaultItemStyle == "Heading" && level<6)
			styleName = "Heading"+(level+1)
		else if((options.parentDefaultItemStyle=="Bullet" && level!=0) && level<7)
			styleName = "Item"+(level);
		else if((options.parentDefaultItemStyle=="Enumeration" && level!=0) && level<7)
			styleName = "Enumeration"+(level);
		else
			styleName = "Normal";


		if(options.format == 'html')
			nodesStyle = new Style(STYLESHEET[styleName].Id);
		else
			nodesStyle = copy(STYLESHEET[styleName]);

		var title_level = -1;
		var part_level = -1;
		var section_level = 0;
		var subsection_level = -1;
		var frame_level = 1;
		var heading = 0;

		console.log("nodesTreeToText -- processing nodes["+index.toString()+"] = ", nodes[index].title, 'at level', level.toString());
		console.log("options:", options);


		if(nodes[index].title != null){
			// Not a dummy node

			textList.push(nodes[index].title);
			note = nodes[index].note;

			//find and Replace
			options.findReplace.forEach(function(e) {
				//console.log("apply find and replace",e);
				if(e!=null){
					textList.forEach(function(subText, i){if(typeof subText=="string") textList[i] = textList[i].replace(e.regexFind, e.txtReplace)});
				}
			});

			if (options.applyWFERules)
			{
				// Assign new rules from WFE-tags in item

				ALIAS.forEach(function(e) {
					//console.log("Replace Alias",e);
						textList.forEach(function(subText, i){if(typeof subText=="string") textList[i] = textList[i].split(e[1]).join(e[0])});
				});

				textList.forEach(function(subText, i){
					if(typeof subText=="string"){
						textList[i] = textList[i].replace(WFE_TAG_REGEXP, function(e,$1,$2){
							var wfe = new WFE($1,$2);
							return wfe.toString();
						});
					}
				});

				// bullets https://stackoverflow.com/questions/15367975/rtf-bullet-list-example
				if (options.format == 'beamer'){
		 			if (textList[0].search(/#h4($|\s)/ig) != -1)
					{
						console.log('#h4 found');
						level = 1;
					}
					if (textList[0].search(/#slide($|\s)/ig) != -1)
					{
						console.log('#slide found');
						level = frame_level;
					}
					if (textList[0].search(/#section($|\s)/ig) != -1)
					{
						console.log('#section found');
						level = section_level;
					}
					if (textList[0].search(/#subsection($|\s)/ig) != -1)
					{
						console.log('#subsection found');
						level = subsection_level;
					}
				}

				textList=insertObj(textList, regexCode, Code);
				textList=insertObj(textList, regexImage, Image);
				textList=insertObj(textList, regexLink, Link);

			}


			switch (styleName) {
				case "Item1" :
					counter_item[0]++;
					break;
				case "Item2" :
					counter_item[1]++;
					break;
				case "Item3" :
					counter_item[2]++;
					break;
				case "Item4" :
					counter_item[3]++;
					break;
				case "Item5" :
					counter_item[4]++;
					break;
				case "Item6" :
					counter_item[5]++;
				break;
				case "Enumeration1" :
					counter_enumeration[0]++;
					break;
				case "Enumeration2" :
					counter_enumeration[1]++;
					break;
				case "Enumeration3" :
					counter_enumeration[2]++;
					break;
				case "Enumeration4" :
					counter_enumeration[3]++;
					break;
				case "Enumeration5" :
					counter_enumeration[4]++;
					break;
				case "Enumeration6" :
					counter_enumeration[5]++;
				break;
				case "Heading1" :
					level=0;
					break;
				case "Heading2" :
					level=1;
					break;
				case "Heading3" :
					level=2;
					break;
				case "Heading4" :
					level=3;
					break;
				case "Heading5" :
					level=4;
					break;
				case "Heading6" :
					level=5;
					break;
			}

			console.log('Finished processing rules:', textList, options);


			if(level>0) indent = Array(level+1).join(options.prefix_indent_chars);

			// Only process item if no rule specifies ignoring it
			if (!options.ignore_item && !options.ignore_outline) {

				if (options.ignore_tags) {
					// Strip off tags
					textList.forEach(function(subText, i){if(typeof subText=="string") textList[i] = textList[i].replace(WF_TAG_REGEXP, "")});
					note = note.replace(WF_TAG_REGEXP, "");
				}

				if(escapeCharacter)
					ESCAPE_CHARACTER[options.format].forEach(function(e) {
	  					textList.forEach(function(subText, i){if(typeof subText=="string") textList[i] = textList[i].split(e[0]).join(e[1])});
			  			note = note.split(e[0]).join(e[1]);
					});

				text = textListToText(textList);

				// Update output
				if(options.format == 'markdown'){
					if(styleName.includes("Item"))
						indent = "\t".repeat(nodesStyle["level"]-1) + "* ";
					else if(styleName.includes("Enumeration"))
						indent = "\t".repeat(nodesStyle["level"]-1) + counter_enumeration[nodesStyle["level"]-1]+". ";
					else if(styleName.includes("Heading"))
						indent = "#".repeat(nodesStyle["level"]) + " ";
					else
						indent = "";

					output += indent + text + "\n\n";
					if ((note !== "") && options.outputNotes) output = output + indent + note + "\n\n";
				}
				else if (options.format == 'html') {
					text = text.replace(/--/g, "&ndash;");

					var style = nodesStyle.toHTMLstr();
					if(style!="")style = "style=\""+style+"\"";
					if(previus_styleName!= null){
						if(previus_styleName.includes("Item")) {
							if(!styleName.includes("Item"))
								output += indent + "</ul>".repeat(previus_styleName[4])+"\n";
							else if(styleName[4]<previus_styleName[4])
							 	output += indent + "</ul>".repeat(previus_styleName[4]-styleName[4]) + "\n";
					 }
						else if(previus_styleName.includes("Enumeration")) {
							if(!styleName.includes("Enumeration"))
								output += indent + "</ol>".repeat(previus_styleName[11])+"\n";
							else if(styleName[11]<previus_styleName[11])
								output += indent + "</ol>".repeat(previus_styleName[11]-styleName[11])+"\n";
						}
					}
					if (styleName.includes("Item") && counter_item[styleName[4]-1]==1){
						if(previus_styleName!=null && previus_styleName.includes("Item")) {
							if(!styleName.includes("Item"))
								output += indent + "<ul>".repeat(styleName[4])+"\n";
							else if(styleName[4]>previus_styleName[4])
							 	output += indent + "<ul>".repeat(styleName[4]-previus_styleName[4]) + "\n";
					 }
					}
					else if (styleName.includes("Enumeration") && counter_enumeration[styleName[11]-1]==1){
						if(previus_styleName!=null && previus_styleName.includes("Enumeration")) {
							if(!styleName.includes("Enumeration"))
								output += indent + "<ol>".repeat(styleName[11])+"\n";
							else if(styleName[11]>previus_styleName[11])
							 	output += indent + "<ol>".repeat(styleName[11]-previus_styleName[11]) + "\n";
					 }
					}

					output += indent + "<" + idStyleToHTMLBalise[nodesStyle.Id] + " class=\"" + styleName + "\" " + style + ">" + text + "</" + idStyleToHTMLBalise[nodesStyle.Id] + ">";

					if ((note !== "") && options.outputNotes) output = output + "\n" + indent + "<p>" + note + "</p>";

					output = output + options.item_sep;
					if (options.page_break)
							output = output + "<div class=\"page-break\"></div>";
				}
				else if (options.format == 'latex'){
					if(level==0){
						header = header.replace("TEMP_TITLE", text);
					}
					else if(styleName.includes("Heading")){
						switch (level){
							case 1 :
								output += indent + "\\begin{section}{"+text+"}";
								output_after_children = indent + "\\end{section}\n";
								break;
							case 2 :
								output += indent + "\\begin{subsection}{"+text+"}";
								output_after_children = indent + "\\end{subsection}\n";
								break;
							case 3 :
								output += indent + "\\begin{subsubsection}{"+text+"}";
								output_after_children = indent + "\\end{subsubsection}\n";
								break;
							default :
								output += indent + text + "\\\\";
								break;
						}
					}
					else if (styleName.includes("Item")){
						output += indent + "\\begin{itemize}\n"+indent+"\\item "+text;
						output_after_children = indent + "\\end{itemize}\n";
					}
					else if (styleName.includes("Enumeration")){
						output += indent + "\\begin{enumerate}\n"+indent+"\\item "+text;
						output_after_children = indent + "\\end{enumerate}\n";
					}
					else output += indent + text + "\\\\";

					if ((note !== "") && (options.outputNotes))
						output += "\n" + indent + note;
					if (options.page_break)
						output += "\\pagebreak ";

					output += options.item_sep;

				}
				else if (options.format == 'beamer'){
					if (level == title_level)
						output = output + indent + "\\title{" + text + "}";
					else if (level == section_level)
						output = output + indent + "\\section{" + text + "}";
					else if (level == subsection_level)
						output = output + indent + "\\subsection{" + text + "}";
					else if (level == frame_level)
						output = output + indent + "\\begin{frame}{" + text + "}";
					else if (level > frame_level)
						output = output + indent + "\\item " + text;

					// Add notes if required by option
					if ((note !== "") && (options.outputNotes)){
						// Create images
						console.log('check for images ');
						// First replace with optional {: } syntax
						note = note.replace(/\!\[(.*)\]\((.*)\)\{:(.*)\}/g, "\\begin{figure}[t]\\includegraphics[$3]{$2}\\centering \\end{figure}");
						console.log('item now', note);
						// Replace if this is missing
						note = note.replace(/\!\[(.*)\]\((.*)\)/g, "\\begin{figure}[t]\\includegraphics[width=.75\\textwidth]{$2}\\centering \\end{figure}");
						console.log('item now', note);

						// Create hyperlinks
						console.log('check for hyperlink');
						note = note.replace(/\[(.*)\]\((.*)\)/g, "\\href{$2}{$1}");
						console.log('item now', note);

						output = output + options.item_sep + indent + " " + note;
						// .replace(/\!\[(.*)\]\((.*)\)\{:(.*)\}/g, "\\begin{figure}[t]\\includegraphics[$3]{$2}\\centering \\end{figure}")
					}
					output = output + options.item_sep;

					if ((nodes[index].myType == "HEADING") && (level >= frame_level))
					{
						output = output + indent + "\\begin{itemize}" + options.item_sep;
					}

				}
				else if (options.format == 'opml') {

					output = output + indent + "<outline text=\"" + text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") + "\"";
					if (options.outputNotes) output = output + " _note=\"" + note + "\"";
					output = output + ">\n";

				}
				else if (options.format == 'WFE-TAGGED') {
					//output = output + indent + text + nodes[index].myType;
					var temp_level = level + 1;

					if ((options.parentDefaultItemStyle=='Bullet') || (nodes[index].myType == "HEADING"))
						output = output + indent + text + " #h" + temp_level.toString();
					else // #todo implement ITEM
						output = output + indent + text;

					if ((note !== "") && options.outputNotes) output = output + "\n" + indent + "[" + note + "]";
					output = output + options.item_sep;

				}
				else if (options.format == 'rtf') {

					if(styleName.includes("Item")){
						nodesStyle.after="{\\pntext\\f3\\'B7\\tab}";
						nodesStyle.before="{\\*\\pn\\pnlvlblt\\pnf3\\pnindent0{\\pntxtb\\'B7}}";
					}


					text = text.replace(/--/g, "\\endash ");

					output = output + "{\\pard " + nodesStyle.toRTFstr() + "{" + text + "}\\par}";

					if (options.page_break)
						output = output + "\\page";
					if ((note !== "") && options.outputNotes) output = output + "\n" + "{\\pard" + STYLESHEET["Note"].toRTFstr() + "" + note + "\\par}";
					output = output + "\n";
				}
				else {
					if (styleName.includes("Item"))
						output = output + indent + options.parentIndent_chars + " " + text;
					else if (styleName.includes("Heading"))
						output = output + indent + text + "\n";
					else if (styleName.includes("Enumeration"))
						output = output + indent + counter_enumeration[styleName[11]-1]+ " " + text;
					else
						output = output + indent + text

					if ((note !== "") && (options.outputNotes))
						output = output + "\n" + indent + "[" + note + "]";

					output = output + options.item_sep;
				}

				if(previus_styleName!= null){
					if (previus_styleName.includes("Item") && (!styleName.includes("Item") || (styleName[4]<previus_styleName[4])) ){
						for(var i=previus_styleName[4]-1; i<counter_item.length; i++){counter_item[i]=0;}
					}
					else if (previus_styleName.includes("Enumeration") && (!styleName.includes("Enumeration") || (styleName[11]<previus_styleName[11])) ){
						for(var i=counter_enumeration.length-1; i>=previus_styleName[11]; i--){counter_enumeration[i-1]=0;}
					}
				}
			}
		}
			//console.log(nodes[index].note);
			console.log("Output: ", output);
			// Reset item-local rules
			options.ignore_item = false;
			options.page_break = false;

			output_children = '';
			if (!options.ignore_outline) {
				// Recursion on children
				if ((!options.ignore_item) && (nodes[index].title !== null)) children_level = level + 1;
				else children_level = level;

				previus_styleName = styleName;

				console.log("Apply recursion to: ", nodes[index].children);
				for (var i = 0; i < nodes[index].children.length; i++)
				{
					output_children = output_children + exportNodesTreeBody(nodes, nodes[index].children[i], children_level, options);
				}

			}

			output = output + output_children + output_after_children;

			if (!options.ignore_item && !options.ignore_outline) {
				// Only finish item if no rule specifies ignoring it
				if (options.format == 'opml')
					output = output + indent + "</outline>\n"
				else if (options.format == 'beamer')
				{
					if ((level >= frame_level) && (output_children.length > 0))
						output = output + indent + "\\end{itemize}\n";
					if (level == frame_level)
						output = output + indent + "\\end{frame}\n";
				}
			}
			// Reset outline-local rules
			options.ignore_outline = false;
		return output;
	};


	var text = "";
	text = text + exportNodesTree(my_nodes[0], my_nodes[1], 0, options);
	return text;
}
