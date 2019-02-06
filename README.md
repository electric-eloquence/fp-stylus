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

This extension defaults toward the printing of line comments for debugging 
purposes. Doing so provides an unambiguous indication that the CSS was 
preprocessed and that direct edits to the CSS should be avoided. If a project 
decision is made to style with Stylus, it would be a good idea to have version 
control ignore CSS builds in the `source` directory. This would avoid committing 
line comments, which could otherwise lead to a morass of conflicts.

Another debugging alternative is writing CSS sourcemaps. (However, this will not 
work if line comments are enabled.) Add the following to 
your `pref.yml` file:

```yaml
stylus:
  linenos: false
  sourcemap: true
```

The `stylus.sourcemap` setting in `pref.yml` will accept any of the 
<a href="http://stylus-lang.com/docs/sourcemaps.html" target="_blank">
documented Stylus sourcemap options</a>. Just set `stylus.sourcemap` as an 
object and configure its properties as desired. Similarly, the `stylus` 
setting will accept any documented Stylus option and submit it to Stylus.

### Tasks

#### `'stylus'`
* Builds Stylus into CSS.
* Overwrites CSS whether or not it has direct edits.
* Respects the `stylus.linenos` setting in `pref.yml`.
* If `stylus.linenos` is not set, will default to printing line comments.

#### `'stylus:diff-then-comment'`
* Usually under gulp task `'custom:once'`.
* Checks if the Stylus code was modified before overwriting CSS.
* Allows direct edits to CSS without triggering Stylus builds.
* Allows the choice of using Stylus exclusively or not using Stylus exclusively.
* Respects the `stylus.linenos` setting in `pref.yml`.
* If `stylus.linenos` is not set, will default to printing line comments.

#### `'stylus:frontend-copy'`
* Usually under gulp task `'custom:frontend-copy'`.
* Checks if the CSS has line comments or not.
* If it does, it builds Stylus without line comments and copies the CSS to the backend.
* If it does not, it just copies the CSS to the backend.

#### `'stylus:no-comment'`
* Same as `'stylus'` and `'stylus:once'` but without line comments.
* Ignores any `stylus.linenos` setting in `pref.yml`.

#### `'stylus:once'`
* Usually under gulp task `'custom:once'`.
* Same as `'stylus'`.

#### `'stylus:watch'`
* Usually under gulp task `'custom:watch'`.
* Watches the `source/_styles/src/stylus` directory for a file modification.
* Triggers a Stylus build and overwrites CSS whether or not it has direct edits.
* Prints line comments in the CSS.

#### `'stylus:watch-no-comment'`
* Usually under gulp task `'custom:watch'`.
* Watches the `source/_styles/src/stylus` directory for a file modification.
* Triggers a Stylus build and overwrites CSS whether or not it has direct edits.
* Does not print line comments in the CSS.
* Ignores any `stylus.linenos` setting in `pref.yml`.

#### `'stylus:watch-write-tmp'`
* Usually under gulp task `'custom:watch'`.
* Usually under gulp task `'custom:watch'`.
* Watches the `source/_styles/src/stylus` directory for a file modification.
* Writes the tmp file for comparing the current Stylus build with the previous 
  one.
* Overwrites CSS whether or not it has direct edits.

#### `'stylus:write-tmp'`
* Writes the tmp file for comparing the current Stylus build with the previous 
  one.

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
