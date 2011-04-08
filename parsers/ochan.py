#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from basicparser import BasicParser
from lxml import html

class Parser(BasicParser):

    def __init__(self, source):
        self.died = False
        try:
            super(Parser, self).__init__(source)
        except IOError, c:
            if c.code == 404:
                self.died = True
        
        _pathcomp = source.split('/')
        # name of file for saving thread
        self.outname = "_".join(["0chan", _pathcomp[3], _pathcomp[5]])
        # the same name without .html (for images/thumbs dirs)
        self.threadnum = _pathcomp[5][:-5]

    def get_posts_number(self):
        _reflinks = self.source.xpath('//span[@class="reflink"]/a[2]/text()')
        if _reflinks:
            return [x.strip() for x in _reflinks]
        else:
            return None

    def get_images(self, postNumber):
        _span = self.source.xpath('//span[@id="thumb' + postNumber + '"]')
        if _span:
            _img = _span[0].xpath('img')
            if len(_img):
                _thumb = _img[0].attrib['src']

            _link = _span[0].xpath('..')
            if len(_link):
                _image = _link[0].attrib['href']

            return [_image, _thumb]
        else:
            return None

    def get_title(self):
        _title = self.source.xpath('//title/text()')[0]
        return [u'Нульчан', _title[_title.find(' - ') + 3:]]

    def get_post(self, postNumber):
        result = {}
        _basetag = self.source.xpath('//a[@name="' + postNumber + '"]')
        if not len(_basetag):
            return None
        
        _basetag = _basetag[0]
        result['postnumber'] = postNumber
        # title of reply
        _topic = _basetag.xpath('following-sibling::label/span[@class="replytitle"]/text()')
        if not len(_topic):
            # maybe it's OP post?
            _topic = _basetag.xpath('following-sibling::label/span[@class="filetitle"]/text()')
        if len (_topic):
            result['topic'] = _topic[0].strip()
        else:
            result['topic'] = ''
        _postername = _basetag.xpath('following-sibling::label/span[@class="postername"]/text()')
        if len(_postername):
            result['postername'] = _postername[0]
        else: # not a text but html with e-mail, possibly SAGE
            _postername = _basetag.xpath('following-sibling::label/span[@class="postername"]/*')
            if len(_postername):
                result['postername'] = html.tostring(_postername[0], encoding = 'utf-8').decode('utf-8')
            else:
                result['postername'] = u"Аноним"
            
        _date = _basetag.xpath('following-sibling::label/span[@class="postername"]/following-sibling::text()')
        if len(_date):
            result['date'] = _date[0].strip()
        _text = _basetag.xpath('following-sibling::blockquote/*')
        if len(_text):
            # fix internal links
            intlinks = _text[0].xpath('//a[starts-with(@onclick,"javascript:highlight")]')
            if intlinks:
                for a in intlinks:
                    a.attrib['href'] = a.attrib['href'][a.attrib['href'].rfind('#'):]

            spoilers = _text[0].xpath('//span[@class="spoiler"]')
            if spoilers:
                for s in spoilers:
                    s.attrib.clear()
                    s.attrib['class'] = "spoiler"
            
            result['text'] = _text[0]
        else:
            result['text'] = ''

        # now get pictures

        _links = self.get_images(postNumber)
        if _links:
            _size = _basetag.xpath('following-sibling::span[@class="filesize"]/a[@onclick]/following-sibling::text()')
            if not len(_size):
                _size = _basetag.xpath('preceding-sibling::span[@class="filesize"]/a[@onclick]/following-sibling::text()')

            result['image'] = {}
            result['image']['full'] = os.path.basename(_links[0])
            result['image']['thumb'] = os.path.basename(_links[1])
            result['image']['size'] = _size[0][3:]
            
        return result

# chanparser should be able to:
#   return numbers of all posts
#   return link(s) to the image(s) and thumbnail(s)
#   correct post content to match the new image place
#   return the title of thread (topic or first line, whatever else)
#   add posts from soup object to the end of the thread

def info():
    # here we return list of links prefix and parser class
    return [['http://0chan.ru', 'http://www.0chan.ru'], Parser]

# sorta unit test, lol
if __name__ == "__main__":
    parser = Parser("http://www.0chan.ru/ne/res/3142.html")
    print parser.get_post("3143")
