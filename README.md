# Stylus extension for Fepper

### Install
Add these tasks to `excludes/extend/custom.js`:

* Under gulp task 'custom:frontend-copy'
  * 'stylus:frontend-copy'
* Under gulp task 'custom:once'
  * 'stylus'
* Under gulp task 'custom:watch'
  * 'stylus:watch'

There is also a 'stylus:no-comments' task, which will output CSS without line 
comments. You probably want this to process CSS destined for production.
