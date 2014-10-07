#!/usr/local/bin/lsc -cj
name: \ptt-bot
version: \0.0.1
repository:
  type: \git
  url: \https://github.com/mbilab/ptt-bot
scripts:
  test: 'node mybot.js'
dependencies:
  string: '^2.1.0'
  'iconv-lite': '^0.4.4'
