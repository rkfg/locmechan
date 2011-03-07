#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
from lxml import html
import urllib2

class MalformedPostError(Exception):
    pass

class Output:
    
    def __init__(self, threadnumber, board=u'Бред', title=u'Бред', infile=''):
        self.threadnumber = threadnumber
        if infile:
            self.output = html.parse(infile)
        else:
            _templatefile = open("templates/photon.html", 'r')
            _template = _templatefile.read()
            _templatefile.close()
            _template = _template.decode('utf-8').replace("{{title}}", title).replace("{{board}}", board)
            self.output = html.fromstring(_template)

        #print _template
        self.content = self.output.xpath("//div[@id='content']")[0]
        _postFile = open("templates/post.html", 'r')
        self.post = _postFile.read().decode('utf-8')
        _postFile.close()
        _imgFile = open("templates/img.html", 'r')
        self.img = _imgFile.read().decode('utf-8')
        _imgFile.close()

    def add_post(self, post):
        if not 'postnumber' in post:
            raise MalformedPostError

        #print post

        self._post = ''

        def add_image():
            if 'image' in post:
                if 'full' in post['image'] and 'thumb' in post['image'] and 'size' in post['image']:
                    self._post += self.img % {'imagelink': 'images/' + self.threadnumber +
                                              '/' + post['image']['full'], 'imagename':
                                                  post['image']['full'], 'imagesize': post['image']['size'],
                                              'imagethumb': 'thumbs/' + self.threadnumber + '/' +
                                              post['image']['thumb']}
                else:
                    raise MalformedPostError

        def add_header(classtitle):
            if ('topic' in post and 'postername' in post and 'date' in post
                and 'postnumber' in post):
                self._post += self.post % {'topic': post['topic'], 'postername': post['postername'],
                                           'date': post['date'], 'postnumber': post['postnumber'],
                                           'class': classtitle}
            else:
                raise MalformedPostError
        
        if not len(self.content): # no posts yet, so add OP post with special formatting
            add_image()
            add_header('filetitle')
            if post['text'] != '':
                _text = html.tostring(post['text'], encoding = 'utf-8').decode('utf-8')
            else:
                _text = ''
            self._post += u'<blockquote>' + _text + u'</blockquote>'
        else: # replies
            add_header('replytitle')
            add_image()
            if post['text'] != '':
                _text = html.tostring(post['text'], encoding = 'utf-8').decode('utf-8')
            else:
                _text = ''
            self._post += u'<blockquote>' + _text + u'</blockquote>'
            self._post = ('<table><tbody><tr><td class="reply" id="reply' + post['postnumber'] +
                          '">' + self._post + '</td></tr></tbody></table>')

        self.content.insert(len(self.content), html.fromstring(self._post))

    def mark_deleted(self, postNumber):
        _id = self.output.xpath('.//a[@id="' + postNumber + '"]/following-sibling::blockquote')
        if len(_id):
            if len(_id[0].xpath('p[@style="color: #ff0000; font-style: italic;"]')):
                return
            _id[0].insert(len(_id[0]), html.fromstring(u'<p style="color: #ff0000; font-style: italic;">Пост был удалён.</p>'))

    def download_images(self, image, thumb):
        imagepath = os.path.join("threads/images", self.threadnumber)
        thumbpath = os.path.join("threads/thumbs", self.threadnumber)
        if not os.path.isdir(imagepath):
            os.makedirs(imagepath)
        if not os.path.isdir(thumbpath):
            os.makedirs(thumbpath)

        try:
            link = urllib2.urlopen(image)
            imgfile = open(os.path.join(imagepath, os.path.basename(image)), 'w')
            imgfile.write(link.read())
            link.close()
            imgfile.close()

            link = urllib2.urlopen(thumb)
            thumbfile = open(os.path.join(thumbpath, os.path.basename(thumb)), 'w')
            thumbfile.write(link.read())
            link.close()
            thumbfile.close()
        except urllib2.HTTPError:
            print >> sys.stderr, "Not found!"

    def get_posts_number(self):
        _reflinks = self.output.xpath('//span[@class="reflink"]/a/text()')
        if _reflinks:
            return [link[1:] for link in _reflinks]
        else:
            return None

    def save(self, filename):
        if not os.path.isdir("threads"):
            os.mkdir("threads")
            
        result = open(os.path.join("threads", filename), 'w')
        result.write(html.tostring(self.output, encoding='utf-8', include_meta_content_type = True))
        result.close()
    
if __name__ == "__main__":
#    out = Output("100500", "Бред", "Хуита", infile = "threads/result.html")
    out = Output("100500", "Бред", "Хуита")
    out.add_post({'topic': "ОП — хуй!", 'postername': "Охуенный", 'date': "Прям сёдня", 'postnumber': "100500", 'text': "Хочу признаться, что ОП таки хуй тот ещё!", 'image' : {'full': '1299408017421.jpg', 'thumb': '1299408017421s.jpg', 'size': "36Кб, 489x480" }})
    out.add_post({'topic': "ОП — малаца!", 'postername': "Хуёвый", 'date': "Прям сёдня и ещё чутка", 'postnumber': "100501", 'text': "Слыш ты бля за базар ответиш"})
    out.add_post({'topic': "ОП — хуй!", 'postername': "Охуенный", 'date': "Прям сёдня", 'postnumber': "100502", 'text': "Хочу признаться, что ОП таки хуй тот ещё!", 'image' : {'full': '1299408017421.jpg', 'thumb': '1299408017421s.jpg', 'size': "36Кб, 489x480" }})
    result = open('threads/result.html', 'w')
    result.write(html.tostring(out.output, encoding='utf-8', include_meta_content_type = True))
    result.close()
