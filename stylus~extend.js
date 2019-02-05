'use strict';

const path = require('path');
const {Transform} = require('stream');

const fs = require('fs-extra');
const gulp = require('gulp');
const gulpStylus = require('gulp-stylus');
const sourcemaps = require('gulp-sourcemaps');
const stylus = require('stylus');
const utils = require('fepper-utils');

const conf = global.conf;
const pref = global.pref;

const cssBldDir = conf.ui.paths.source.cssBld;
const cssSrcDir = conf.ui.paths.source.cssSrc;

function streamUntouched() {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(file, enc, cb) {
      this.push(file);
      cb();
    }
  });
}

// Some setup according to prefs.

let prefsStylus = {};

if (pref.stylus && pref.stylus instanceof Object) {
  prefsStylus = pref.stylus;
}

// Opt for line comments by default.
if (prefsStylus.linenos !== false) {
  prefsStylus.linenos = true;
}

// If not writing sourcemaps, just have sourcemaps.init() and sourcemaps.write() pipe the stream through untouched.
if (!prefsStylus.sourcemap) {
  sourcemaps.init = () => {
    return streamUntouched();
  };
  sourcemaps.write = () => {
    return streamUntouched();
  };
}

let sourcemapDest;
let sourceRoot;

if (prefsStylus.sourcemap) {
  if (!prefsStylus.sourcemap.inline) {
    sourcemapDest = '.';
  }

  if (prefsStylus.sourcemap && prefsStylus.sourcemap.sourceRoot) {
    sourceRoot = prefsStylus.sourcemap.sourceRoot;
  }
  else {
    const uiSourceDir = conf.ui.paths.source.root;

    if (cssSrcDir.indexOf(uiSourceDir) === 0) {
      sourceRoot = cssSrcDir.slice(uiSourceDir.length);
      sourceRoot += '/stylus';
    }
  }
}

function testForComments() {
  const cssFilesBld = fs.readdirSync(cssBldDir);
  let hasComments = false;
  let i = cssFilesBld.length;

  while (i--) {
    const cssFileBld = `${cssBldDir}/${cssFilesBld[i]}`;
    const stat = fs.statSync(cssFileBld);

    /* istanbul ignore if */
    if (!stat.isFile()) {
      continue;
    }

    const cssOld = fs.readFileSync(cssFileBld, conf.enc);

    hasComments = /^\/\* line \d+ : /m.test(cssOld) && /\.styl \*\/$/m.test(cssOld);

    if (hasComments) {
      break;
    }
  }

  return hasComments;
}

function diffThenRender(cb) {
  const hasComments = testForComments();

  if (hasComments) {
    gulp.runSequence(
      'stylus:write-tmp',
      'stylus',
      cb
    );

    return;
  }

  const stylDir = `${cssSrcDir}/stylus`;
  const stylFiles = fs.readdirSync(stylDir);
  let i = stylFiles.length;

  while (i--) {
    const stylFile = `${stylDir}/${stylFiles[i]}`;
    const stylFileObj = path.parse(stylFile);

    if (stylFileObj.ext !== '.styl') {
      if (i === 0) {
        cb();
      }

      continue;
    }

    const stat = fs.statSync(stylFile);

    /* istanbul ignore if */
    if (!stat.isFile()) {
      if (i === 0) {
        cb();
      }

      continue;
    }

    const stylFileStr = fs.readFileSync(stylFile, conf.enc);

    stylus(stylFileStr)
      .set('filename', stylFile)
      .set('linenos', false)
      .render(
        ((iteration) => {
          return (err, cssNew) => {
            if (err) {
              /* istanbul ignore next */
              utils.error(err);
            }
            else {
              // Declare tmp file for comparison.
              const cssFileTmp = `${cssSrcDir}/.tmp/${stylFileObj.name}.css`;
              let cssFileTmpStr = '';

              if (fs.existsSync(cssFileTmp)) {
                cssFileTmpStr = fs.readFileSync(cssFileTmp, conf.enc);
              }
              else {
                // cssFileTmp probably doesn't exist on first run. Output for future comparison.
                fs.outputFileSync(cssFileTmp, cssNew);
                // Exit this iteration in next block.
                cssFileTmpStr = cssNew;
              }

              // Compare newly rendered css with the contents of the tmp file.
              // Exit if there has been no change. This is the case for users who only edit bld css and do not modify
              // Stylus files.
              if (cssFileTmpStr === cssNew) {
                /* istanbul ignore if */
                if (iteration === 0) {
                  cb();
                }

                return;
              }

              // Output tmp file for future comparison.
              fs.outputFileSync(cssFileTmp, cssNew);

              // Now, compare tmp css against bld css.
              const cssFileBld = `${cssBldDir}/${stylFileObj.name}.css`;
              const prefsStylusClone = Object.assign({}, prefsStylus, {filename: stylFile});
              const stat = fs.statSync(cssFileBld);

              if (stat.isFile()) {
                const cssOld = fs.readFileSync(cssFileBld, conf.enc);

                // Only overwrite bld css if tmp css and bld css differ.
                if (cssNew !== cssOld) {
                  const style = stylus(stylFileStr, prefsStylusClone);

                  style.render(
                    ((iteration1) => {
                      return (err1, cssNew1) => {
                        if (err1) {
                          /* istanbul ignore next */
                          utils.error(err1);
                        }
                        else {
                          fs.outputFileSync(cssFileBld, cssNew1);

                          // Only write sourcemap if not printing line comments. Stylus internally checks whether the
                          // sourcemap is to be inline or external so there is no need for that check here.
                          if (style.sourcemap && !prefsStylusClone.linenos) {
                            fs.outputFileSync(`${cssFileBld}.map`, JSON.stringify(style.sourcemap));
                          }
                        }

                        /* istanbul ignore if */
                        if (iteration1 === 0) {
                          cb();
                        }
                      };
                    })(iteration)
                  );
                }
              }
            }

            /* istanbul ignore if */
            if (iteration === 0) {
              cb();
            }
          };
        })(i)
      );

    /* istanbul ignore if */
    if (i === 0) {
      cb();
    }
  }
}

