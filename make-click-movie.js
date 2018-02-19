var math2d = require('basic-2d-math');
var { exec } = require('child_process');

function makeClickMovie(
  {
    startCoord,
    clickCoords,
    backgroundMovieFile,
    cursorImageFile,
    activeCursorImageFile,
    outputFile
  },
  done
) {
  var command = makeFfmpegCommandsForClickMovie({
    startCoord,
    clickCoords,
    backgroundMovieFile,
    cursorImageFile,
    activeCursorImageFile,
    outputFile
  });
  console.log(command);
  exec(command, done);
}

function makeFfmpegCommandsForClickMovie({
  startCoord,
  clickCoords,
  pixelsToMovePerSecond = 200,
  clicksPerPoint = 2,
  clickFlashOnLength = 0.2,
  clickFlashOffLength = 0.1,
  backgroundMovieFile,
  cursorImageFile,
  activeCursorImageFile,
  outputFile
}) {
  var overlayClauses = [];
  var nextStepStartTime = 0;

  for (var i = 0; i < clickCoords.length; ++i) {
    let beginCoord = startCoord;
    let nextIndex;
    if (i > 0) {
      beginCoord = clickCoords[i - 1];
    }
    if (i < clickCoords.length - 1) {
      nextIndex = i + 1;
    }
    let { clauses, elapsedTime } = getMovementOverlayClauses({
      beginCoord,
      endCoord: clickCoords[i],
      index: i,
      nextIndex,
      startTime: nextStepStartTime,
      pixelsToMovePerSecond,
      numberOfClicks: clicksPerPoint,
      clickFlashOnLength,
      clickFlashOffLength
    });
    nextStepStartTime += elapsedTime;
    overlayClauses = overlayClauses.concat(clauses);
  }

  return `ffmpeg -i ${backgroundMovieFile} -i ${cursorImageFile} -i ${
    activeCursorImageFile
  } \\
    -filter_complex "[0:v] \\
    ${overlayClauses.join('; \\\n')}" \\
    -pix_fmt yuv420p -c:a copy \\
    ${outputFile}`;
}

function getMovementOverlayClauses({
  beginCoord,
  endCoord,
  index,
  nextIndex,
  startTime,
  pixelsToMovePerSecond,
  numberOfClicks,
  clickFlashOnLength,
  clickFlashOffLength
}) {
  var travelVector = math2d.subtractPairs(endCoord, beginCoord);
  var distance = math2d.getVectorMagnitude(travelVector);
  var travelTime = distance / pixelsToMovePerSecond;
  var label = `step${index}`;
  var moveClause = `overlay=x=${beginCoord[0]}+(t-${startTime})/${travelTime}*${
    travelVector[0]
  }:y=${beginCoord[1]}+(t-${startTime})/${travelTime}*${
    travelVector[1]
  }:enable='between(t,${startTime},${startTime + travelTime})'`;

  if (index > 0) {
    moveClause = `[${label}][1:v] ${moveClause}`;
  }

  if (numberOfClicks < 1 && nextIndex) {
    moveClause += ` [step${nextIndex}]`;
  }

  var elapsedTime = travelTime;
  var clickClauses = [];

  // Add clauses for indicating clicks by alternating cursor image with active cursor image.
  for (var i = 0; i < numberOfClicks; ++i) {
    let clickActiveStepLabel = `${label}_click_active_${i}`;
    let clickNormalStepLabel = `${label}_click_inactive_${i}`;
    if (i === 0) {
      moveClause += `[${clickActiveStepLabel}]`;
    }

    let activeCursorClause = `[${clickActiveStepLabel}][2:v] overlay=x=${
      endCoord[0]
    }:y=${endCoord[1]}:enable='between(t,${startTime +
      elapsedTime},${startTime + elapsedTime + clickFlashOnLength})' [${
      clickNormalStepLabel
    }]`;

    elapsedTime += clickFlashOnLength;

    let normalCursorClause = `[${clickNormalStepLabel}][1:v] overlay=x=${
      endCoord[0]
    }:y=${endCoord[1]}:enable='between(t,${startTime +
      elapsedTime},${startTime + elapsedTime + clickFlashOffLength})'`;

    elapsedTime += clickFlashOffLength;

    if (i < numberOfClicks - 1) {
      normalCursorClause += ` [${label}_click_active_${i + 1}]`;
    } else if (nextIndex) {
      // The next clause to run after this last click clause will be
      // the next movement clause.
      normalCursorClause += ` [step${nextIndex}]`;
    }
    clickClauses.push(activeCursorClause);
    clickClauses.push(normalCursorClause);
  }

  return { clauses: [moveClause].concat(clickClauses), elapsedTime };
}

module.exports = makeClickMovie;
