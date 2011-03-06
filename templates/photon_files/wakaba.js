var salo = {}, // всем libsalo.js по bsd-лицензии, пацаны
    postByNum = [],
    ajaxPosts = {},
    refArr = [];

/**
 * Setter and getter for cookie data
 * 
 * @param {String} name
 * @param {String} value Optional
 * @param {Int} days Optional
 * @returns Cookie data
 */
salo.cookie = function(name, value, days) {
    if (value === undefined) {
        var regexp = new RegExp("(^|;\\s+)"+name+"=(.*?)(;|$)"),
            hit = regexp.exec(document.cookie);
        if (hit && hit.length > 2) {
            return unescape(hit[2]);
        } else {
            return;
        }
    } else {
        var expires;
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
        } else {
            expires = "";
        }

        document.cookie = name + "=" + value+expires + "; path=/";
    }
};

/**
 * Browser detector
 *
 * @static
 */
salo.browser = (function detectBrowsers() {
    var ua = navigator.userAgent.toLowerCase(),
        browsers = {
        ua : ua,
        version : "",
        versionNumber : (ua.match( /.+(?:me|ox|on|rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
        opera : /opera/i.test(ua),
        msie : (!this.opera && /msie/i.test(ua)),
        msie6 : (!this.opera && /msie 6/i.test(ua)),
        msie7 : (!this.opera && /msie 7/i.test(ua)),
        msie8 : (!this.opera && /msie 8/i.test(ua)),
        firefox : /firefox/i.test(ua),
        chrome : /chrome/i.test(ua),
        safari : (!(/chrome/i.test(ua)) && /webkit|safari|khtml/i.test(ua)),
        iphone : /iphone/i.test(ua),
        ipod : /ipod/i.test(ua),
        iphone4 : /iphone.*OS 4/i.test(ua),
        ipod4 : /ipod.*OS 4/i.test(ua),
        ipad : /ipad/i.test(ua),
        safari_mobile : /iphone|ipod|ipad/i.test(ua),
        mobile : /iphone|ipod|ipad|opera mini|opera mobi/i.test(ua)
    };
    
    for (var i in browsers) {
        var browser = browsers[i];
        if (browser && !i.match(/(msie|ipod|mobile)\d/)) {
            var name = i.substr(0,1).toUpperCase()+i.substr(1);
            browsers.version = name+" "+browsers.versionNumber;
        }
    }
    
    return browsers;
})();

function $X(path, root) {
    return document.evaluate(path, root || document, null, 6, null);
}
function $x(path, root) {
    return document.evaluate(path, root || document, null, 8, null).singleNodeValue;
}
function $del(el) {
    if (el) {
        el.parentNode.removeChild(el);
    }
}
function $each(list, fn) {
    if (!list) {
        return;
    }
    var i = list.snapshotLength;
    if(i > 0) while(i--) fn(list.snapshotItem(i), i);
}

function AJAX(b, id, fn) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(xhr.readyState != 4) return;
        if(xhr.status == 200) {
            var x = xhr.responseText;
            var threads = x.substring(x.search(/<form[^>]+del/) + x.match(/<form[^>]+del[^>]+>/).toString().length, x.indexOf('userdelete">') - 13).split(/<br clear="left"[\s\/>]*<h[r\s\/]*>/i);
            for(var i = 0, tLen = threads.length - 1; i < tLen; i++) {
                var tNum = threads[i].match(/<input[^>]+checkbox[^>]+>/i)[0].match(/(?:")(\d+)(?:")/)[1];
                var posts = threads[i].split(/<table[^>]*>/);
                ajaxPosts[tNum] = {keys: []};
                for(var j = 0, pLen = posts.length; j < pLen; j++) {
                    var x = posts[j];
                    var pNum = x.match(/<input[^>]+checkbox[^>]+>/i)[0].match(/(?:")(\d+)(?:")/)[1];
                    ajaxPosts[tNum].keys.push(pNum);
                    ajaxPosts[tNum][pNum] = x.substring((!/<\/td/.test(x) && /filesize">/.test(x)) ? x.indexOf('filesize">') - 13 : x.indexOf('<label'), /<\/td/.test(x) ? x.lastIndexOf('</td') : (/omittedposts">/.test(x) ? x.lastIndexOf('</span') + 7 : x.lastIndexOf('</blockquote') + 13));
                    x = ajaxPosts[tNum][pNum].substr(ajaxPosts[tNum][pNum].indexOf('<blockquote>') + 12).match(/&gt;&gt;\d+/g);
                    if(x) for(var r = 0; rLen = x.length, r < rLen; r++)
                        getRefMap(x[r], pNum, x[r].replace(/&gt;&gt;/g, ''));
                }
            }
            fn();
        } else fn('HTTP ' + xhr.status + ' ' + xhr.statusText);
    };
    xhr.open('GET', '/' + b + '/res/' + id + '.html', true);
    xhr.send(false);
}

function delPostPreview(e) {
    var el = $x('ancestor-or-self::*[starts-with(@id,"pstprev")]', e.relatedTarget);
    if(!el) $each($X('.//div[starts-with(@id,"pstprev")]'), function(clone) {$del(clone)});
    else while(el.nextSibling) $del(el.nextSibling);
}

function showPostPreview(e) {
    var tNum = this.pathname.substring(this.pathname.lastIndexOf('/')).match(/\d+/);
    var pNum = this.hash.match(/\d+/) || tNum;
    var brd = this.pathname.match(/[^\/]+/);
    var x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft + 1;
    var y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
    var cln = document.createElement('div');
    cln.id = 'pstprev_' + pNum;
    cln.className = 'reply';
    cln.style.cssText = 'position:absolute; z-index:950; border:solid 1px #575763; top:' + y + 'px;' +
        (x < document.body.clientWidth/2 ? 'left:' + x + 'px' : 'right:' + parseInt(document.body.clientWidth - x + 1) + 'px');
    cln.addEventListener('mouseout', delPostPreview, false);
    var aj = ajaxPosts[tNum];
    var functor = function(cln, html) {
        cln.innerHTML = html;
        doRefPreview(cln);
        if(!$x('.//small', cln) && ajaxPosts[tNum] && ajaxPosts[tNum][pNum] && refArr[pNum])
            showRefMap(cln, pNum, tNum, brd);
    };
    cln.innerHTML = '<img src="/icons/load.gif" alt="load" />&nbsp;Загрузка';
    if(postByNum[pNum]) functor(cln, postByNum[pNum].innerHTML);
    else {if(aj && aj[pNum]) functor(cln, aj[pNum]);
    else AJAX(brd, tNum, function(err) {functor(cln, err || ajaxPosts[tNum][pNum] || 'Пост не найден')})}
    $del(document.getElementById(cln.id));
    $x('.//form[@id="delform"]').appendChild(cln);
}

function doRefPreview(node) {
    $each($X('.//a[starts-with(text(),">>")]', node || document), function(link) {
        link.addEventListener('mouseover', showPostPreview, false);
        link.addEventListener('mouseout', delPostPreview, false);
    });
}

function getRefMap(post, pNum, rNum) {
    if(!refArr[rNum]) refArr[rNum] = pNum;
    else if(refArr[rNum].indexOf(pNum) == -1) refArr[rNum] = pNum + ', ' + refArr[rNum];
}

function showRefMap(post, pNum, tNum, brd) {
    var ref = refArr[pNum].toString().replace(/(\d+)/g, 
    '<a href="' + (tNum ? '/' + brd + '/res/' + tNum + '.html#$1' : '#$1') + '" onclick="highlight($1)">&gt;&gt;$1</a>');
    var map = document.createElement('small');
    map.id = 'rfmap_' + pNum;
    map.innerHTML = '<br><i class="abbrev">&nbsp;Ответы: ' + ref + '</i><br>';
    doRefPreview(map);
    if(post) post.appendChild(map);
    else {
        var el = $x('.//a[@name="' + pNum + '"]');
        while(el.tagName != 'BLOCKQUOTE') el = el.nextSibling;
        el.parentNode.insertBefore(map, el.nextSibling);
    }
}

function doRefMap() {
    $each($X('.//a[starts-with(text(),">>")]'), function(link) {
        if(!/\//.test(link.textContent)) {
            var rNum = link.hash.match(/\d+/);
            var post = $x('./ancestor::td', link);
            if((postByNum[rNum] || $x('.//a[@name="' + rNum + '"]')) && post)
                getRefMap(post, post.id.match(/\d+/), rNum);
        }
    });
    for(var rNum in refArr) showRefMap(postByNum[rNum], rNum)
}

function lazyadmin() {
    var admin = salo.cookie("wakaadmin");
    if (!admin) {
        return;
    }
    var posts = document.getElementsByClassName('reflink'), post, id, pos, tmp,
        board=document.location.toString().split("/")[3];
    for(var i=0;i<posts.length;i++) {
        post = posts[i];
        //This is wrong, but monkey cannot Regexp.
        pos=post.innerHTML.indexOf('№');
        //console.log(post.innerHTML+"\n"+pos);
        if(pos>0) {
            tmp=post.innerHTML.substring(pos+1);
            id=tmp.substring(0,tmp.indexOf('<'));
            post.innerHTML+="[ <a title=\"Удалить это сообщение\" href=\"/"+board+"/wakaba.pl?task=delete&admin="+admin+"&delete="+id+"&mode=2\" onclick=\"return nyak_nyak(this)\">D</a> | " +
            "<a title=\"Забанить автора\" href=\"/"+board+"/wakaba.pl?admin="+admin+"&task=banpost&post="+id+"&mode=3\" onclick=\"return do_ban(this)\" onclick=\"return do_ban(this)\">B</a> | " +
            "<a title=\"Забанить автора и удалить это сообщение\" href=\"/"+board+"/wakaba.pl?admin="+admin+"&task=banpost&post="+id+"&mode=1\" onclick=\"return do_ban(this)\">D&B</a> | " +
            "<a title=\"Удалить все сообщения этого автора\" href=\"/"+board+"/wakaba.pl?task=banpost&admin="+admin+"&post="+id+"&mode=5\" onclick=\"return nyak_nyak(this)\">DAll</a> | " +
            "<a title=\"Забанить автора и удалить все его сообщения\" href=\"/"+board+"/wakaba.pl?admin="+admin+"&task=banpost&post="+id+"&mode=6\" onclick=\"return do_ban(this)\">DAll&B</a> | " +
            "<a title=\"Удалить файл из сообщения\" href=\"/"+board+"/wakaba.pl?task=delete&admin="+admin+"&delete="+id+"&fileonly=on&mode=2\" onclick=\"return nyak_nyak(this)\">F</a> | " +
			"<a title=\"Закрыть тред\" href=\"/"+board+"/wakaba.pl?task=lock&admin="+admin+"&num="+id+"\" onclick=\"return nyak_nyak(this)\">L</a> | " + 
			"<a title=\"Открыть тред\" href=\"/"+board+"/wakaba.pl?task=unlock&admin="+admin+"&num="+id+"\" onclick=\"return nyak_nyak(this)\">UL</a> | " + 
			"<a title=\"Прикрепить тред\" href=\"/"+board+"/wakaba.pl?task=stick&admin="+admin+"&num="+id+"\" onclick=\"return nyak_nyak(this)\">S</a> | " + 
			"<a title=\"Отцепить тред\" href=\"/"+board+"/wakaba.pl?task=unstick&admin="+admin+"&num="+id+"\" onclick=\"return nyak_nyak(this)\">US</a> | " + 
            "<a title=\"Перенести в архив\" href=\"/"+board+"/wakaba.pl?task=delete&admin="+admin+"&archive=Archive&mode=2&delete="+id+"\" onclick=\"return nyak_nyak(this)\">A</a> ]&nbsp;";
        }

    }
}

function nyak_nyak(el) {
    if (confirm("Вы уверены в своих действиях?")) {
        document.location = el.href;
	}
    return false;
}

function do_ban(el) {
    if (reason=prompt("Напишите причину бана, пожалуйста:")) {
        document.location = el.href+"&comment="+encodeURIComponent(reason);
    }
    return false;
}

function fastload() {
    lazyadmin();
    $each($X('.//td[@class="reply"]'), function(post) {postByNum[post.id.match(/\d+/)] = post});
    doRefPreview();
    doRefMap();
}

function expand(num,src,thumb_src,n_w,n_h,o_w,o_h) {
    var mode=n_w>o_w&&n_h>o_h;
    document.getElementById("exlink_"+num).innerHTML="<a href=\""+src+"\" onClick=\"expand("+num+",'"+src+"','"+thumb_src+"',"+o_w+","+o_h+","+n_w+","+n_h+"); return false;\"><img src=\""+(mode ? src : thumb_src)+"\" width=\""+n_w+"\" height=\""+n_h+"\" class=\"img\" /></a>";

}

function get_cookie(name)
{
	with(document.cookie)
	{
		var regexp=new RegExp("(^|;\\s+)"+name+"=(.*?)(;|$)");
		var hit=regexp.exec(document.cookie);
		if(hit&&hit.length>2) return unescape(hit[2]);
		else return '';
	}
};

function set_cookie(name,value,days)
{
	if(days)
	{
		var date=new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires="; expires="+date.toGMTString();
	}
	else expires="";
	document.cookie=name+"="+value+expires+"; path=/";
}

function get_password(name) {
    var pass = salo.cookie(name),
        chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    if (pass) {
        return pass;
    }
    pass = '';

    for(var i=0;i<8;i++) {
        var rnd = Math.floor(Math.random()*chars.length);
        pass += chars.substring(rnd,rnd+1);
    }

    return pass;
}

function update_captcha(e) {
    e.src = e.src.replace(/dummy=[0-9]*/, "dummy=" + Math.floor(Math.random() * 1000).toString());
}

function update_captcha2() {
    var e = document.getElementById('imgcaptcha');
    if (e) {
        update_captcha(e);
    }
}

//Принудительный ввод капчи на английском
function reverseCaptcha(e) {
    var key;
    if (e.which<1040 || e.which>1279) {
        return;
    }
    e.preventDefault();
    switch(e.which) {
        case 1081: key='q'; break;
        case 1094: key='w'; break;
        case 1091: key='e'; break;
        case 1082: key='r'; break;
        case 1077: key='t'; break;
        case 1085: key='y'; break;
        case 1075: key='u'; break;
        case 1096: key='i'; break;
        case 1097: key='o'; break;
        case 1079: key='p'; break;
        case 1092: key='a'; break;
        case 1099: key='s'; break;
        case 1074: key='d'; break;
        case 1072: key='f'; break;
        case 1087: key='g'; break;
        case 1088: key='h'; break;
        case 1086: key='j'; break;
        case 1083: key='k'; break;
        case 1076: key='l'; break;
        case 1103: key='z'; break;
        case 1095: key='x'; break;
        case 1089: key='c'; break;
        case 1084: key='v'; break;
        case 1080: key='b'; break;
        case 1090: key='n'; break;
        case 1100: key='m'; break;
        default: return;
    }
    e.target.value = e.target.value+key;
}

function load(id, url) {
    var req = false,
        element = document.getElementById(id);
        
    if (window.XMLHttpRequest) { //For browsers
        try {
            req = new XMLHttpRequest();
        } catch (e) {
            req = false;
        }
    } else if (window.ActiveXObject) { // For IE
        try { 
            req = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) {
                req = false;
            }
        }
    }
    if (!element) {
        alert ("Bad id " + id);
        return;
    }
    
    if (req) {
        req.open('GET', url, false);
        req.send(null);
        element.innerHTML = req.responseText;
    } else {
        element.innerHTML = "NotLoaded";
    }
}


function insert(text) {
    var textarea = document.forms.postform.shampoo;
    if (textarea) {
        if (textarea.createTextRange && textarea.caretPos) { // IE
            var caretPos = textarea.caretPos;
            caretPos.text = caretPos.text.charAt(caretPos.text.length-1) == " " ? text+" " : text;
        } else if (textarea.setSelectionRange) { // Firefox
            var start = textarea.selectionStart,
                end = textarea.selectionEnd;
            textarea.value = textarea.value.substr(0,start)+text+textarea.value.substr(end);
            textarea.setSelectionRange(start+text.length, start+text.length);
        } else {
            textarea.value+=text+" ";
        }
        textarea.focus();
    }
}

function highlight(post) {
    var cells = document.getElementsByTagName("td"),
        reply = document.getElementById("reply"+post);
    for (var i=0;i<cells.length;i++) {
        if (cells[i].className == "highlight") {
            cells[i].className = "reply";
        }
    }
    
    if (reply) {
        reply.className = "highlight";
        //var match=/^([^#]*)/.exec(document.location.toString());
        //document.location=match[1]+"#"+post;
        return false;
    }

    return true;
}

function set_stylesheet_frame(styletitle, framename) {
    var list = get_frame_by_name(framename);
    set_stylesheet(styletitle);
    if (list) {
        set_stylesheet(styletitle, list);
    }
}

function set_stylesheet(styletitle, target) {
    salo.cookie("wakabastyle", styletitle, 365);
    var links = target ? target.document.getElementsByTagName("link") : document.getElementsByTagName("link"), rel, title,
        found = false;
    for (var i=0; i < links.length; i++) {
        rel = links[i].getAttribute("rel"),
        title = links[i].getAttribute("title");
        
        if (rel.indexOf("style") != -1 && title) {
            links[i].disabled=true; // IE needs this to work. IE needs to die.
            if (styletitle == title) { //PITUX, calm down and don't complain about ie.
                links[i].disabled=false; found=true;
            }
        }
    }
    
    if (!found) {
        set_preferred_stylesheet(target ? target : false)
    }
}

function set_preferred_stylesheet(target) {
    var links = target ? target.document.getElementsByTagName("link") : document.getElementsByTagName("link"), rel, title;
    for (var i=0; i < links.length; i++) {
        rel = links[i].getAttribute("rel"),
        title = links[i].getAttribute("title");
        if (rel.indexOf("style") != -1 && title) {
            links[i].disabled=(rel.indexOf("alt")!=-1);
        }
    }
}

function get_active_stylesheet() {
    var links = document.getElementsByTagName("link"), rel, title;
    for (var i=0; i < links.length; i++) {
        rel = links[i].getAttribute("rel"),
        title = links[i].getAttribute("title");
        if (rel.indexOf("style") != -1 && title && !links[i].disabled) {
            return title;
        }
    }
    return null;
}

function get_preferred_stylesheet() {
    var links=document.getElementsByTagName("link"), rel, title;
    for (var i=0; i < links.length; i++) {
        rel = links[i].getAttribute("rel");
        title = links[i].getAttribute("title");
        if (rel.indexOf("style") != -1 && rel.indexOf("alt") == -1 && title) {
            return title;
        }
    }
    return null;
}

function get_frame_by_name(name) {
    var frames = window.parent.frames;
    for (i = 0; i < frames.length; i++) {
        if (name == frames[i].name) { 
            return(frames[i]);
        }
    }
}

function set_inputs(id) {
    var form = document.getElementById(id),
        gb2 = form.gb2,
        gb2val = salo.cookie("gb2");

    if (gb2 && gb2val) {
        for (var i = 0; i < gb2.length; i++) {
            gb2[i].checked = (gb2[i].value == gb2val);
        }
    }
    
    function setVal(input, cookie) {
        if (!form[input].value) {
            form[input].value = salo.cookie(cookie) === undefined ? '' : salo.cookie(cookie);
        }
    }
    
    setVal("akane", "name");
    //setVal("nabiki", "email");
    setVal("password", "password");
}

function buttonOK() {
    var option = document.getElementById("opt"+select.selectedIndex),
        input = document.getElementById("dynamicNamed");      
    input.name = option.value;
}

function set_delpass(id) {
    try {
        document.getElementById(id).password.value = salo.cookie("password");
    } catch(e) {
        //console.log(e);
    }
}

function addcss(mycss) {
    var h = document.getElementsByTagName("head");
    var nSS = document.createElement("style"); 
    nSS.type = "text/css"; 
    h[0].appendChild(nSS); 
    try { 
        nSS.styleSheet.cssText=mycss;
    } catch(e) { 
        try {
            nSS.appendChild(document.createTextNode(mycss)); nSS.innerHTML=mycss; 
        } catch(e) {}
    }
}
addcss('blockquote {\nmax-height: 400px;\noverflow: auto;\n}');

function mommyinroom() {return false;}
function use_captcha_color() { return "000000" }
function check_captcha_color_change() {}
    
function $event(el, events) {
    for (var key in events) {
        el.addEventListener(key, events[key], false);
    }
}

function iframeLoad(e) {
    var frame = (e.srcElement || e.originalTarget).contentDocument;
    if(!frame.body || frame.location == 'about:blank' || !frame.body.innerHTML) return;
    var err = frame.getElementsByTagName('FONT')[0];
    if (!err) { err = frame.getElementsByTagName('P')[0]; }
    
    if(err && !frame.getElementById('postform')) {
        alert(!err ? 'Ошибка:\n' + frame.innerHTML : (err.firstChild || err).textContent);
        update_captcha_frame(); //refresh captcha frame
        frame.location.replace('about:blank');
        return;
    }
    
    //clear form fields
    try {
        $n('shampoo').value = '';
        $n('akane').value = '';
        $n('nabiki').value = '';
        $n('kasumi').value = '';
        $n('file').value = '';    
    } catch (e) { }
    
    //redirect
    window.location.href = frame.location;
    frame.location.replace('about:blank');
}

function doPost() {
        document.body.appendChild($new('div', {'html': '<iframe name="submitcheck" id="submitcheck" src="about:blank" style="visibility:hidden; width:0px; height:0px; border:none"></iframe>'}));
        $attr($id('postform'), {'target': 'submitcheck'});
        if (salo.browser.opera) {
            $event(window, {'DOMFrameContentLoaded': iframeLoad});
        } else {
            $event($id('submitcheck'), {'load': iframeLoad});
        }
}

if (typeof(jQuery) !== "undefined" && jQuery) {
    function rgbhex(rgbval) {
        var s = rgbval.match(/rgb\s*\x28((?:25[0-5])|(?:2[0-4]\d)|(?:[01]?\d?\d))\s*,\s*((?:25[0-5])|(?:2[0-4]\d)|(?:[01]?\d?\d))\s*,\s*((?:25[0-5])|(?:2[0-4]\d)|(?:[01]?\d?\d))\s*\x29/);
        var d = '', e;

        if (s) { s = s.splice(1); }
        if (s && s.length==3){
            d = '';
            for (i in s) {
                e = parseInt(s[i], 10).toString(16);
                e == "0" ? d += "00" : d += e;
            }
            return '#' + d;
        } else {
            return rgbval;
        }
    }

    function captcha_color(bg) {
        var rgb_bg = bg.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (!rgb_bg) { return "000000"; }
        var c = "";
        for (var i = 1; i < 4; i++) {
            c += (255 - parseInt(rgb_bg[i], 16)).toString(16);
        }
        return c;
    }

    function get_background_color(e) {
        var color = e.css("background-color");
        if (color !== 'rgba(0, 0, 0, 0)') {
            return color;
        } else if (e == null || e.is("body")) {
            return null;
        } else {
            return get_background_color(e.parent());
        }
    }

    use_captcha_color = function() {
        var bg = get_background_color($("#captcha"));
        if (bg !== null) {
            return captcha_color(rgbhex(bg));
        }
        return "000000";
    }

    var _last_captcha_color = "111110";
    check_captcha_color_change = function() {
        var c = use_captcha_color();
        if (c !== _last_captcha_color) {
            update_captcha2();
            _last_captcha_color = c;
        }
    }
}

function hideImages(button, images) {
    var button = button ? button : 'a[onclick^=mommy]',
        images = images ? images : 'img.img',
        imgs = $(images), 
        def = 0.08, //default opacity value
        //def_title = document.getElementById('title').innerHTML,
        cook = function() {return salo.cookie('mommy');};
        
    if (cook() === undefined) {
        salo.cookie('mommy', '');
    }
    
    try {
        imgs.mouseover(function(e) {if (cook()) this.style.opacity = '1'})
            .mouseout(function(e) {if (cook()) this.style.opacity = def;});      
    } catch(e) {/*console.log(e);*/}
    
    $(button).click(function(e) {
        e.preventDefault();
        imgs.each(function(e) {this.style.opacity = cook() ? '1' : def; });
        //document.getElementById('title').innerHTML = cook() ? def_title : 'Городской форум'; #lolwut?
        salo.cookie('mommy', cook() ? '' : '1');
    })
}

set_stylesheet(salo.cookie("wakabastyle"));


window.addEventListener('load', function() {
    var match;
    hideImages();
    try {
        document.getElementById("sua").checked = salo.cookie('sua');
    } catch(e) {}
    if (match=/#i([0-9]+)/.exec(document.location.toString())) {
        if (!document.forms.postform.shampoo.value) {
            insert(">>"+match[1]);
        }
    }
    
    if (match=/#([0-9]+)/.exec(document.location.toString())) {
        highlight(match[1]);
    }
}, false);  

function threadHide(id)
{
	toggleHidden(id);
	add_to_thread_cookie(id);
}
function threadShow(id)
{
	document.getElementById(id).style.display = "";
	
	var threadInfo = id + "_info";
	var parentform = document.getElementById("delform");
	var obsoleteinfo = document.getElementById(threadInfo);
	obsoleteinfo.setAttribute("id","");
	var clearedinfo = document.createElement("div");
	clearedinfo.style.cssFloat = "left";
	clearedinfo.style.styleFloat = "left"; 
	parentform.replaceChild(clearedinfo,obsoleteinfo);
	clearedinfo.setAttribute("id",threadInfo);
	
	var hideThreadSpan = document.createElement("span");
	var hideThreadLink = document.createElement("a");
	hideThreadLink.setAttribute("href","javascript:threadHide('"+id+"')");
	var hideThreadLinkText = document.createTextNode("Скрыть тред");
	hideThreadLink.appendChild(hideThreadLinkText);
	hideThreadSpan.appendChild(hideThreadLink);
	
	var oldSpan = document.getElementById(id+"_display");
	oldSpan.setAttribute("id","");
	parentform.replaceChild(hideThreadSpan,oldSpan);
	hideThreadLink.setAttribute("id","toggle"+id);
	hideThreadSpan.setAttribute("id",id+"_display");
	hideThreadSpan.style.cssFloat = "right";
	hideThreadSpan.style.styleFloat = "right";
	
	remove_from_thread_cookie(id);
}
function add_to_thread_cookie(id)
{
	var hiddenThreadArray = get_cookie(thread_cookie);
	if (hiddenThreadArray.indexOf(id + ",") != -1)
	{			
		return;
	}
	else
	{
		set_cookie(thread_cookie, hiddenThreadArray + id + ",", 365);
	}
}

function remove_from_thread_cookie(id)
{
	var hiddenThreadArray = get_cookie(thread_cookie);
	var myregexp = new RegExp(id + ",", 'g');
	hiddenThreadArray = hiddenThreadArray.replace(myregexp, "");
	set_cookie(thread_cookie, hiddenThreadArray, 365);
}

function toggleHidden(id)
{
	var id_split = id.split("");
	if (id_split[0] == "t")
	{
		id_split.reverse();
		var shortenedLength = id_split.length - 1;
		id_split.length = shortenedLength;
		id_split.reverse();
	}
	else
	{
		id = "t" + id;
	}
	if (document.getElementById(id))
	{
		document.getElementById(id).style.display = "none";
	}
	var thread_name = id_split.join("");
	var threadInfo = id + "_info";
	if (document.getElementById(threadInfo))
	{
		var hiddenNotice = document.createElement("em");
		var hiddenNoticeText = document.createTextNode("Тред № " + thread_name + " скрыт.");
		hiddenNotice.appendChild(hiddenNoticeText);
		
		var hiddenNoticeDivision = document.getElementById(threadInfo);
		hiddenNoticeDivision.appendChild(hiddenNotice);
	}
	var showThreadText = id + "_display";
	if (document.getElementById(showThreadText)) 
	{
		var showThreadSpan = document.createElement("span");
		var showThreadLink = document.createElement("a");
		showThreadLink.setAttribute("href","javascript:threadShow('"+id+"')");
		var showThreadLinkText = document.createTextNode("Показать тред");
		showThreadLink.appendChild(showThreadLinkText);
		showThreadSpan.appendChild(showThreadLink);
		
		var parentform = document.getElementById("delform");
		var oldSpan = document.getElementById(id+"_display");
		oldSpan.setAttribute("id","");
		parentform.replaceChild(showThreadSpan,oldSpan);
		showThreadLink.setAttribute("id","toggle"+id);
		showThreadSpan.setAttribute("id",id+"_display");
		showThreadSpan.style.cssFloat = "right";
		showThreadSpan.style.styleFloat = "right";
	}
}