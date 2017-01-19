    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    navigator.saveBlob = navigator.saveBlob || navigator.msSaveBlob || navigator.mozSaveBlob || navigator.webkitSaveBlob;
    window.saveAs = window.saveAs || window.webkitSaveAs || window.mozSaveAs || window.msSaveAs;
	
	if (typeof String.prototype.startsWith != 'function') {
	  String.prototype.startsWith = function (prefix){
		return this.slice(0, prefix.length) === prefix;
	  };
	}
	if (typeof String.prototype.endsWith != 'function') {
	  String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	  };
	}
	

    var md = markdownit({
      html: true,
	  linkify : true
    })
      .use(markdownitFootnote);
	  
	var $editor = $("#out");
	var editor = $editor[0];


    function setOutput(val){
      val = val.replace(/<equation>((.*?\n)*?.*?)<\/equation>/ig, function(a, b){
        return '<img src="http://latex.codecogs.com/png.latex?' + encodeURIComponent(b) + '" />';
      });

      var out = document.getElementById('out');
      var old = out.cloneNode(true);
      out.innerHTML = md.render(val);

      var allold = old.getElementsByTagName("*");
      if (allold === undefined) return;

      var allnew = out.getElementsByTagName("*");
      if (allnew === undefined) return;

      for (var i = 0, max = Math.min(allold.length, allnew.length); i < max; i++) {
        if (!allold[i].isEqualNode(allnew[i])) {
          out.scrollTop = allnew[i].offsetTop;
          return;
        }
      }
    }



    function saveAsMarkdown(){
      save(editor.getValue(), "untitled.md");
    }

    function saveAsHtml() {
      save(document.getElementById('out').innerHTML, "untitled.html");
    }

    document.getElementById('saveas-markdown').addEventListener('click', function() {
      saveAsMarkdown();
      hideMenu();
    });

    document.getElementById('saveas-html').addEventListener('click', function() {
      saveAsHtml();
      hideMenu();
    });

    function save(code, name){
      var blob = new Blob([code], { type: 'text/plain' });
      if(window.saveAs){
        window.saveAs(blob, name);
      }else if(navigator.saveBlob){
        navigator.saveBlob(blob, name);
      }else{
        url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.setAttribute("href",url);
        link.setAttribute("download",name);
        var event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        link.dispatchEvent(event);
      }
    }

    var menuVisible = false;
    var menu = document.getElementById('menu');

    function showMenu() {
      menuVisible = true;
      menu.style.display = 'block';
    }

    function hideMenu() {
      menuVisible = false;
      menu.style.display = 'none';
    }

    document.getElementById('close-menu').addEventListener('click', function(){
      hideMenu();
    });

    document.addEventListener('keydown', function(e){
      if(e.keyCode == 83 && (e.ctrlKey || e.metaKey)){
        e.shiftKey ? showMenu() : saveAsMarkdown();

        e.preventDefault();
        return false;
      }

      if(e.keyCode === 27 && menuVisible){
        hideMenu();

        e.preventDefault();
        return false;
      }
    });
	
	
	var flagEdit = false;
	var flagMenuOpen = false;
	var flagLinkModalOpen = false;
	
	$(document).on('focus', '[contenteditable]', function() {
		var $this = $(this);
		$this.data('before', $this.html());
		return $this;
	}).on('blur keyup paste input', '[contenteditable]', function() {
		var $this = $(this);
		if ($this.data('before') !== $this.html()) {
			$this.data('before', $this.html());
			$this.trigger('change');
		}
		return $this;
	});
	
	$(".CommandEntry").hover(function(e) {
		var $options = $(".CommandMenu>.CommandEntry");
		var pos = $options.index(this);
		CommandMenu.selectMenuOption(pos);
    });
	
	document.onselectionchange = function() {
		var parentElem = getCaretParentElementWithin(editor);
		if(typeof(parentElem)=="undefined" || $(parentElem).parent(".title").size()>0)
			return;
		var content = $(parentElem).html();
		var offset = getCaretOffsetWithin(parentElem);
		var reg = /(^\/$| \/$)/;
		if(reg.exec(content)){
			var $cm = $(".CommandMenu");
			$cm.show();
			var coor = getSelectionCoords();
			$cm.css("left", coor.x);
			$cm.css("top", coor.y+$(parentElem).height());
			flagMenuOpen = true;
		}else{
			$(".CommandMenu").hide();
			flagMenuOpen = false;
		}
	};
	
	$(window).scroll(function(event){
		if(flagMenuOpen){
			var parentElem =  getCaretParentElementWithin(editor);
			var $cm = $(".CommandMenu");
			var coor = getSelectionCoords();
			$cm.css("left", coor.x);
			$cm.css("top", coor.y+$(parentElem).height());
		}
    });
	
	$editor.change(function(e) {
		var $title = $(".title>h1");
		var $placeholder = $(".title>.placeholder");
        if( $title.html()==""|| $title.html()=="<br>"){
			$placeholder.show();
		}else{
			$placeholder.hide();
		}
		if(flagEdit){
			flagEdit = false;
			return;
		}
		var parentElem =  getCaretParentElementWithin(this);
		var offset = getCaretOffsetWithin(parentElem);
		var mdItem = MarkDownItem.newInstance(parentElem);
		if($(mdItem.rootElem).hasClass("title"))
			return;
		mdItem.checkMarkDown(offset);
    });
	

    $editor.on('keydown', function(e){
	  //13:Enter, 8:Backspace, 127:Delete
		switch(e.keyCode){
			case 13:
				var parentElem =  getCaretParentElementWithin(this);
				var mdItem = MarkDownItem.newInstance(parentElem);
				parentElem = mdItem.parentElem;
				if(flagMenuOpen){
					e.preventDefault();
					CommandMenu.action();
				} else if(parentElem.tagName==="CODE"){
				} else {
					flagEdit = true;
					if(parentElem.tagName == "LI"){
						e.preventDefault();
						var liArr = $(parentElem).parent().find("li");
						if(liArr.index(parentElem)==liArr.size()-1&&($(parentElem).html()==""||$(parentElem).html()=="<br>")){
							$(parentElem).remove();
							mdItem.insertNewAfter(true);
						} else{
							mdItem.insertNewLi();
						}
					}else if(parentElem.tagName == "P"&&$(parentElem).parent("blockquote").size()>0){
						e.preventDefault();
						var blockquote = $(parentElem).parent("blockquote");
						if($(parentElem).html()==""||$(parentElem).html()=="<br>"){
							mdItem.insertNewAfter(true);
							mdItem.rootElem.remove();
						}else{
							mdItem.insertNewBlockquote();
						}
					}else{
						e.preventDefault();
						mdItem.insertNewAfter(true);
					}
				}
				break;
			case 8:
				var parentElem =  getCaretParentElementWithin(this);
				if($(parentElem).parents(".title").size()>0){
					if($(parentElem).html()==""||$(parentElem).html()=="<br>"){
						e.preventDefault();
					}
				}else{
					var mdItem = MarkDownItem.newInstance(parentElem);
					flagEdit = true;
					var tagName = parentElem.tagName;
					if(tagName != "P" || $(parentElem).parent("blockquote").size()>0){
						if($(parentElem).html()==""||$(parentElem).html()=="<br>"){
							if(tagName == "LI"){
								var liArr = $(parentElem).parent().find("li");
								if(liArr.size()==1){
									e.preventDefault();
									var newItem = $("<p><br></p>");
									$(mdItem.rootElem).html(newItem);
									setRangeWithin(newItem[0], 0);
								}
							}else{
								e.preventDefault();
								var newItem = $("<p><br></p>");
								$(mdItem.rootElem).html(newItem);
								setRangeWithin(newItem[0], 0);
							}
						}
					}
				}
				break
				case 127:
					break
				case 38: //上
					if(flagMenuOpen){
						e.preventDefault();
						CommandMenu.MoveMenuSelection(-1);
					}
					break;
				case 40: //下
					if(flagMenuOpen){
						e.preventDefault();
						CommandMenu.MoveMenuSelection(1);
					}
					break;
		}
    });
	
	var CommandMenu = {
		action : function(){
			var $options = $(".CommandMenu>.CommandEntry");
			var $selected = $(".CommandMenu>.CommandEntry--focused");
			var selectedPos = $options.index($selected);
			switch(selectedPos){
				case 0:
					CommandMenu.Heading(1);
					break;
				case 1:
					CommandMenu.Heading(2);
					break;
				case 2:
					CommandMenu.Heading(3);
					break;
				case 3:
					CommandMenu.Blockquote();
					break;
				case 4:
					CommandMenu.UnorderedList();
					break;
				case 5:
					CommandMenu.OrderedList();
					break;
				case 6:
					CommandMenu.Link();
					break;
				case 7:
					CommandMenu.InsertImage();
					break;
				case 8:
			};
			CommandMenu.selectMenuOption(0);
		},
		selectMenuOption : function(pos){
			var $options = $(".CommandMenu>.CommandEntry");
			var $selected = $(".CommandMenu>.CommandEntry--focused");
			$selected.removeClass("CommandEntry--focused");
			$options.eq(pos).addClass("CommandEntry--focused");
		},
		MoveMenuSelection : function(offset){
			var $options = $(".CommandMenu>.CommandEntry");
			var $selected = $(".CommandMenu>.CommandEntry--focused");
			var size = $options.size();
			var selectedPos = $options.index($selected);
			if(selectedPos+offset>size-1)
				selectedPos = selectedPos+offset-size;
			else if(selectedPos+offset<0)
				selectedPos = selectedPos+offset+size;
			else 
				selectedPos += offset;
			CommandMenu.selectMenuOption(selectedPos);
		},
		removeSlash : function(value){
			var reg = /(?:^\/$| \/$)/;
			value = value.replace(reg, function(word){
				if(word.startsWith(" "))
					return " ";
				else
					return "";
			});
			return value;
		},
		Heading : function(level){
			var parentElem =  getCaretParentElementWithin(editor);
			var offset = getCaretOffsetWithin(parentElem);
			var mdItem = MarkDownItem.newInstance(parentElem);
			var html = $(mdItem.parentElem).html();
			var prefix = "";
			for(var i=0;i<level;i++)
				prefix+="#";
			html = CommandMenu.removeSlash(html);
			if(offset>html.length)
				offset = html.length;
			$(mdItem.parentElem).html(prefix+" "+html);
			mdItem.checkMarkDown(offset);
		},
		Blockquote : function(){
			var parentElem =  getCaretParentElementWithin(editor);
			var offset = getCaretOffsetWithin(parentElem);
			var mdItem = MarkDownItem.newInstance(parentElem);
			var html = $(mdItem.parentElem).html();
			var prefix = ">";
			html = CommandMenu.removeSlash(html);
			$(mdItem.parentElem).html(prefix+" "+html);
			mdItem.checkMarkDown(offset);
		},
		UnorderedList : function(){
			var parentElem =  getCaretParentElementWithin(editor);
			var offset = getCaretOffsetWithin(parentElem);
			var mdItem = MarkDownItem.newInstance(parentElem);
			var html = $(mdItem.parentElem).html();
			var prefix = "*";
			html = CommandMenu.removeSlash(html);
			$(mdItem.parentElem).html(prefix+" "+html);
			mdItem.checkMarkDown(offset);
		},
		OrderedList : function(){
			var parentElem =  getCaretParentElementWithin(editor);
			var offset = getCaretOffsetWithin(parentElem);
			var mdItem = MarkDownItem.newInstance(parentElem);
			var html = $(mdItem.parentElem).html();
			var prefix = "1.";
			html = CommandMenu.removeSlash(html);
			$(mdItem.parentElem).html(prefix+" "+html);
			mdItem.checkMarkDown(offset);
		},
		Link : function(){
			var parentElem = getCaretParentElementWithin(editor);
			var $linkEditor = $(".EmbedEditor");
			$linkEditor.show();
			var coor = getSelectionCoords();
			$linkEditor.css("left", coor.x);
			$linkEditor.css("top", coor.y+$(parentElem).height());
			$linkEditor.children("[name='text']").focus();
			flagLinkModalOpen = true;
			var mdItem = MarkDownItem.newInstance(parentElem);
			var offset = getCaretOffsetWithin(mdItem.parentElem);
			var oldText = mdItem.getContentAsText();
			var html = $(mdItem.parentElem).html();
			html = CommandMenu.removeSlash(html);
			$(mdItem.parentElem).html(html);
			var newText = mdItem.getContentAsText();
			offset += (newText.length-oldText.length);
			if(offset>newText.length)
				offset = newText.length;
			
			$linkEditor.keydown(function(e){
				if(e.keyCode===13){
					e.preventDefault();
					$linkEditor.children("[type='submit']").click();
				}
			});
			$linkEditor.children("[type='submit']").click(function(e) {
				$linkEditor.hide();
				flagLinkModalOpen = false;
				$(this).unbind('click');
				$linkEditor.unbind('keydown');
				
                var mText = $linkEditor.children("[name='text']").val();
                var mLink = $linkEditor.children("[name='link']").val();
				$linkEditor.children("[name='text']").val("");
				$linkEditor.children("[name='link']").val("");
				if(!/https?:\/\//.exec(mLink))
					mLink = "http://"+mLink;
				var html = '<a href="'+mLink+'">'+mText+'</a>';
				setRangeWithin(mdItem.parentElem, offset);
				insertAtCaret(html, false);
            });
		},
		InsertImage : function(){
			var parentElem = getCaretParentElementWithin(editor);
			var mdItem = MarkDownItem.newInstance(parentElem);
			var offset = getCaretOffsetWithin(mdItem.parentElem);
			var oldText = mdItem.getContentAsText();
			var html = $(mdItem.parentElem).html();
			html = CommandMenu.removeSlash(html);
			$(mdItem.parentElem).html(html);
			var newText = mdItem.getContentAsText();
			offset += (newText.length-oldText.length);
			if(offset>newText.length)
				offset = newText.length;
			setRangeWithin(mdItem.parentElem, offset);
				
			var $inputFile = $("<input type='file' accept='image/*' style='display:none'/>");
			$inputFile.appendTo($("body"));
			$inputFile.change(function(e) {
				$inputFile.unbind('change');
				CommandMenu.ImageToBase64($inputFile[0], function(base64){
					$inputFile.remove();
					var html = '<img src="'+base64+'" />';
					setRangeWithin(mdItem.parentElem, offset);
					insertAtCaret(html, false);
				});
            });
			$inputFile.click();
		},
		ImageToBase64 : function(inputFile, callback) {  
			if (typeof (FileReader) === 'undefined') {  
				alert("抱歉，你的浏览器不支持 FileReader，不能将图片转换为Base64，请使用现代浏览器操作！");  
			} else {  
				try {  
					/*图片转Base64 核心代码*/  
					var file = inputFile.files[0];
					if (!/image\/\w+/.test(file.type)) {  
						alert("请确保文件为图像类型");  
						return false;  
					}  
					var reader = new FileReader();  
					reader.onload = function () {  
						callback(this.result);  
					}  
					reader.readAsDataURL(file);  
				} catch (e) {  
					alert('图片转Base64出错！' + e.toString())  
				}  
			}  
		} 
	}
	
	var MarkDownItem = {
		newInstance: function(parentElem){
			var mdItem = {};
			if(parentElem.tagName=="EM"||parentElem.tagName=="STRONG"||parentElem.tagName=="I"||parentElem.tagName=="B"||parentElem.tagName=="A")
				parentElem = $(parentElem).parents(":not(em,strong,i,b,a)")[0];
			mdItem.parentElem = parentElem;
			mdItem.rootElem = $(parentElem).parents(".markdown-item")[0];
			mdItem.checkMarkDown = function(caretPos){
				if(this.parentElem.tagName!=="CODE"&&(this.matchPrefix()||this.matchTextStyle())){
					var oldText = this.getContentAsText();
					var mdItem = this.checkIfChangeLine();
					var newText = mdItem.getContentAsText();
					caretPos += (newText.length-oldText.length);
					if(caretPos>newText.length)
						caretPos = newText.length;
					setRangeWithin(mdItem.parentElem, caretPos);
					return true;
				}
				return false;
			};
			mdItem.getContentAsText = function(){
				return $('<div>').html($(this.parentElem).html()).text();
			};
			mdItem.getContentAsHtml = function(){
				return $('<div>').text($(this.parentElem).html()).html();
			};
			mdItem.matchPrefix = function(){
				var value = $(this.parentElem).html();
				value = $('<div>').html(value).text();
				var reg = /(?:^(?:[#|*|>]+|\d+\.)|!?\[.*?\]\(.*?\)|^   ) /;
				return reg.exec(value);
			};
			mdItem.matchTextStyle = function(){
				var value = $(this.parentElem).html();
				value = $('<div>').html(value).text();
				var reg = /(?:^| )(?:(([\*_])\2)[^\*_]+?\1|([\*_])[^\*_]+?\3)/;
				return reg.exec(value);
			};
			mdItem.checkIfChangeLine = function(){
				var value = this.getContentAsText();
				var mdItem = this;
				mdItem.checkTextStyle();
				var newHtml = md.render(mdItem.getContentAsText());
				if(this.matchPrefix()){
					if($(this.parentElem)[0].tagName == "LI"){
						mdItem = this.insertNewAfter(false);
						var liArr = $(this.parentElem).parent().find("li");
						if(liArr.size()>1){
							$(this.parentElem).remove();
						}else{
							$(this.rootElem).remove();
						}
					}
					flagEdit = true;
					$(mdItem.rootElem).html(newHtml);
					var child = $(mdItem.rootElem).children("p,h1,h2,h3,h4,h5,h6")[0] || $(mdItem.rootElem).find("ul>li,ol>li,blockquote>p,pre>code")[0];
					if(child && child.innerHTML==""){
						child.innerHTML = "<br>";
					}else if($(mdItem.rootElem).find("blockquote") && $(mdItem.rootElem).find("blockquote").html()==""){
						child = $("<p><br></p>");
						child.appendTo($(mdItem.rootElem).find("blockquote"));
						child = child[0];
					}
					mdItem.parentElem = child;
				}else if(this.matchTextStyle()){
					flagEdit = true;
					var content = $(newHtml).html();
					$(this.parentElem).html(content);
				}
				return mdItem;
			};
			mdItem.checkTextStyle = function(){
				$(this.parentElem).find("a").each(function(i, elem){
					var href = $(elem).attr("href");
					var text = $(elem).html();
					text = (text!="")?text:href;
					$(elem).replaceWith("["+text+"]("+href+")");
				});
				$(this.parentElem).find("em,i").each(function(i, elem){
					var text = $(elem).html();
					$(elem).replaceWith("_"+text+"_");
				});
				$(this.parentElem).find("strong,b").each(function(i, elem){
					var text = $(elem).html();
					$(elem).replaceWith("**"+text+"**");
				});
				return $(this.parentElem).html();
			};
			mdItem.insertNewAfter = function(breakContent){
				var lastCon; 
				var nextCon;
				if(breakContent){
					var offset = getCaretOffsetWithin(this.parentElem);
					var result = breakAtCaret(this.parentElem, offset);
					lastCon = $("<div>").append(result[0]).html();
					nextCon = $("<div>").append(result[1]).html();
				}
				lastCon = (lastCon=="")?"<br>":lastCon;
				nextCon = (nextCon=="")?"<br>":nextCon;
				$(this.parentElem).html(lastCon);
				var newMDitem = $("<div class=\"markdown-item\"><p>"+nextCon+"</p></div>");
				newMDitem.insertAfter(this.rootElem);
				var child = newMDitem.children("p")[0];
				setRangeWithin(child, 0);
				return MarkDownItem.newInstance(child);
			};
			mdItem.insertNewLi = function(){
				var offset = getCaretOffsetWithin(this.parentElem);
				var result = breakAtCaret(this.parentElem, offset);
				lastCon = $("<div>").append(result[0]).html();
				nextCon = $("<div>").append(result[1]).html();
				lastCon = (lastCon=="")?"<br>":lastCon;
				nextCon = (nextCon=="")?"<br>":nextCon;
				$(this.parentElem).html(lastCon);
				var parentElem = $("<li>"+nextCon+"</li>");
				parentElem.insertAfter(this.parentElem);
				setRangeWithin(parentElem[0], 0);
			};
			mdItem.insertNewBlockquote = function(){
				var offset = getCaretOffsetWithin(this.parentElem);
				var result = breakAtCaret(this.parentElem, offset);
				lastCon = $("<div>").append(result[0]).html();
				nextCon = $("<div>").append(result[1]).html();
				lastCon = (lastCon=="")?"<br>":lastCon;
				nextCon = (nextCon=="")?"<br>":nextCon;
				$(this.parentElem).html(lastCon);
				var newMDitem = $("<div class=\"markdown-item\"><blockquote><p>"+nextCon+"</p></blockquote></div>");
				newMDitem.insertAfter(this.rootElem);
				var child = newMDitem.find("p")[0];
				setRangeWithin(child, 0);
			};
			return mdItem;
		}
	};
	
	
	function breakAtCaret(node, offset){
		var length = $('<div>').html($(node).html()).text().length;
		var startRange = setRangeWithin(node, 0).range;
		var middleRange = setRangeWithin(node, offset).range;
		var endRange = setRangeWithin(node, length).range;
		startRange.setEnd(middleRange.startContainer, middleRange.startOffset);
		endRange.setStart(middleRange.endContainer, middleRange.endOffset);
		return [startRange.extractContents(), endRange.extractContents()];
	}
	
	function setRangeWithin(node, offset){
		var range = null;
		for(var i=0;i<node.childNodes.length;i++){
			var textNode = node.childNodes[i];
			if(textNode.childNodes.length>0){
				var result = setRangeWithin(textNode, offset);
				range = result.range;
				offset = result.offset;
				continue;
			}
			if(range==null){
				if(offset>textNode.length){
					offset-=textNode.length;
					continue;
				}
				range = document.createRange();
				range.setStart(textNode, offset);
				range.setEnd(textNode, offset);
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
				break;
			} else
				break;
		}
		return {range :range, offset : offset};
	}
	
	function caretIn(element){
		var parentElem = getCaretParentElementWithin(element);
		return typeof(parentElem)=="undefined";
	}
	
	function insertAtCaret(html, selectPastedContent) {
		var sel, range;
		if (window.getSelection) {
			// IE9 and non-IE
			sel = window.getSelection();
			if (sel.getRangeAt && sel.rangeCount) {
				range = sel.getRangeAt(0);
				range.deleteContents();
	
				// Range.createContextualFragment() would be useful here but is
				// only relatively recently standardized and is not supported in
				// some browsers (IE9, for one)
				var el = document.createElement("div");
				el.innerHTML = html;
				var frag = document.createDocumentFragment(), node, lastNode;
				while ( (node = el.firstChild) ) {
					lastNode = frag.appendChild(node);
				}
				var firstNode = frag.firstChild;
				range.insertNode(frag);
	
				// Preserve the selection
				if (lastNode) {
					range = range.cloneRange();
					range.setStartAfter(lastNode);
					if (selectPastedContent) {
						range.setStartBefore(firstNode);
					} else {
						range.collapse(true);
					}
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}
		} else if ( (sel = document.selection) && sel.type != "Control") {
			// IE < 9
			var originalRange = sel.createRange();
			originalRange.collapse(true);
			sel.createRange().pasteHTML(html);
			if (selectPastedContent) {
				range = sel.createRange();
				range.setEndPoint("StartToStart", originalRange);
				range.select();
			}
		}
	}
	
	function getCaretOffsetWithin(element) {
		var caretOffset = 0;
		var doc = element.ownerDocument || element.document;
		var win = doc.defaultView || doc.parentWindow;
		var sel;
		if (typeof win.getSelection != "undefined") {
			sel = win.getSelection();
			if (sel.rangeCount > 0) {
				var range = win.getSelection().getRangeAt(0);
				var preCaretRange = range.cloneRange();
				preCaretRange.selectNodeContents(element);
				preCaretRange.setEnd(range.endContainer, range.endOffset);
				caretOffset = preCaretRange.toString().length;
			}
		} else if ( (sel = doc.selection) && sel.type != "Control") {
			var textRange = sel.createRange();
			var preCaretTextRange = doc.body.createTextRange();
			preCaretTextRange.moveToElementText(element);
			preCaretTextRange.setEndPoint("EndToEnd", textRange);
			caretOffset = preCaretTextRange.text.length;
		}
		return caretOffset;
	}
	
	function getCaretParentElementWithin(element) {
		var parentElement;
		var doc = element.ownerDocument || element.document;
		var win = doc.defaultView || doc.parentWindow;
		var sel;
		if (typeof win.getSelection != "undefined") {
			sel = win.getSelection();
			if (sel.rangeCount > 0) {
				var range = win.getSelection().getRangeAt(0);
				if(range.startContainer.toString()=="[object Text]")
					parentElement = range.startContainer.parentElement;
				else
					parentElement = range.startContainer;
			}
		} else if ( (sel = doc.selection) && sel.type != "Control") {
			var textRange = sel.createRange();
			parentElement = range.parentElement();
		}
		return parentElement;
	}
	
	function getSelectionCoords(win) {
		win = win || window;
		var doc = win.document;
		var sel = doc.selection, range, rects, rect;
		var x = 0, y = 0;
		if (sel) {
			if (sel.type != "Control") {
				range = sel.createRange();
				range.collapse(true);
				x = range.boundingLeft;
				y = range.boundingTop;
			}
		} else if (win.getSelection) {
			sel = win.getSelection();
			if (sel.rangeCount) {
				range = sel.getRangeAt(0).cloneRange();
				if (range.getClientRects) {
					range.collapse(true);
					rects = range.getClientRects();
					if (rects.length > 0) {
						rect = rects[0];
					}
					x = rect.left;
					y = rect.top;
				}
				// Fall back to inserting a temporary element
				if (x == 0 && y == 0) {
					var span = doc.createElement("span");
					if (span.getClientRects) {
						// Ensure span has dimensions and position by
						// adding a zero-width space character
						span.appendChild( doc.createTextNode("\u200b") );
						range.insertNode(span);
						rect = span.getClientRects()[0];
						x = rect.left;
						y = rect.top;
						var spanParent = span.parentNode;
						spanParent.removeChild(span);
	
						// Glue any broken text nodes back together
						spanParent.normalize();
					}
				}
			}
		}
		return { x: x, y: y };
	}
