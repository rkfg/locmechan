#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from basicparser import BasicParser
from lxml import html
import urllib2

class Parser(BasicParser):

    def __init__(self, source):
        self.died = False
        try:
            super(Parser, self).__init__(source)
        except urllib2.HTTPError, c:
            if c.code == 404:
                self.died = True

        if not self.died:
            err404 = self.source.xpath('//div[@class="wellcome"]/text()') # blame you, macaque!

            if len(err404) and u"404 - Ничего не найдено." in err404[0]:
                self.died = True
            
        _pathcomp = source.split('/')
        # name of file for saving thread
        source = source.replace("http://", "").replace("www", "")
        self.boardmap = {u"2-ch.ru": [u"tirech", u"Тиреч"], u"2ch.so": [u"pirach", u"Пирач"], u"iichan.ru": [u"iichan", u"Ычан"], u"uchan.org.ua": [u"uchan", u"Учан"], u"2--ch.ru": [u"longtirech", u"Длиннотиреч"]}
        
        self.domain = source[:source.find('/')]
        if _pathcomp[4] == "arch":
            tindex = 6
        else:
            tindex = 5
        self.outname = "_".join([self.boardmap[self.domain][0], _pathcomp[3], _pathcomp[tindex]])
        # the same name without .html (for images/thumbs dirs)
        self.threadnum = _pathcomp[tindex][:-5]

    def get_posts_number(self):
        _reflinks = self.source.xpath('//span[@class="reflink"]/a/text()')
        if _reflinks:
            return [link.replace(u"№", "").replace("No.", "") for link in _reflinks]
        else:
            return None

    def get_images(self, postNumber):
        _span = self.source.xpath('//span[re:match(@id, ".*_' + postNumber + '$")]', namespaces={"re": "http://exslt.org/regular-expressions"})
        if not len(_span):
            _span = self.source.xpath('//a[@name="' + postNumber + '"]/../a[@target]/..')
            
        if _span:
            _link = _span[0].xpath('a[@href]')
            if len(_link):
                _image = _link[0].attrib['href']
                
            _img = _link[0].xpath('img')
            if len(_img):
                _thumb = _img[0].attrib['src']
                
            return ["http://" + self.domain + "/" + _image, "http://" + self.domain + "/" + _thumb]
        else:
            return None

    def get_title(self):
        _title = self.source.xpath('//title/text()')[0]
        dashpos = _title.find(u" — ")
        if dashpos < 0: # uchan
            return [self.boardmap[self.domain][1], _title[_title.rfind("/") + 4:_title.rfind(" - ")]]
        else:
            return [self.boardmap[self.domain][1], _title[dashpos + 3:]]

    def get_post(self, postNumber):
        result = {}
        _basetag = self.source.xpath('//a[@id="' + postNumber + '"]')
        if not len(_basetag):
            _basetag = self.source.xpath('//a[@name="' + postNumber + '"]')
            if not len(_basetag):
                _basetag = self.source.xpath('//td[@id="' + postNumber + '"]')
                if not len(_basetag):
                    return None
         
        _basetag = _basetag[0]
        result['postnumber'] = postNumber
        # title of reply
        _topic = _basetag.xpath('following-sibling::label/span[re:match(@class, "(reply|file)title")]/text()', namespaces={"re": "http://exslt.org/regular-expressions"})
        if len (_topic):
            result['topic'] = _topic[0]
        else:
            result['topic'] = ''
        _postername = _basetag.xpath('following-sibling::label/span[@class=re:match(@class, ".*postername$")]/text()', namespaces={"re": "http://exslt.org/regular-expressions"})
        if not len(_postername):
            # not a text but html with e-mail, possibly SAGE
             _span = _basetag.xpath('following-sibling::label/span[@class=re:match(@class, ".*postername$")]/*', namespaces={"re": "http://exslt.org/regular-expressions"})
             if len(_span):
                 _postername = [html.tostring(_span[0], encoding = 'utf-8').decode('utf-8')]
             else:
                 _postername = [u"Аноним"]
                 
        result['postername'] = _postername[0]
        if len(_basetag.xpath('following-sibling::label/span[re:match(@class, ".*postertrip$")]', namespaces={"re": "http://exslt.org/regular-expressions"})):
            _date = _basetag.xpath('following-sibling::label/span[re:match(@class, ".*postertrip$")]/following-sibling::text()', namespaces={"re": "http://exslt.org/regular-expressions"})
        elif len(_basetag.xpath('following-sibling::label/span[re:match(@class, ".*postername$")]', namespaces={"re": "http://exslt.org/regular-expressions"})):
            _date = _basetag.xpath('following-sibling::label/span[re:match(@class, ".*postername$")]/following-sibling::text()', namespaces={"re": "http://exslt.org/regular-expressions"})
        elif len(_basetag.xpath('child::label/span[re:match(@class, ".*postername$")]', namespaces={"re": "http://exslt.org/regular-expressions"})):
            _date = _basetag.xpath('child::label/span[re:match(@class, ".*postername$")]/following-sibling::text()', namespaces={"re": "http://exslt.org/regular-expressions"})
        else:
            _date = _basetag.xpath('following-sibling::label/span[re:match(@class, ".*replytitle$")]/following-sibling::text()', namespaces={"re": "http://exslt.org/regular-expressions"})
        result['date'] = _date[0].strip()
            
        _text = _basetag.xpath('following-sibling::blockquote/*')
        if not len(_text):
            _text = _basetag.xpath('child::blockquote/*')
        if len(_text):
            textsum = ''
            for e in _text:
                textsum += html.tostring(e, encoding = 'utf-8').decode('utf-8')
            _text = html.fromstring(textsum)
            # fix internal links
            intlinks = _text.xpath('//a[starts-with(@onclick,"highlight")]')
            if intlinks:
                for a in intlinks:
                    a.attrib['href'] = a.attrib['href'][a.attrib['href'].rfind('#'):]
                    
            result['text'] = _text
        else:
            result['text'] = ''

        # look for embedded videos
        _embed = _basetag.xpath('../div/object/embed[@src]')
        if _embed:
            _embed = _embed[0]
            # add it to the beginning of the post
            if result['text'] == '':
                result['text'] = html.fromstring('<p></p>')
            _link = _embed.xpath('../..')[0]
            _link.tail = result['text'].text
            result['text'].insert(0, _link)
            result['text'].text = None
            
        # now get pictures

        _links = self.get_images(postNumber)
        if _links:
            _size = _basetag.xpath('following-sibling::span[@class="filesize"]/em/text()')
            if not len(_size):
                _size = _basetag.xpath('preceding-sibling::span[@class="filesize"]/em/text()')
                if not len(_size):
                    _size = _basetag.xpath('preceding-sibling::span[@class="filesize"]/span[@class="filesize"]/em/text()')
                    if not len(_size):
                        _size = _basetag.xpath('child::span[@class="filesize"]//em/text()')

            result['image'] = {}
            result['image']['full'] = os.path.basename(_links[0])
            result['image']['thumb'] = os.path.basename(_links[1])
            result['image']['size'] = _size[0]

        return result

# chanparser should be able to:
#   return numbers of all posts
#   return link(s) to the image(s) and thumbnail(s)
#   correct post content to match the new image place
#   return the title of thread (topic or first line, whatever else)
#   add posts from soup object to the end of the thread

def info():
    # here we return list of links prefix and parser class
    return [['http://2-ch.ru', 'http://www.2-ch.ru', 'http://2ch.so', 'http://www.2ch.so', 'http://2--ch.ru', 'http://www.2--ch.ru', 'http://iichan.ru', 'http://www.iichan.ru', 'http://uchan.org.ua'], Parser]

# sorta unit test, lol
if __name__ == "__main__":
    parser = Parser("samples/2-ch.html")
    print parser.get_post("13294318")

