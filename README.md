# What's this? #

This is metachan clone for your sweet **localhost**. You can grab threads and save them with pictures and thumbnails, archive them for export and unpack for import. Also you can bind aliases to threads for easier lookup.

# How to deal with this #

Add threads you want to track to some text file separating them with newline. Then just run `./grab.py get /path/to/that/text/file.txt` from the locmechan directory. Threads should start adding to the repository which you can browse at threads/ directory. Set up the cron job to check out every 5 or 10 minutes and you'll never miss a post!*

* if locmechan wouldn't stuck in an infinite loop or crash or do `rm -rf /usr` suddenly — who knows. Just kidding.

# Need moar info #

Run `./grab.py help` and see what happens.

# License #

See COPYING. This piece of code is distributed under terms of GNU GPLv3.
