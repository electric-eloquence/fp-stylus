'use strict';

const fs = require('fs-extra');
const path = require('path');
const join = path.join;

const expect = require('chai').expect;

// Instantiate a gulp instance and assign it to the fp const.
process.env.ROOT_DIR = __dirname;
const fp = require('fepper/tasker');
require('../stylus~extend');

const cssHtml = 'html {\n  font-size: 62.5%;\n}\n';
const cssBody = `body {
  background: #fff;
  font: 1.6em/1.5 Helvetica, "Nimbus Sans L", "Liberation Sans", Roboto, sans-serif;
  color: #333;
  min-height: 100vh;
  padding-bottom: 5rem;
  position: relative;
}
`;
const cssA = `a {
  color: #333;
}
`;
const cssPseudoClass = `a:hover,
a:focus {
  color: #808080;
}
`;
const enc = 'utf8';
const styleBack = join(__dirname, 'backend/docroot/styles/bld/style.css');
const styleBld = join(__dirname, 'source/_styles/bld/style.css');
const styleStylus = join(__dirname, 'source/_styles/src/stylus/style.styl');
const styleTmp = join(__dirname, 'source/_styles/src/.tmp/style.css');
const styleWatchCss = join(__dirname, 'source/_styles/bld/watch-fixture.css');
const styleWatchStylus = join(__dirname, 'source/_styles/src/stylus/watch-fixture.styl');
const styleWatchTmp = join(__dirname, 'source/_styles/src/.tmp/watch-fixture.css');
const stylusHtml = 'html\n  font-size: 62.5%\n';

