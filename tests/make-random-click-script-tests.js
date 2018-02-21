var test = require('tape');
var assertNoError = require('assert-no-error');
var makeRandomClickScript = require('../make-random-click-script');
var makeClickMovieCmd = require('../make-click-movie-cmd');
var { exec } = require('child_process');

var testCases = [
  {
    name: 'Three points',
    opts: {
      imageFilePath:
        'tests/fixtures/surfaces/305286-hero-s-quest-so-you-want-to-be-a-hero-atari-st-screenshot.png',
      startCoord: [0, 200],
      pointsOfInterest: [[190, 100], [83, 41], [20, 150]]
    }
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

    var command = makeClickMovieCmd({
      startCoord: testCase.opts.startCoord,
      mouseSteps: steps,
      backgroundMovieFile,
      cursorImageFile: 'static/basic-pointer.png',
      activeCursorImageFile: 'static/basic-pointer-negative.png',
      outputFile: baseFilename + '-test.mp4'
    });
    console.log(command.cmd); // console.log('duration', command.duration);
    t.ok(
      Math.abs(command.duration - testCase.expected.duration) < 0.001,
      'Duration is correct.'
    );

    // TODO: Write the function that generates backgroundMovie from
    // an image THEN run this command.
    exec(command.cmd, checkCommandResult);

    function checkCommandResult(error) {
      assertNoError(t.ok, error, 'No error when running command');
      console.log(
        'Check',
        testCase.opts.outputFile,
        'to make sure the video follows the script.'
      );
      t.end();
    }
  }
}
