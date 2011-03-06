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
            if "failed to load HTTP resource" in str(c):
                self.died = True
            return
        
        _pathcomp = source.split('/')
        self.outname = "_".join(["tirech", _pathcomp[3], _pathcomp[5]])
        self.threadnum = _pathcomp[5][:-5]

    def get_posts_number(self):
        _reflinks = self.source.xpath('//span[@class="reflink"]/a/text()')
        if _reflinks:
            return [link[1:] for link in _reflinks]
        else:
            return None

    def get_images(self, postNumber):
        _span = self.source.xpath('//span[@id="exlink_' + postNumber + '"]')
        if _span:
            _link = _span[0].xpath('a')
            if len(_link):
                _image = _link[0].attrib['href']
                
            _img = _link[0].xpath('img')
            if len(_img):
                _thumb = _img[0].attrib['src']
                
            return ["http://2-ch.ru" + _image, "http://2-ch.ru" + _thumb]
        else:
            return None

    def get_title(self):
        _title = self.source.xpath('//title/text()')[0]
        return [u'Тиреч', _title.replace(u"Два.ч — ", '')]

    def get_post(self, postNumber):
        result = {}
        _basetag = self.source.xpath('//a[@id="' + postNumber + '"]')
        if not len(_basetag):
            return None
        
        _basetag = _basetag[0]
        result['postnumber'] = postNumber
        _topic = _basetag.xpath('following-sibling::label/span[@class="replytitle"]/text()')
        if not len(_topic):
            _topic = _basetag.xpath('following-sibling::label/span[@class="filetitle"]/text()')
        if len (_topic):
            result['topic'] = _topic[0]
        else:
            result['topic'] = ''
        _postername = _basetag.xpath('following-sibling::label/span[@class="postername"]/text()')
        if len(_postername):
            result['postername'] = _postername[0]
        else: # not a text but html with e-mail, possibly SAGE
            result['postername'] = html.tostring(_basetag.xpath('following-sibling::label/span[@class="postername"]/*')[0], encoding = 'utf-8').decode('utf-8')
            
        _date = _basetag.xpath('following-sibling::label/span[@class="postername"]/following-sibling::text()')
        if len(_date):
            result['date'] = _date[0].strip()
        _text = _basetag.xpath('following-sibling::blockquote/*')
        if len(_text):
            # fix internal links
            intlinks = _text[0].xpath('//a[starts-with(@onclick,"highlight")]')
            if intlinks:
                for a in intlinks:
                    a.attrib['href'] = a.attrib['href'][a.attrib['href'].rfind('#'):]
                    
            result['text'] = _text[0]
        else:
            result['text'] = ''

        # now get pictures

        _links = self.get_images(postNumber)
        if _links:
            _size = _basetag.xpath('following-sibling::span[@class="filesize"]/em/text()')
            if not len(_size):
                _size = _basetag.xpath('preceding-sibling::span[@class="filesize"]/em/text()')
                
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
    return [['http://2-ch.ru', 'http://www.2-ch.ru'], Parser]
    
if __name__ == "__main__":
    parser = Parser("samples/2-ch.html")
    print parser.get_post("13294318")

