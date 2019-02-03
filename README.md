# Stylus extension for Fepper

[![Known Vulnerabilities][snyk-image]][snyk-url]
[![Mac/Linux Build Status][travis-image]][travis-url]
[![Windows Build Status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![License][license-image]][license-url]

### Install

```shell
cd extend
npm install --save-dev fp-stylus
```

### Use

Add these tasks to `extend/custom.js`:

* Under gulp task `'custom:frontend-copy'`
  * `'stylus:frontend-copy'`
* Under gulp task `'custom:once'`
  * `'stylus:once'`
* Under gulp task `'custom:watch'`
  * `'stylus:watch'`

On the command line:

```shell
fp stylus[:subtask]
```

The ([main](https://github.com/electric-eloquence/fepper)) Fepper distribution 
ships with a `source/_styles/src/stylus` directory by default. Create one if 
there isn't one, and put all Stylus code there.

Stylus will build CSS into the `paths.source.cssBld` directory as declared in 
`patternlab-config.json`.

### Tasks

#### `'stylus'`
* Same as `'stylus:once'`.
* Builds Stylus into CSS with line comments.
* Overwrites CSS whether or not it has direct edits.

#### `'stylus:diff-then-comment'`
* Usually under gulp task `'custom:once'`.
* Checks if the Stylus code was modified before overwriting CSS.
* Allows direct edits to CSS without triggering Stylus builds.
* Allows the choice of using Stylus exclusively or not using Stylus exclusively.

#### `'stylus:no-comment'`
* Same as `'stylus'` and `'stylus:once'` but without line comments.

#### `'stylus:frontend-copy'`
* Usually under gulp task `'custom:frontend-copy'`.
* Copies CSS code to the backend.
* Does not modify the CSS source.
* Does not copy line comments to the backend destination.

#### `'stylus:write-tmp'`
* Writes the tmp file for comparing the current Stylus build with the previous 
  one.

#### `'stylus:watch'`
* Watches the `source/_styles/src/stylus` directory for a file modification.
* Triggers a Stylus build and overwrites CSS whether or not it has direct edits.
* Puts line comments in the CSS.

#### `'stylus:watch-no-comment'`
* Watches the `source/_styles/src/stylus` directory for a file modification.
* Triggers a Stylus build and overwrites CSS whether or not it has direct edits.
* Does not put line comments in the CSS.

#### `'stylus:watch-write-tmp'`
* Usually under gulp task `'custom:watch'`.
* Watches the `source/_styles/src/stylus` directory for a file modification.
* Writes the tmp file for comparing the current Stylus build with the previous 
  one.
* Puts line comments in the CSS.
* Overwrites CSS whether or not it has direct edits.

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
