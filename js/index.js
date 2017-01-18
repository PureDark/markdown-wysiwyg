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
      html: true
    })
      .use(markdownitFootnote);


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
		selectMenuOption(pos);
    });
	
	document.onselectionchange = function() {
		var parentElem =  $(getCaretParentElementWithin($("#out")[0]));
		var content = parentElem.html();
		var offset = getCaretOffsetWithin(parentElem[0]);
		var lastCon = content.substring(offset-2, offset);
		var reg = / \/$/;
		if(reg.exec(lastCon)){
			var $cm = $(".CommandMenu");
			$cm.show();
			var coor = getSelectionCoords();
			$cm.css("left", coor.x);
			$cm.css("top", coor.y+parentElem.height());
			flagMenuOpen = true;
		}else{
			$(".CommandMenu").hide();
			flagMenuOpen = false;
		}
	};
	
	$("#out").change(function(e) {
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
		var parentElem =  $(getCaretParentElementWithin(this));
		var mdItem = MarkDownItem.newInstance(parentElem);
		if($(mdItem.rootElem).hasClass("title"))
			return;
		flagEdit = mdItem.checkMarkDown();
    });
	

    $("#out").on('keydown', function(e){
	  //13:Enter, 8:Backspace, 127:Delete
		switch(e.keyCode){
			case 13:
				var parentElem =  $(getCaretParentElementWithin(this));
				var mdItem = MarkDownItem.newInstance(parentElem[0]);
				flagEdit = true;
				if(parentElem[0].tagName == "LI"){
					e.preventDefault();
					var liArr = $(parentElem).parent().find("li");
					if(liArr.index(parentElem)==liArr.size()-1&&(parentElem.html()==""||parentElem.html()=="<br>")){
						parentElem.remove();
						mdItem.insertNewAfter();
					} else{
						mdItem.insertNewLi();
					}
				}else if(parentElem[0].tagName == "P"&&parentElem.parent("blockquote").size()>0){
					e.preventDefault();
					var blockquote = parentElem.parent("blockquote");
					if(parentElem.html()==""||parentElem.html()=="<br>"){
						mdItem.insertNewAfter();
						mdItem.rootElem.remove();
					}else{
						mdItem.insertNewBlockquote();
					}
				}else{
					e.preventDefault();
					mdItem.insertNewAfter();
				}
				break;
			case 8:
				var parentElem =  $(getCaretParentElementWithin(this));
				if(parentElem.parents(".title").size()>0){
					if(parentElem.html()==""||parentElem.html()=="<br>"){
						e.preventDefault();
					}
				}else{
					var mdItem = MarkDownItem.newInstance(parentElem);
					flagEdit = true;
					var tagName = parentElem[0].tagName;
					if(tagName != "P"){
						if(parentElem.html()==""||parentElem.html()=="<br>"){
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
						MoveMenuSelection(-1);
					}
					break;
				case 40: //下
					if(flagMenuOpen){
						e.preventDefault();
						MoveMenuSelection(1);
					}
					break;
		}
    });
	
	function selectMenuOption(pos){
		var $options = $(".CommandMenu>.CommandEntry");
		var $selected = $(".CommandMenu>.CommandEntry--focused");
		$selected.removeClass("CommandEntry--focused");
		$options.eq(pos).addClass("CommandEntry--focused");
	}
	
	function MoveMenuSelection(offset){
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
		selectMenuOption(selectedPos);
	}
	
	var MarkDownItem = {
		newInstance: function(parentElem){
			var mdItem = {};
			mdItem.parentElem = parentElem;
			mdItem.rootElem = $(parentElem).parents(".markdown-item")[0];
			mdItem.checkMarkDown = function(){
				var value = $(this.parentElem).html();
				value = $('<div>').html(value).text();
				var reg = /^([#|*|>]+|\d+\.) /;
				if(reg.exec(value)){
					$(this.rootElem).html(md.render(value));
					var child = $(this.rootElem).children("p,h1,h2,h3,h4,h5,h6")[0] || $(this.rootElem).find("ul>li,ol>li,blockquote>p")[0];
					if(child && child.innerHTML==""){
						child.innerHTML = "<br>";
					}else if($(this.rootElem).find("blockquote") && $(this.rootElem).find("blockquote").html()==""){
						child = $("<p><br></p>");
						child.appendTo($(this.rootElem).find("blockquote"));
						child = child[0];
					}
					setRangeWithin(child, 0);
					return true;
				}
				return false;
			};
			mdItem.insertNewAfter = function(){
				var offset = getCaretOffsetWithin(this.parentElem);
				var content = $(this.parentElem).html();
				var lastCon = content.substring(0, offset);
				var nextCon = content.substr(offset);
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
				var content = $(this.parentElem).html();
				var lastCon = content.substring(0, offset);
				var nextCon = content.substr(offset);
				lastCon = (lastCon=="")?"<br>":lastCon;
				nextCon = (nextCon=="")?"<br>":nextCon;
				$(this.parentElem).html(lastCon);
				var parentElem = $("<li>"+nextCon+"</li>");
				parentElem.insertAfter(this.parentElem);
				setRangeWithin(parentElem[0], 0);
			};
			mdItem.insertNewBlockquote = function(){
				var offset = getCaretOffsetWithin(this.parentElem);
				var content = $(this.parentElem).html();
				var lastCon = content.substring(0, offset);
				var nextCon = content.substr(offset);
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
	
	
	function setRangeWithin(node, offset) {
		node.focus();
		var textNode = node.firstChild;
		var caret = offset; 
		var range = document.createRange();
		range.setStart(textNode, caret);
		range.setEnd(textNode, caret);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
		return range;
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
