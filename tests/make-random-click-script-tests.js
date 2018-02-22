var test = require('tape');
var assertNoError = require('assert-no-error');
var makeRandomClickScript = require('../make-random-click-script');
var makeClickMovieCmd = require('../make-click-movie-cmd');
var makeBackgroundMovieCmd = require('../make-background-movie-cmd');
var { exec } = require('child_process');
var rimraf = require('rimraf');
var probable = require('probable');

var testCases = [
  {
    name: 'Three points',
    startCoord: [0, 200],
    opts: {
      imageFilePath:
        'tests/fixtures/surfaces/305286-hero-s-quest-so-you-want-to-be-a-hero-atari-st-screenshot.png',
      pointsOfInterest: [[190, 100], [83, 41], [20, 150]]
    }
  },
  {
    name: 'Seven random points',
    startCoord: [probable.roll(640), probable.roll(500)],
    opts: {
      imageFilePath:
        'tests/fixtures/surfaces/621936-hatoful-boyfriend-windows-screenshot-feeling-sick.jpg',
      pointsOfInterest: [0, 1, 2, 3, 4, 5, 6].map(() => [
        probable.roll(640),
        probable.roll(500)
      ])
    },
    backgroundWidth: 640,
    backgroundHeight: 500
  }
];

testCases.forEach(runTest);

function runTest(testCase) {
  test(testCase.name, makeRandomScriptTest);

  function makeRandomScriptTest(t) {
    var steps = makeRandomClickScript(testCase.opts);

    t.ok(
      steps.filter(step => step.action === 'move').length > 0,
      'There is at least one move.'
    );
    t.ok(
      steps.filter(step => step.action === 'cursor-active').length > 0,
      'There is at least one active part of a click.'
    );
    console.log('Script steps:', steps);

    var baseFilename = testCase.name.replace(/ /g, '-');
    var backgroundMovieFile = baseFilename + '-background.mp4';
    var outputFile = baseFilename + '-test.mp4';
    rimraf.sync(backgroundMovieFile);
    rimraf.sync(outputFile);

    var command = makeClickMovieCmd({
      startCoord: testCase.startCoord,
      mouseSteps: steps,
      backgroundMovieFile,
      cursorImageFile: 'static/basic-pointer.png',
      activeCursorImageFile: 'static/basic-pointer-negative.png',
      outputFile
    });
    console.log(command); // console.log('duration', command.duration);

    var bgMovieCmd = makeBackgroundMovieCmd({
      imageFilePath: testCase.opts.imageFilePath,
      duration: command.duration,
      outputFile: backgroundMovieFile,
      width: testCase.backgroundWidth,
      height: testCase.backgroundHeight
    });
    exec(bgMovieCmd, checkBGCommandResult);

    function checkBGCommandResult(error) {
      assertNoError(
        t.ok,
        error,
        'No error when running command to create background movie.'
      );
      exec(command.cmd, checkCommandResult);
    }

    function checkCommandResult(error) {
      assertNoError(t.ok, error, 'No error when running command');
      console.log(
        'Check',
        outputFile,
        'to make sure the video follows the script.'
      );
      t.end();
    }
  }
}
