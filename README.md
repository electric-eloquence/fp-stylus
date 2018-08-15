# Stylus extension for Fepper

### Install

Add these tasks to `excludes/extend/custom.js`:

* Under gulp task 'custom:frontend-copy'
  * 'stylus:frontend-copy'
* Under gulp task 'custom:once'
  * 'stylus:once'
* Under gulp task 'custom:watch'
  * 'stylus:watch'

There is also a 'stylus:no-comment' task, which will output CSS without line 
comments. You probably want this to process CSS destined for production.

In a full ([main](https://github.com/electric-eloquence/fepper)) Fepper 
installation, there should already be a `source/_styles/src/stylus` directory. 
Create one if there isn't and put all Stylus code there.
