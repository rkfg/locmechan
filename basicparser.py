#!/usr/bin/env python
# -*- coding: utf-8 -*-

from lxml import html, etree
import urllib2
import httplib
import socket

class BasicParser(object):

    def __init__(self, source):
        try:
            socket.setdefaulttimeout(30)
            url = urllib2.urlopen(source) # this is to fix broken unicode on 
            page = url.read().decode('utf-8', 'ignore') # some ukrainian chans (oh SO SNOOLEY!)
            url.close()
            self.source = html.fromstring(page)
        except urllib2.HTTPError, e:
            raise e
        except httplib.BadStatusLine:
            print >> sys.stderr, "BadStatusLine!"
        except httplib.IncompleteRead:
            print >> sys.stderr, "IncompleteRead!"
        
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
#   return the title of board
#   mark post as deleted
#   add posts to the end of the thread
