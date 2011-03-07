#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
from output import Output
import imp

parsers = []

def select_parser(url):
    global parsers
    for parser in parsers:
        for parseurl in parser[0]:
            if url.startswith(parseurl):
                return parser[1](url)
    

# load threads list from threads.txt

if len(sys.argv) < 3:
    print >> sys.stderr, "Insufficient args."
    sys.exit(1)

def get():
    if os.path.isfile('lock.pid'):
        pidfile = open('lock.pid', 'r')
        pid = pidfile.read()
        pidfile.close()
        try:
            os.kill(int(pid), 0)
        except OSError:
            pass
        else:
            print >> sys.stderr, "Already running instance"
            sys.exit(2)

    pidfile = open('lock.pid', 'w')
    pidfile.write(str(os.getpid()))
    pidfile.close()
    
    for modfile in os.listdir('parsers'):
        if modfile.endswith('.py'):
            try:
                name = "parsers/" + modfile[:-3]
                parsefile, pathname, description = imp.find_module(name)
            except:
                print >> sys.stderr, 'MODULE: %s not found' % modfile[:-3]
                sys.exit(1)

            try:
                method = imp.load_module(name, parsefile, pathname, description).info
            except:
                print >> sys.stderr, 'MODULE: can\'t load %s' % modfile[:-3]

            else:
                parsers.append(method())

    try:
        _threadsfile = open(sys.argv[2], 'r')
        _threads = _threadsfile.read().split()
        _threadsfile.close()
        _threads = filter(lambda x: x != '', _threads)
    except IOError:
        print >> sys.stderr, "Error opening threads file " + sys.argv[1]
        sys.exit(1)

    # for every thread

    purgedthreads = []
    for url in _threads:

    #{{{
    # download thread page
    # make lxml from the data 
        _activeparser = select_parser(url)
        if _activeparser:
            print >> sys.stderr, "Checking " + url
            if not _activeparser.died:
                purgedthreads.append(url)
                _toDownload = _activeparser.get_posts_number()
            # if this thread was already downloaded:
                output_writer = None
                _threadfile = os.path.join("threads", _activeparser.outname)
                if os.path.isfile(_threadfile):
            #{{{
                    #    make lxml from it
                    #    get posts number in it
                    output_writer = Output(_activeparser.outname[:-5], infile = _threadfile)
                    out_nums = set(output_writer.get_posts_number())
                    in_nums = set(_activeparser.get_posts_number())
                    deleted = list(out_nums - in_nums)
                    #    leave only new posts in _toDownload
                    _toDownload = list(in_nums - out_nums)
                    #    mark deleted posts in _deleted
                    for post in deleted:
                        # set deleted marks
                        output_writer.mark_deleted(post)

            #}}}
                else:
                    title = _activeparser.get_title()
                    output_writer = Output(_activeparser.outname[:-5], title = title[0], board = title[1])

                _toDownload.sort(cmp = lambda x,y: int(x) - int(y))
                postcnt = len(_toDownload) - 1
                for post in _toDownload:
            #{{{
                    print >> sys.stderr, "Adding post #" + post + " (" + str(postcnt) + " left)"
                    #    get the post from thread
                    newpost = _activeparser.get_post(post)
                    #    add this post to the end
                    output_writer.add_post(newpost)
                    #    get images and thumbnails links
                    post_image = _activeparser.get_images(post)
                    if post_image:
                        #    download images and thumbs
                        print >> sys.stderr, "Downloading image for post..."
                        output_writer.download_images(*post_image)
                    postcnt -= 1

            #}}}

            # save the thread
                output_writer.save(_activeparser.outname)
            else:
                print >> sys.stderr, "Thread died: " + url
        else:
            print >> sys.stderr, "Unsupported url: " + url

    threadfile = open(sys.argv[2], 'w')
    threadfile.write('\n'.join(purgedthreads))
    threadfile.close()
    os.unlink('lock.pid')

    #}}}

commands = {'get': get}

if sys.argv[1] in commands:
    commands[sys.argv[1]]()
    