describe('fp-stylus', function () {
  describe('fp stylus', function () {
    let styleBldExistsBefore;

    before(function (done) {
      if (fs.existsSync(styleBld)) {
        fs.unlinkSync(styleBld);
      }
      if (fs.existsSync(styleTmp)) {
        fs.emptyDirSync(path.dirname(styleTmp));
      }

      styleBldExistsBefore = fs.existsSync(styleBld);

      fp.runSequence(
        'stylus',
        done
      );
    });

    it('should compile Stylus partials into a CSS file with line comments', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.equal(false);

      expect(styleBldCss).to.contain(cssBody);
      expect(styleBldCss).to.contain(cssA);
      expect(styleBldCss).to.contain(cssPseudoClass);
      expect(styleBldCss).to.contain('/* line 1');
      expect(styleBldCss).to.contain('/* line 2');
      expect(styleBldCss).to.contain('/* line 3');
    });

    it('should not write a tmp file', function () {
      const styleTmpExists = fs.existsSync(styleTmp);

      expect(styleTmpExists).to.equal(false);
    });
  });

  describe('fp stylus:diff-then-comment', function () {
    let styleBldCssBefore;

    before(function (done) {
      if (fs.existsSync(styleTmp)) {
        fs.unlinkSync(styleTmp);
      }

      fp.runSequence(
        'stylus:no-comment',
        () => {
          fs.writeFileSync(styleBld, cssHtml + fs.readFileSync(styleBld, enc));

          styleBldCssBefore = fs.readFileSync(styleBld, enc);

          done();
        }
      );
    });

    it(
      'should, on first run, compile a tmp file but not overwrite the old bld file even if it differs',
      function (done) {
        fp.runSequence(
          'stylus:diff-then-comment',
          () => {
            const styleBldCssAfter = fs.readFileSync(styleBld, enc);
            const styleBldTmp = fs.readFileSync(styleTmp, enc);

            expect(styleBldCssBefore).to.contain(cssHtml);
            expect(styleBldCssBefore).to.contain(cssBody);
            expect(styleBldCssBefore).to.contain(cssA);
            expect(styleBldCssBefore).to.contain(cssPseudoClass);
            expect(styleBldCssBefore).to.not.contain('/* line 1');
            expect(styleBldCssBefore).to.not.contain('/* line 2');
            expect(styleBldCssBefore).to.not.contain('/* line 3');

            expect(styleBldTmp).to.not.contain(cssHtml);
            expect(styleBldTmp).to.contain(cssBody);
            expect(styleBldTmp).to.contain(cssA);
            expect(styleBldTmp).to.contain(cssPseudoClass);
            expect(styleBldTmp).to.not.contain('/* line 1');
            expect(styleBldTmp).to.not.contain('/* line 2');
            expect(styleBldTmp).to.not.contain('/* line 3');

            expect(styleBldCssBefore).to.equal(styleBldCssAfter);

            done();
          }
        );
      }
    );

    it(
      'should, on subsequent runs, not overwrite the bld file if the new tmp file does not differ from the old tmp file',
      function (done) {
        const styleBldTmpBefore = fs.readFileSync(styleTmp, enc);

        fp.runSequence(
          'stylus:diff-then-comment',
          () => {
            const styleBldCss = fs.readFileSync(styleBld, enc);
            const styleBldTmpAfter = fs.readFileSync(styleTmp, enc);

            expect(styleBldCss).to.contain(cssHtml);
            expect(styleBldCss).to.contain(cssBody);
            expect(styleBldCss).to.contain(cssA);
            expect(styleBldCss).to.contain(cssPseudoClass);
            expect(styleBldCss).to.not.contain('/* line 1');
            expect(styleBldCss).to.not.contain('/* line 2');
            expect(styleBldCss).to.not.contain('/* line 3');

            expect(styleBldTmpBefore).to.equal(styleBldTmpAfter);

            expect(styleBldTmpAfter).to.not.contain(cssHtml);
            expect(styleBldTmpAfter).to.contain(cssBody);
            expect(styleBldTmpAfter).to.contain(cssA);
            expect(styleBldTmpAfter).to.contain(cssPseudoClass);
            expect(styleBldTmpAfter).to.not.contain('/* line 1');
            expect(styleBldTmpAfter).to.not.contain('/* line 2');
            expect(styleBldTmpAfter).to.not.contain('/* line 3');

            done();
          }
        );
      }
    );

    it('should overwrite the bld file if the new tmp file differs from the old tmp file', function (done) {
      fs.copyFileSync(styleBld, styleTmp);

      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.not.contain(cssHtml);
          expect(styleBldCss).to.contain(cssBody);
          expect(styleBldCss).to.contain(cssA);
          expect(styleBldCss).to.contain(cssPseudoClass);
          expect(styleBldCss).to.contain('/* line 1');
          expect(styleBldCss).to.contain('/* line 2');
          expect(styleBldCss).to.contain('/* line 3');

          done();
        }
      );
    });

    it('should compile Stylus partials into a tmp file without line comments', function (done) {
      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleTmpCss = fs.readFileSync(styleTmp, enc);

          expect(styleTmpCss).to.contain(cssBody);
          expect(styleTmpCss).to.contain(cssA);
          expect(styleTmpCss).to.contain(cssPseudoClass);
          expect(styleTmpCss).to.not.contain('/* line 1');
          expect(styleTmpCss).to.not.contain('/* line 2');
          expect(styleTmpCss).to.not.contain('/* line 3');

          done();
        }
      );
    });

    it('should compile Stylus partials into a bld file with line comments', function (done) {
      fp.runSequence(
        'stylus:diff-then-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.contain(cssBody);
          expect(styleBldCss).to.contain(cssA);
          expect(styleBldCss).to.contain(cssPseudoClass);
          expect(styleBldCss).to.contain('/* line 1');
          expect(styleBldCss).to.contain('/* line 2');
          expect(styleBldCss).to.contain('/* line 3');

          done();
        }
      );
    });
  });

  describe('fp stylus:no-comment', function () {
    let styleBldExistsBefore;

    before(function (done) {
      if (fs.existsSync(styleBld)) {
        fs.unlinkSync(styleBld);
      }
      if (fs.existsSync(styleTmp)) {
        fs.unlinkSync(styleTmp);
      }

      styleBldExistsBefore = fs.existsSync(styleBld);

      fp.runSequence(
        'stylus:no-comment',
        done
      );
    });

    it('should compile Stylus partials into a CSS file without line comments', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.equal(false);

      expect(styleBldCss).to.contain(cssBody);
      expect(styleBldCss).to.contain(cssA);
      expect(styleBldCss).to.contain(cssPseudoClass);
      expect(styleBldCss).to.not.contain('/* line 1');
      expect(styleBldCss).to.not.contain('/* line 2');
      expect(styleBldCss).to.not.contain('/* line 3');
    });

    it('should not write a tmp file', function () {
      const styleTmpExists = fs.existsSync(styleTmp);

      expect(styleTmpExists).to.equal(false);
    });
  });

  describe('fp stylus:frontend-copy', function () {
    const styleBackAlt = join(__dirname, 'backend/docroot/local-yml/local-yml.css');
    const styleBldAlt = join(__dirname, 'source/_styles/bld/local-yml.css');
    let styleBackAltExistsBefore;
    let styleBackExistsBefore;
    let styleBldBefore;

    before(function (done) {
      if (fs.existsSync(styleBack)) {
        fs.emptyDirSync(path.dirname(styleBack));
        fs.unlinkSync(styleBackAlt);
      }

      styleBackAltExistsBefore = fs.existsSync(styleBackAlt);
      styleBackExistsBefore = fs.existsSync(styleBack);

      fp.runSequence(
        'stylus',
        () => {
          styleBldBefore = fs.readFileSync(styleBld, enc);
          fp.runSequence(
            'stylus:frontend-copy',
            () => {
              done();
            }
          );
        }
      );
    });

    it('should compile Stylus without line comments and copy it to the backend', function () {
      const styleBackCss = fs.readFileSync(styleBack, enc);

      expect(styleBldBefore).to.contain(cssBody);
      expect(styleBldBefore).to.contain(cssA);
      expect(styleBldBefore).to.contain(cssPseudoClass);
      expect(styleBldBefore).to.contain('/* line 1');
      expect(styleBldBefore).to.contain('/* line 2');
      expect(styleBldBefore).to.contain('/* line 3');

      expect(styleBackExistsBefore).to.equal(false);

      expect(styleBackCss).to.contain(cssBody);
      expect(styleBackCss).to.contain(cssA);
      expect(styleBackCss).to.contain(cssPseudoClass);
      expect(styleBackCss).to.not.contain('/* line 1');
      expect(styleBackCss).to.not.contain('/* line 2');
      expect(styleBackCss).to.not.contain('/* line 3');
    });

    it('should compile Stylus without line comments and copy it to an alternate backend directory', function () {
      const styleBldAltCss = fs.readFileSync(styleBldAlt, enc);
      const styleBackAltCss = fs.readFileSync(styleBackAlt, enc);

      expect(styleBldAltCss).to.contain(cssBody);
      expect(styleBldAltCss).to.contain(cssA);
      expect(styleBldAltCss).to.contain(cssPseudoClass);
      expect(styleBldAltCss).to.contain('/* line 1');
      expect(styleBldAltCss).to.contain('/* line 2');
      expect(styleBldAltCss).to.contain('/* line 3');

      expect(styleBackAltExistsBefore).to.equal(false);

      expect(styleBackAltCss).to.contain(cssBody);
      expect(styleBackAltCss).to.contain(cssA);
      expect(styleBackAltCss).to.contain(cssPseudoClass);
      expect(styleBackAltCss).to.not.contain('/* line 1');
      expect(styleBackAltCss).to.not.contain('/* line 2');
      expect(styleBackAltCss).to.not.contain('/* line 3');
    });

    it('should preserve line comments in the bld file', function () {
      const styleBldAfter = fs.readFileSync(styleBld, enc);

      expect(styleBldAfter).to.contain(cssBody);
      expect(styleBldAfter).to.contain(cssA);
      expect(styleBldAfter).to.contain(cssPseudoClass);
      expect(styleBldAfter).to.contain('/* line 1');
      expect(styleBldAfter).to.contain('/* line 2');
      expect(styleBldAfter).to.contain('/* line 3');

      expect(styleBldBefore).to.equal(styleBldAfter);
    });
  });

  describe('fp stylus:once', function () {
    let styleBldExistsBefore;

    before(function (done) {
      if (fs.existsSync(styleBld)) {
        fs.unlinkSync(styleBld);
      }

      styleBldExistsBefore = fs.existsSync(styleBld);

      fp.runSequence(
        'stylus',
        done
      );
    });

    it('should be alias for `fp stylus`', function () {
      const styleBldCss = fs.readFileSync(styleBld, enc);

      expect(styleBldExistsBefore).to.equal(false);

      expect(styleBldCss).to.contain(cssBody);
      expect(styleBldCss).to.contain(cssA);
      expect(styleBldCss).to.contain(cssPseudoClass);
      expect(styleBldCss).to.contain('/* line 1');
      expect(styleBldCss).to.contain('/* line 2');
      expect(styleBldCss).to.contain('/* line 3');
    });
  });

  describe('fp stylus:write-tmp', function () {
    let styleTmpExistsBefore;

    before(function (done) {
      if (fs.existsSync(styleTmp)) {
        fs.unlinkSync(styleTmp);
      }

      styleTmpExistsBefore = fs.existsSync(styleTmp);

      fp.runSequence(
        'stylus:write-tmp',
        done
      );
    });

    it('should compile Stylus partials into a CSS file without line comments to the .tmp directory', function () {
      const styleTmpCss = fs.readFileSync(styleTmp, enc);

      expect(styleTmpExistsBefore).to.equal(false);

      expect(styleTmpCss).to.contain(cssBody);
      expect(styleTmpCss).to.contain(cssA);
      expect(styleTmpCss).to.contain(cssPseudoClass);
      expect(styleTmpCss).to.not.contain('/* line 1');
      expect(styleTmpCss).to.not.contain('/* line 2');
      expect(styleTmpCss).to.not.contain('/* line 3');
    });
  });

  describe('fp stylus:watch', function () {
    before(function () {
      if (fs.existsSync(styleWatchCss)) {
        fs.unlinkSync(styleWatchCss);
      }
      if (fs.existsSync(styleWatchStylus)) {
        fs.unlinkSync(styleWatchStylus);
      }
    });

    after(function () {
      if (fs.existsSync(styleBld)) {
        fs.unlinkSync(styleBld);
      }
      if (fs.existsSync(styleTmp)) {
        fs.emptyDirSync(path.dirname(styleTmp));
      }
      if (fs.existsSync(styleWatchCss)) {
        fs.unlinkSync(styleWatchCss);
      }
      if (fs.existsSync(styleWatchStylus)) {
        fs.unlinkSync(styleWatchStylus);
      }
    });

    it('should compile Stylus into bld CSS with line comments when a Stylus partial is modified', function (done) {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const css = fs.readFileSync(styleWatchCss, enc);

          expect(css).to.contain(cssHtml);
          expect(css).to.contain(cssBody);
          expect(css).to.contain(cssA);
          expect(css).to.contain(cssPseudoClass);
          expect(css).to.contain('/* line 1');
          expect(css).to.contain('/* line 2');
          expect(css).to.contain('/* line 3');

          watcher.close();
          done();
        }, 500);
      }, 100);
    });
  });

  describe('fp stylus:watch-no-comment', function () {
    before(function () {
      if (fs.existsSync(styleWatchCss)) {
        fs.unlinkSync(styleWatchCss);
      }
      if (fs.existsSync(styleWatchStylus)) {
        fs.unlinkSync(styleWatchStylus);
      }
    });

    after(function () {
      if (fs.existsSync(styleBld)) {
        fs.unlinkSync(styleBld);
      }
      if (fs.existsSync(styleTmp)) {
        fs.emptyDirSync(path.dirname(styleTmp));
      }
      if (fs.existsSync(styleWatchCss)) {
        fs.unlinkSync(styleWatchCss);
      }
      if (fs.existsSync(styleWatchStylus)) {
        fs.unlinkSync(styleWatchStylus);
      }
    });

    it('should compile Stylus into bld CSS without line comments when a Stylus partial is modified', function (done) {
      const stylus = fs.readFileSync(styleStylus, enc);
      const watcher = fp.tasks['stylus:watch-no-comment'].fn();

      setTimeout(() => {
        fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
        setTimeout(() => {
          const css = fs.readFileSync(styleWatchCss, enc);

          expect(css).to.contain(cssHtml);
          expect(css).to.contain(cssBody);
          expect(css).to.contain(cssA);
          expect(css).to.contain(cssPseudoClass);
          expect(css).to.not.contain('/* line 1');
          expect(css).to.not.contain('/* line 2');
          expect(css).to.not.contain('/* line 3');

          watcher.close();
          done();
        }, 500);
      }, 100);
    });
  });

  describe('fp stylus:watch-write-tmp', function () {
    before(function () {
      if (fs.existsSync(styleWatchCss)) {
        fs.unlinkSync(styleWatchCss);
      }
      if (fs.existsSync(styleWatchStylus)) {
        fs.unlinkSync(styleWatchStylus);
      }
    });

    after(function () {
      if (fs.existsSync(styleBld)) {
        fs.unlinkSync(styleBld);
      }
      if (fs.existsSync(styleTmp)) {
        fs.emptyDirSync(path.dirname(styleTmp));
      }
      if (fs.existsSync(styleWatchCss)) {
        fs.unlinkSync(styleWatchCss);
      }
      if (fs.existsSync(styleWatchStylus)) {
        fs.unlinkSync(styleWatchStylus);
      }
    });

    it(
      'should run `fp stylus` when a Stylus partial is modified, but also write a tmp file to allow direct edits to the bld file',
      function (done) {
        const stylus = fs.readFileSync(styleStylus, enc);
        const watcher = fp.tasks['stylus:watch-write-tmp'].fn();

        setTimeout(() => {
          fs.writeFileSync(styleWatchStylus, stylus + stylusHtml);
          setTimeout(() => {
            const cssBld = fs.readFileSync(styleWatchCss, enc);
            const cssTmp = fs.readFileSync(styleWatchTmp, enc);

            expect(cssBld).to.contain(cssHtml);
            expect(cssBld).to.contain(cssBody);
            expect(cssBld).to.contain(cssA);
            expect(cssBld).to.contain(cssPseudoClass);
            expect(cssBld).to.contain('/* line 1');
            expect(cssBld).to.contain('/* line 2');
            expect(cssBld).to.contain('/* line 3');

            expect(cssTmp).to.contain(cssHtml);
            expect(cssTmp).to.contain(cssBody);
            expect(cssTmp).to.contain(cssA);
            expect(cssTmp).to.contain(cssPseudoClass);
            expect(cssTmp).to.not.contain('/* line 1');
            expect(cssTmp).to.not.contain('/* line 2');
            expect(cssTmp).to.not.contain('/* line 3');

            watcher.close();
            done();
          }, 500);
        }, 100);
      }
    );
  });
});
