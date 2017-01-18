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
	
	var flagEdit = false;
	$("#out").change(function(e) {
		if(flagEdit){
			flagEdit = false;
			return;
		}
		var parentElem =  $(getCaretParentElementWithin(this));
		var mdItem = MarkDownItem.newInstance(parentElem);
		if($(mdItem.rootElem).hasClass("title"))
			return;
		flagEdit = mdItem.checkMarkDown();
		
		var content = parentElem.html();
		var reg = / \/$/;
		if(reg.exec(content)){
			console.log("matched");
			$(".CommandMenu").show();
		}
    });
	

    $("#out").on('keydown', function(e){
	  //13:Enter, 8:Backspace, 127:DEL
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
		}
    });
	
	$(".title>h1").change(function(e) {
        if($(this).html()==""||$(this).html()=="<br>"){
			$(".title>.placeholder").show();
		}else{
			$(".title>.placeholder").hide();
		}
    });
	
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
