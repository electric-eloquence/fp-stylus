'use strict';

const fs = require('fs');
const join = require('path').join;

const expect = require('chai').expect;

// Instantiate a gulp instance and assign it to the fp const.
process.env.ROOT_DIR = __dirname;
const fp = require('fepper/tasker');
require('../stylus~extend');

const enc = 'utf8';
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

describe('fp-stylus', function () {
  describe('fp stylus', function () {
    const styleBld = join(__dirname, 'source/_styles/bld/style.css');
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
  });

  describe('fp stylus:diff-then-comment', function () {
    const cssHtml = 'html {\n  font-size: 62.5%;\n}\n';
    const styleBld = join(__dirname, 'source/_styles/bld/style.css');
    const styleTmp = join(__dirname, 'source/_styles/src/.tmp/style.css');

    before(function () {
      if (fs.existsSync(styleTmp)) {
        fs.unlinkSync(styleTmp);
      }
    });

    it(
      'should, on first run, compile a tmp file but not overwrite the old bld file even if it differs',
      function (done) {
        fp.runSequence(
          'stylus:no-comment',
          () => {
            const styleBldCss = fs.readFileSync(styleBld, enc);
            fs.writeFileSync(styleBld, cssHtml + styleBldCss);

            fp.runSequence(
              'stylus:diff-then-comment',
              () => {
                const styleBldCss1 = fs.readFileSync(styleBld, enc);
                const styleBldTmp = fs.readFileSync(styleTmp, enc);

                expect(styleBldCss1).to.contain(cssHtml);
                expect(styleBldCss1).to.contain(cssBody);
                expect(styleBldCss1).to.contain(cssA);
                expect(styleBldCss1).to.contain(cssPseudoClass);
                expect(styleBldCss1).to.not.contain('/* line 1');
                expect(styleBldCss1).to.not.contain('/* line 2');
                expect(styleBldCss1).to.not.contain('/* line 3');

                expect(styleBldTmp).to.not.contain(cssHtml);
                expect(styleBldTmp).to.contain(cssBody);
                expect(styleBldTmp).to.contain(cssA);
                expect(styleBldTmp).to.contain(cssPseudoClass);
                expect(styleBldTmp).to.not.contain('/* line 1');
                expect(styleBldTmp).to.not.contain('/* line 2');
                expect(styleBldTmp).to.not.contain('/* line 3');

                done();
              }
            );
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

  describe('fp stylus:diff-then-no-comment', function () {
    const cssHtml = 'html {\n  font-size: 62.5%;\n}\n';
    const styleBld = join(__dirname, 'source/_styles/bld/style.css');
    const styleTmp = join(__dirname, 'source/_styles/src/.tmp/style.css');

    before(function () {
      if (fs.existsSync(styleTmp)) {
        fs.unlinkSync(styleTmp);
      }
    });

    it(
      'should, on first run, compile a tmp file but not overwrite the old bld file even if it differs',
      function (done) {
        fp.runSequence(
          'stylus:no-comment',
          () => {
            const styleBldCss = fs.readFileSync(styleBld, enc);
            fs.writeFileSync(styleBld, cssHtml + styleBldCss);

            fp.runSequence(
              'stylus:diff-then-no-comment',
              () => {
                const styleBldCss1 = fs.readFileSync(styleBld, enc);
                const styleBldTmp = fs.readFileSync(styleTmp, enc);

                expect(styleBldCss1).to.contain(cssHtml);
                expect(styleBldCss1).to.contain(cssBody);
                expect(styleBldCss1).to.contain(cssA);
                expect(styleBldCss1).to.contain(cssPseudoClass);
                expect(styleBldCss1).to.not.contain('/* line 1');
                expect(styleBldCss1).to.not.contain('/* line 2');
                expect(styleBldCss1).to.not.contain('/* line 3');

                expect(styleBldTmp).to.not.contain(cssHtml);
                expect(styleBldTmp).to.contain(cssBody);
                expect(styleBldTmp).to.contain(cssA);
                expect(styleBldTmp).to.contain(cssPseudoClass);
                expect(styleBldTmp).to.not.contain('/* line 1');
                expect(styleBldTmp).to.not.contain('/* line 2');
                expect(styleBldTmp).to.not.contain('/* line 3');

                done();
              }
            );
          }
        );
      }
    );

    it(
      'should, on subsequent runs, not overwrite the bld file if the new tmp file does not differ from the old tmp file',
      function (done) {
        const styleBldTmpBefore = fs.readFileSync(styleTmp, enc);

        fp.runSequence(
          'stylus:diff-then-no-comment',
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
        'stylus:diff-then-no-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.not.contain(cssHtml);
          expect(styleBldCss).to.contain(cssBody);
          expect(styleBldCss).to.contain(cssA);
          expect(styleBldCss).to.contain(cssPseudoClass);
          expect(styleBldCss).to.not.contain('/* line 1');
          expect(styleBldCss).to.not.contain('/* line 2');
          expect(styleBldCss).to.not.contain('/* line 3');

          done();
        }
      );
    });

    it('should compile Stylus partials into a tmp file without line comments', function (done) {
      fp.runSequence(
        'stylus:diff-then-no-comment',
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

    it('should compile Stylus partials into a bld file with no line comments', function (done) {
      fp.runSequence(
        'stylus:diff-then-no-comment',
        () => {
          const styleBldCss = fs.readFileSync(styleBld, enc);

          expect(styleBldCss).to.contain(cssBody);
          expect(styleBldCss).to.contain(cssA);
          expect(styleBldCss).to.contain(cssPseudoClass);
          expect(styleBldCss).to.not.contain('/* line 1');
          expect(styleBldCss).to.not.contain('/* line 2');
          expect(styleBldCss).to.not.contain('/* line 3');

          done();
        }
      );
    });
  });

  describe('fp stylus:no-comment', function () {
    const styleBld = join(__dirname, 'source/_styles/bld/style-no-comment.css');
    let styleBldExistsBefore;

    before(function (done) {
      if (fs.existsSync(styleBld)) {
        fs.unlinkSync(styleBld);
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
  });

  describe('fp stylus:frontend-copy', function () {
    const styleBack = join(__dirname, 'backend/docroot/styles/bld/style.css');
    const styleBld = join(__dirname, 'source/_styles/bld/style.css');
    let styleBackExistsBefore;
    let styleBldBefore;

    before(function (done) {
      if (fs.existsSync(styleBack)) {
        fs.unlinkSync(styleBack);
      }

      styleBackExistsBefore = fs.existsSync(styleBack);

      fp.runSequence(
        'stylus',
        () => {
          styleBldBefore = fs.readFileSync(styleBld, enc);
          done();
        }
      );
    });

    it('should compile Stylus without line comments and copy it to the backend', function (done) {
      fp.runSequence(
        'stylus:frontend-copy',
        () => {
          const styleBldAfter = fs.readFileSync(styleBld, enc);
          const styleBackCss = fs.readFileSync(styleBack, enc);

          expect(styleBldBefore).to.contain(cssBody);
          expect(styleBldBefore).to.contain(cssA);
          expect(styleBldBefore).to.contain(cssPseudoClass);
          expect(styleBldBefore).to.contain('/* line 1');
          expect(styleBldBefore).to.contain('/* line 2');
          expect(styleBldBefore).to.contain('/* line 3');

          expect(styleBldAfter).to.contain(cssBody);
          expect(styleBldAfter).to.contain(cssA);
          expect(styleBldAfter).to.contain(cssPseudoClass);
          expect(styleBldAfter).to.not.contain('/* line 1');
          expect(styleBldAfter).to.not.contain('/* line 2');
          expect(styleBldAfter).to.not.contain('/* line 3');

          expect(styleBackExistsBefore).to.equal(false);
          expect(styleBackCss).to.equal(styleBldAfter);

          done();
        }
      );
    });
  });
});
