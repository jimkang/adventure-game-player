var test = require('tape');
var assertNoError = require('assert-no-error');
var makeClickMovieCmd = require('../make-click-movie-cmd');
var { exec } = require('child_process');

var testCases = [
  {
    name: 'Three points',
    opts: {
      startCoord: [0, 200],
      clickCoords: [[500, 600], [300, 100], [50, 400]],
      backgroundMovieFile: 'tests/fixtures/bg-movie.mp4',
      cursorImageFile: 'static/basic-pointer.png',
      activeCursorImageFile: 'static/basic-pointer-negative.png',
      outputFile: 'make-click-test.mp4'
    },
    expected: 'ffmpeg -i tests/fixtures/bg-movie.mp4 -i static/basic-pointer.png -i static/basic-pointer-negative.png \\\n    -filter_complex "[0:v] \\\n    overlay=x=0+(t-0)/3.2015621187164243*500:y=200+(t-0)/3.2015621187164243*400:enable=\'between(t,0,3.2015621187164243)\'[step0_click_active_0]; \\\n[step0_click_active_0][2:v] overlay=x=500:y=600:enable=\'between(t,3.2015621187164243,3.4015621187164244)\' [step0_click_inactive_0]; \\\n[step0_click_inactive_0][1:v] overlay=x=500:y=600:enable=\'between(t,3.4015621187164244,3.5015621187164245)\' [step0_click_active_1]; \\\n[step0_click_active_1][2:v] overlay=x=500:y=600:enable=\'between(t,3.5015621187164245,3.7015621187164247)\' [step0_click_inactive_1]; \\\n[step0_click_inactive_1][1:v] overlay=x=500:y=600:enable=\'between(t,3.7015621187164247,3.801562118716425)\' [step1]; \\\n[step1][1:v] overlay=x=500+(t-3.801562118716425)/2.692582403567252*-200:y=600+(t-3.801562118716425)/2.692582403567252*-500:enable=\'between(t,3.801562118716425,6.494144522283676)\'[step1_click_active_0]; \\\n[step1_click_active_0][2:v] overlay=x=300:y=100:enable=\'between(t,6.494144522283676,6.694144522283676)\' [step1_click_inactive_0]; \\\n[step1_click_inactive_0][1:v] overlay=x=300:y=100:enable=\'between(t,6.694144522283677,6.794144522283677)\' [step1_click_active_1]; \\\n[step1_click_active_1][2:v] overlay=x=300:y=100:enable=\'between(t,6.794144522283677,6.994144522283677)\' [step1_click_inactive_1]; \\\n[step1_click_inactive_1][1:v] overlay=x=300:y=100:enable=\'between(t,6.994144522283677,7.094144522283677)\' [step2]; \\\n[step2][1:v] overlay=x=300+(t-7.094144522283678)/1.9525624189766637*-250:y=100+(t-7.094144522283678)/1.9525624189766637*300:enable=\'between(t,7.094144522283678,9.046706941260341)\'[step2_click_active_0]; \\\n[step2_click_active_0][2:v] overlay=x=50:y=400:enable=\'between(t,9.046706941260341,9.24670694126034)\' [step2_click_inactive_0]; \\\n[step2_click_inactive_0][1:v] overlay=x=50:y=400:enable=\'between(t,9.246706941260342,9.346706941260342)\' [step2_click_active_1]; \\\n[step2_click_active_1][2:v] overlay=x=50:y=400:enable=\'between(t,9.346706941260342,9.546706941260341)\' [step2_click_inactive_1]; \\\n[step2_click_inactive_1][1:v] overlay=x=50:y=400:enable=\'between(t,9.546706941260341,9.64670694126034)\'" \\\n    -pix_fmt yuv420p -c:a copy \\\n    make-click-test.mp4'
  }
];

testCases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, makeCmdTest);

  function makeCmdTest(t) {
    var command = makeClickMovieCmd(testCase.opts);
    console.log(command);
    t.equal(command, testCase.expected, 'Command is correct.');
    exec(command, checkCommandResult);

    function checkCommandResult(error) {
      assertNoError(t.ok, error, 'No error when running command');
      console.log(
        'Check',
        testCase.opts.outputFile,
        'to make sure the video is correct.'
      );
      t.end();
    }
  }
}
