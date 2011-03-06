#!/usr/bin/env python
# -*- coding: utf-8 -*-

from BeautifulSoup import BeautifulSoup, Tag, NavigableString
from lxml import html

class BasicParser(object):

    def __init__(self, source):
        self.source = html.parse(source)

    def get_posts_number(self):
        pass

    def get_images(self, postNumber):
        pass

    def make_local_urls(self, postNumber):
        pass

    def get_title(self): # returns title and boardname
        pass

    def get_post(self, postNumber): # returns dict for Output class
        pass
    
# chanparser should be able to:
#   return numbers of all posts
#   return link(s) to the image(s) and thumbnail(s)
#   correct post content to match the new image place
#   return the title of thread (topic or first line, whatever else)
#   mark post as deleted
#   add posts from soup object to the end of the thread