function handleError(err) {
  /* istanbul ignore next */
  utils.error(err.toString());
  /* istanbul ignore next */
  this.emit('end');
}

// Declare gulp tasks.

gulp.task('stylus', function () {
  // Do not write sourcemaps if linenos === true, as the sourcemaps will be inaccurate and the linenos redundant.
  if (prefsStylus.sourcemap && prefsStylus.linenos) {
    sourcemaps.init = () => {
      return streamUntouched();
    };
    sourcemaps.write = () => {
      return streamUntouched();
    };
  }

  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(sourcemaps.init())
    .pipe(gulpStylus(prefsStylus))
    .pipe(sourcemaps.write(sourcemapDest, {sourceRoot}))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

// This first checks if the old bld CSS has line comments. If so, it runs the 'stylus' task.
// It then renders Stylus into tmp CSS files without line comments for future comparison, and returns.
// If the bld CSS has no line comments, it renders Stylus without line comments, to compare the new CSS with the old.
// The first time it runs, it just writes the rendered CSS to a tmp file for future comparison.
// On subsequent runs, it compares against the previously written tmp CSS.
// If there's no difference, it exits for that file and moves on to the next file if there is one.
// If there is a difference, it writes the new tmp CSS file.
// It then checks for a difference between the new tmp CSS and the bld CSS.
// If there is a difference, it renders Stylus again with line comments and writes that over the bld CSS.
// The intent is for users who use Fepper defaults to never render Stylus if they never edit Stylus files,
// and for users who do edit Stylus files to have Stylus render as expected.
// Power-users should replace this with the 'stylus:once' or 'stylus:no-comment' task for better performance.
gulp.task('stylus:diff-then-comment', function (cb) {
  diffThenRender(cb);
});

// 'stylus:frontend-copy' checks if there are line comments in the bld CSS.
// If there are, it renders Stylus without line comments for the full 'frontend-copy' task to copy to the backend.
// If there are not, it does nothing and allows the full 'frontend-copy' task to copy the bld CSS to the backend.
gulp.task('stylus:frontend-copy', function (cb) {
  const hasComments = testForComments();

  if (hasComments) {
    gulp.runSequence(
      'stylus:no-comment',
      cb
    );
  }
  else {
    cb();
  }
});

// This runs the CSS processor without outputting line comments.
// You probably want this to process CSS destined for production.
gulp.task('stylus:no-comment', function () {
  const prefsStylusClone = Object.assign({}, prefsStylus, {linenos: false});

  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(sourcemaps.init())
    .pipe(gulpStylus(prefsStylusClone))
    .pipe(sourcemaps.write(sourcemapDest, {sourceRoot}))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

gulp.task('stylus:once', ['stylus']);

gulp.task('stylus:watch', function () {
  // Return the watcher so it can be closed after testing.
  return gulp.watch('stylus/**/*', {cwd: cssSrcDir}, ['stylus']);
});

gulp.task('stylus:watch-no-comment', function () {
  // Return the watcher so it can be closed after testing.
  return gulp.watch('stylus/**/*', {cwd: cssSrcDir}, ['stylus:no-comment']);
});

gulp.task('stylus:watch-write-tmp', function () {
  // Return the watcher so it can be closed after testing.
  return gulp.watch('stylus/**/*', {cwd: cssSrcDir}, ['stylus:write-tmp', 'stylus']);
});

// This outputs tmp files without line comments to check for modifications to Stylus code.
gulp.task('stylus:write-tmp', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(gulpStylus({
      linenos: false
    }))
    .on('error', handleError)
    .pipe(gulp.dest(`${cssSrcDir}/.tmp`));
});
