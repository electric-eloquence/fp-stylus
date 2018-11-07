'use strict';

const path = require('path');

const fs = require('fs-extra');
const gulp = require('gulp');
const gulpStylus = require('gulp-stylus');
const runSequence = require('run-sequence');
const stylus = require('stylus');
const utils = require('fepper-utils');

const conf = global.conf;

const cssBldDir = conf.ui.paths.source.cssBld;
const cssSrcDir = conf.ui.paths.source.cssSrc;

function handleError(err) {
  utils.error(err.toString());
  this.emit('end');
}

gulp.task('stylus', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(gulpStylus({
      linenos: true
    }))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

// This first checks if the old bld CSS has line comments. If so, it runs the 'stylus' task and returns.
// If there are no line comments, it processes Stylus without line comments, to compare the new CSS with the old CSS.
// If there's a difference, it then processes Stylus again with line comments and writes that CSS to the bld directory.
// Otherwise, it leaves the old bld CSS alone.
// The intended result is for users who use Fepper defaults never to notice Stylus being processed if they never edit
// Stylus files, and for users who do edit Stylus files to have Stylus process as expected.
// Power-users should replace this with the 'stylus:once' or 'stylus:no-comment' task for better performance.
gulp.task('stylus:diff-then-comment', function (cb) {
  const cssFilesBld = fs.readdirSync(cssBldDir);
  let hasComments = false;
  let i = cssFilesBld.length;

  while (i--) {
    const cssFileBld = `${cssBldDir}/${cssFilesBld[i]}`;
    const stat = fs.statSync(cssFileBld);

    if (!stat.isFile()) {
      continue;
    }

    const cssOld = fs.readFileSync(cssFileBld, conf.enc);

    hasComments = /^\/\* line \d+ : /m.test(cssOld) && /\.styl \*\/$/m.test(cssOld);

    if (hasComments) {
      break;
    }
  }

  if (hasComments) {
    runSequence(
      'stylus',
      cb
    );

    return;
  }

  const stylDir = `${cssSrcDir}/stylus`;

  process.chdir(stylDir);

  const stylFiles = fs.readdirSync(stylDir);

  // Promise so we chdir back to global.rootDir at completion of async functions.
  new Promise((resolve) => {
    let i = stylFiles.length;

    while (i--) {
      const stylFile = stylFiles[i];
      const stylFileObj = path.parse(stylFile);

      if (stylFileObj.ext !== '.styl') {
        if (i === 0) {
          resolve();
        }

        continue;
      }

      const stat = fs.statSync(stylFile);

      if (!stat.isFile() && !stat.isSymbolicLink()) {
        if (i === 0) {
          resolve();
        }

        continue;
      }

      const stylFileStr = fs.readFileSync(stylFile, conf.enc);

      stylus(stylFileStr)
        .set('filename', stylFile)
        .set('linenos', false)
        .render((err, cssNew) => {
          if (err) {
            utils.error(err);
          }
          else {
            // Declare tmp file for comparison.
            const cssFileTmp = `${cssSrcDir}/${stylFileObj.name}.css`;
            let cssFileTmpStr = '';

            if (fs.existsSync(cssFileTmp)) {
              cssFileTmpStr = fs.readFileSync(cssFileTmp, conf.enc);
            }

            // Compare newly rendered css with the contents of the tmp file.
            // Exit if there has been no change. This is the case for users who only edit bld css and do not modify
            // Stylus files.
            if (cssFileTmpStr === cssNew) {
              if (i === 0) {
                resolve();
              }

              return;
            }

            // Output tmp file for future comparison.
            fs.outputFileSync(cssFileTmp, cssNew);

            // Now, compare against bld css.
            const cssFileBld = `${cssBldDir}/${stylFileObj.name}.css`;
            const stat = fs.statSync(cssFileBld);

            if (stat.isFile()) {
              const cssOld = fs.readFileSync(cssFileBld, conf.enc);

              // The first time 'stylus:diff-then-comment' is run, cssNew should equal cssOld.
              // cssFileTmp will have been written at this point and will be used for future comparisons.
              // If users only edit bld css and do not modify Stylus files, they should never get to this point.
              if (cssNew !== cssOld) {
                stylus(stylFileStr)
                  .set('filename', stylFile)
                  .set('linenos', true)
                  .render((err1, cssNewCommented) => {
                    if (err1) {
                      utils.error(err1);
                    }
                    else {
                      fs.outputFileSync(cssFileBld, cssNewCommented);
                    }

                    if (i === stylFiles.length - 1) {
                      resolve();
                    }
                  });
              }
            }
          }

          if (i === 0) {
            resolve();
          }
        });

      if (i === 0) {
        resolve();
      }
    }
  })
  .then(() => {
    process.chdir(global.rootDir);
    cb();
  });
});

// This runs the CSS processor without outputting line comments.
// You probably want this to process CSS destined for production.
gulp.task('stylus:no-comment', function () {
  return gulp.src(cssSrcDir + '/stylus/*.styl')
    .pipe(gulpStylus({
      linenos: false
    }))
    .on('error', handleError)
    .pipe(gulp.dest(cssBldDir));
});

gulp.task('stylus:frontend-copy', function (cb) {
  runSequence(
    'stylus:no-comment',
    'ui:copy-styles',
    cb
  );
});

gulp.task('stylus:once', ['stylus']);

gulp.task('stylus:watch', function () {
  gulp.watch('stylus/**/*', {cwd: cssSrcDir}, ['stylus']);
});
