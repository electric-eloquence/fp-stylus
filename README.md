# Stylus extension for Fepper

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Mac/Linux Build Status][travis-image]][travis-url]
[![Windows Build Status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

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

Running any of these tasks will write the compiled CSS to the 
`paths.source.cssBld` directory as defined in `patternlab-config.json`.

[snyk-image]: https://snyk.io/test/github/electric-eloquence/fp-stylus/master/badge.svg
[snyk-url]: https://snyk.io/test/github/electric-eloquence/fp-stylus/master

[travis-image]: https://img.shields.io/travis/electric-eloquence/fp-stylus.svg?label=mac%20%26%20linux
[travis-url]: https://travis-ci.org/electric-eloquence/fp-stylus

[appveyor-image]: https://img.shields.io/appveyor/ci/e2tha-e/fp-stylus.svg?label=windows
[appveyor-url]: https://ci.appveyor.com/project/e2tha-e/fp-stylus

[coveralls-image]: https://img.shields.io/coveralls/electric-eloquence/fp-stylus/master.svg
[coveralls-url]: https://coveralls.io/r/electric-eloquence/fp-stylus

[license-image]: https://img.shields.io/github/license/electric-eloquence/fp-stylus.svg
[license-url]: https://raw.githubusercontent.com/electric-eloquence/fp-stylus/master/LICENSE
