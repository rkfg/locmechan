#!/usr/bin/env python
# -*- coding: utf-8 -*-

from lxml import html, etree
import urllib2
import httplib
import socket
import time
import sys

class ThreadIsntAccessible(Exception):
    pass

class BasicParser(object):

    def __init__(self, source):
        socket.setdefaulttimeout(30)
        retry = 5
        while retry:
            try:
                url = urllib2.urlopen(source) # this is to fix broken unicode on 
                page = url.read().decode('utf-8', 'ignore') # some ukrainian chans (oh SO SNOOLEY!)
                url.close()
                self.source = html.fromstring(page)
                retry = 0
                return
            except urllib2.HTTPError, e:
                if e.code == 404:
                    raise e
                else:
                    print >> sys.stderr, "Error occured:", e.code
                    time.sleep(3)
                    retry -= 1
            except:
                print >> sys.stderr, "Error occured."
                time.sleep(3)
                retry -= 1

        # well, thread just can't be retrieved so raise an exception to the grabber
        raise ThreadIsntAccessible

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
