var test = require('tape');
var assertNoError = require('assert-no-error');
var makeClickMovieCmd = require('../make-click-movie-cmd');
var { exec } = require('child_process');

var testCases = [
  {
    name: 'Three points',
    opts: {
      startCoord: [0, 200],
      mouseSteps: [
        {
          action: 'move',
          coord: [500, 600]
        },
        // cursor-active and cursor-inactive pairs are simulating clicks.
        {
          action: 'cursor-active'
        },
        {
          action: 'cursor-inactive'
        },
        {
          action: 'cursor-active'
        },
        {
          action: 'cursor-inactive'
        },
        {
          action: 'move',
          coord: [300, 100]
        },
        {
          action: 'cursor-active'
        },
        {
          action: 'cursor-inactive'
        },
        {
          action: 'cursor-active'
        },
        {
          action: 'cursor-inactive'
        },
        {
          action: 'move',
          coord: [50, 400]
        },
        {
          action: 'cursor-active'
        },
        {
          action: 'cursor-inactive'
        },
        {
          action: 'cursor-active'
        },
        {
          action: 'cursor-inactive'
        }
      ],
      backgroundMovieFile: 'tests/fixtures/bg-movie.mp4',
      cursorImageFile: 'static/basic-pointer.png',
      activeCursorImageFile: 'static/basic-pointer-negative.png',
      outputFile: 'make-click-test.mp4'
    },
    expected: {
      cmdLines: [
        'ffmpeg -i tests/fixtures/bg-movie.mp4 -i static/basic-pointer.png -i static/basic-pointer-negative.png \\',
        '      -filter_complex "[0:v] \\',
        "      [1:v] overlay=x=0+(t-0)/3.2015621187164243*500:y=200+(t-0)/3.2015621187164243*400:enable='between(t,0,3.2015621187164243)' [step_1_click_active]; \\",
        "[step_1_click_active] [2:v] overlay=x=500:y=600:enable='between(t,3.2015621187164243,3.4015621187164244)' [step_2_click_inactive]; \\",
        "[step_2_click_inactive] [1:v] overlay=x=500:y=600:enable='between(t,3.4015621187164244,3.5015621187164245)' [step_3_click_active]; \\",
        "[step_3_click_active] [2:v] overlay=x=500:y=600:enable='between(t,3.5015621187164245,3.7015621187164247)' [step_4_click_inactive]; \\",
        "[step_4_click_inactive] [1:v] overlay=x=500:y=600:enable='between(t,3.7015621187164247,3.801562118716425)' [step_5_move]; \\",
        "[step_5_move] [1:v] overlay=x=500+(t-3.801562118716425)/2.692582403567252*-200:y=600+(t-3.801562118716425)/2.692582403567252*-500:enable='between(t,3.801562118716425,6.494144522283676)' [step_6_click_active]; \\",
        "[step_6_click_active] [2:v] overlay=x=300:y=100:enable='between(t,6.494144522283676,6.694144522283676)' [step_7_click_inactive]; \\",
        "[step_7_click_inactive] [1:v] overlay=x=300:y=100:enable='between(t,6.694144522283676,6.794144522283676)' [step_8_click_active]; \\",
        "[step_8_click_active] [2:v] overlay=x=300:y=100:enable='between(t,6.794144522283676,6.994144522283676)' [step_9_click_inactive]; \\",
        "[step_9_click_inactive] [1:v] overlay=x=300:y=100:enable='between(t,6.994144522283676,7.094144522283676)' [step_10_move]; \\",
        "[step_10_move] [1:v] overlay=x=300+(t-7.094144522283676)/1.9525624189766637*-250:y=100+(t-7.094144522283676)/1.9525624189766637*300:enable='between(t,7.094144522283676,9.04670694126034)' [step_11_click_active]; \\",
        "[step_11_click_active] [2:v] overlay=x=50:y=400:enable='between(t,9.04670694126034,9.246706941260339)' [step_12_click_inactive]; \\",
        "[step_12_click_inactive] [1:v] overlay=x=50:y=400:enable='between(t,9.246706941260339,9.346706941260338)' [step_13_click_active]; \\",
        "[step_13_click_active] [2:v] overlay=x=50:y=400:enable='between(t,9.346706941260338,9.546706941260338)' [step_14_click_inactive]; \\",
        "[step_14_click_inactive] [1:v] overlay=x=50:y=400:enable='between(t,9.546706941260338,9.646706941260337)'\" \\",
        '      -pix_fmt yuv420p -c:a copy \\',
        '      make-click-test.mp4'
      ],
      duration: 9.64670694126034
    }
  }
];

testCases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, makeCmdTest);

  function makeCmdTest(t) {
    var command = makeClickMovieCmd(testCase.opts);
    console.log(command.cmd);
    var cmdLines = command.cmd.split('\n');
    for (var i = 0; i < testCase.expected.cmdLines.length; ++i) {
      t.equal(
        cmdLines[i],
        testCase.expected.cmdLines[i],
        'Command line ' + i + ' is correct.'
      );
    }
    t.ok(
      Math.abs(command.duration - testCase.expected.duration) < 0.001,
      'Duration is correct.'
    );
    exec(command.cmd, checkCommandResult);

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
