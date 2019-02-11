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

// Set up pref.stylus.
pref.stylus = pref.stylus || {};

// Opt for line comments by default.
if (pref.stylus.linenos !== false) {
  pref.stylus.linenos = true;
}

function getSourcemapDest() {
  if (pref.stylus.sourcemap && !pref.stylus.sourcemap.inline) {
    return '.';
  }

  return;
}

function getSourceRoot() {
  if (pref.stylus.sourcemap) {
    let sourceRoot;

    if (pref.stylus.sourcemap.sourceRoot) {
      sourceRoot = pref.stylus.sourcemap.sourceRoot;
    }
    else {
      const uiSourceDir = conf.ui.paths.source.root;

      if (cssSrcDir.indexOf(uiSourceDir) === 0) {
        sourceRoot = cssSrcDir.slice(uiSourceDir.length);
        sourceRoot += '/stylus';
      }
    }

    return sourceRoot;
  }

  return;
}

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

function testForComments() {
  const cssFilesBld = fs.readdirSync(cssBldDir);
  let hasComments = false;
  let i = cssFilesBld.length;

  while (i--) {
    const cssFileBld = `${cssBldDir}/${cssFilesBld[i]}`;

    /* istanbul ignore if */
    if (!fs.existsSync(cssFileBld)) {
      continue;
    }

    const stat = fs.statSync(cssFileBld);

    if (!stat.isFile()) {
      continue;
    }

    const cssOld = fs.readFileSync(cssFileBld, conf.enc);

    hasComments = (/^\/\* line \d+ : /m.test(cssOld) && /\.styl \*\/$/m.test(cssOld)) ||
      /^\/\*# sourceMappingURL=/m.test(cssOld);

    if (hasComments) {
      break;
    }
  }

  return hasComments;
}

function diffThenComment(cb) {
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

    /* istanbul ignore if */
    if (!fs.existsSync(stylFile)) {
      if (i === 0) {
        cb();
      }

      continue;
    }

    const stat = fs.statSync(stylFile);

    if (!stat.isFile()) {
      if (i === 0) {
        cb();
      }

      continue;
    }

    const stylFileObj = path.parse(stylFile);

    if (stylFileObj.ext !== '.styl') {
      /* istanbul ignore if */
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
              // Declare bld file.
              const cssFileBld = `${cssBldDir}/${stylFileObj.name}.css`;
              const cssFileBldExists = fs.existsSync(cssFileBld);
              // Declare tmp file for comparison.
              const cssFileTmp = `${cssSrcDir}/.tmp/${stylFileObj.name}.css`;
              let cssFileTmpStr = '';

              // If cssFileBld does not exist (quite possibly on a fresh install where it isn't version controlled),
              // we need to render and write it. In this case, keep cssFileTmpStr empty even if cssFileTmp exists.
              if (cssFileBldExists) {
                // For cases where it does exist, set cssFileTmpStr.
                // In cases where cssFileTmp exists, set cssFileTmpStr to the contents of that file.
                if (fs.existsSync(cssFileTmp)) {
                  cssFileTmpStr = fs.readFileSync(cssFileTmp, conf.enc);
                }
                // In cases where cssFileTmp does not exist, output cssFileTmp for future comparison.
                else {
                  // Set cssFileTmpStr == cssNew to skip overwriting cssFileBld.
                  fs.outputFileSync(cssFileTmp, cssNew);
                  // Exit this iteration in next block.
                  cssFileTmpStr = cssNew;
                }
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
              const prefStylusClone = Object.assign({}, pref.stylus, {filename: stylFile});
              let stat;

              if (cssFileBldExists) {
                stat = fs.statSync(cssFileBld);
              }

              if (!cssFileBldExists || stat.isFile()) {
                let cssOld = '';

                if (cssFileBldExists) {
                  cssOld = fs.readFileSync(cssFileBld, conf.enc);
                }

                // Only overwrite bld css if tmp css and bld css differ.
                if (cssNew !== cssOld) {
                  const style = stylus(stylFileStr, prefStylusClone);

                  style.render(
                    ((iteration1) => {
                      return (err1, cssNew1) => {
                        if (err1) {
                          /* istanbul ignore next */
                          utils.error(err1);
                        }
                        else {
                          fs.outputFileSync(cssFileBld, cssNew1);

                          // Only write sourcemap if not printing line comments and not writing the sourcemap inline.
                          if (style.sourcemap && !prefStylusClone.linenos && !prefStylusClone.sourcemap.inline) {
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
  const sourceRoot = getSourceRoot();
  let sourcemapsInit = sourcemaps.init;
  let sourcemapsWrite = sourcemaps.write;

  // Do not write sourcemaps if pref.stylus.sourcemap is falsey.
  // Do not write sourcemaps if linenos === true, as the sourcemaps will be inaccurate and the linenos redundant.
  if (!pref.stylus.sourcemap || pref.stylus.linenos) {
    sourcemapsInit = () => {
      return streamUntouched();
    };
    sourcemapsWrite = () => {
      return streamUntouched();
    };
  }

  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(sourcemapsInit())
    .pipe(gulpStylus(pref.stylus))
    .pipe(sourcemapsWrite(getSourcemapDest(), {sourceRoot}))
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
  diffThenComment(cb);
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

// This renders Stylus without printing line comments. It also never writes sourcemaps.
// You probably want this to preprocess CSS destined for production.
gulp.task('stylus:no-comment', function () {
  const prefStylusClone = Object.assign({}, pref.stylus, {linenos: false});

  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(gulpStylus(prefStylusClone))
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
