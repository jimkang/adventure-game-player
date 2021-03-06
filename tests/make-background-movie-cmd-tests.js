var test = require('tape');
var assertNoError = require('assert-no-error');
var makeBackgroundMovieCmd = require('../make-background-movie-cmd');
var { exec } = require('child_process');
var rimraf = require('rimraf');

var testCases = [
  {
    name: 'Basic',
    opts: {
      imageFilePath:
        'tests/fixtures/surfaces/305286-hero-s-quest-so-you-want-to-be-a-hero-atari-st-screenshot.png',
      duration: 7,
      outputFile: 'basic-background-movie-test.mp4'
    },
    expected: {
      cmdLines: [
        'ffmpeg -loop 1 -i tests/fixtures/surfaces/305286-hero-s-quest-so-you-want-to-be-a-hero-atari-st-screenshot.png \\',
        '      -c:v libx264 -t 7 -pix_fmt yuv420p  \\',
        '      basic-background-movie-test.mp4'
      ]
    }
  },
  {
    name: 'JPEG',
    opts: {
      imageFilePath:
        'tests/fixtures/surfaces/621936-hatoful-boyfriend-windows-screenshot-feeling-sick.jpg',
      duration: 3,
      outputFile: 'jpeg-background-movie-test.mp4',
      width: 640,
      height: 500
    },
    expected: {
      cmdLines: [
        'ffmpeg -loop 1 -i tests/fixtures/surfaces/621936-hatoful-boyfriend-windows-screenshot-feeling-sick.jpg \\',
        '      -c:v libx264 -t 3 -pix_fmt yuv420p -s 640x500 \\',
        '      jpeg-background-movie-test.mp4'
      ]
    }
  }
];

testCases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, makeBGCmdTest);

  function makeBGCmdTest(t) {
    var command = makeBackgroundMovieCmd(testCase.opts);
    console.log(command);
    var cmdLines = command.split('\n');
    for (var i = 0; i < testCase.expected.cmdLines.length; ++i) {
      t.equal(
        cmdLines[i],
        testCase.expected.cmdLines[i],
        'Command line ' + i + ' is correct.'
      );
    }
    rimraf.sync(testCase.opts.outputFile);
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
