var math2d = require('basic-2d-math');

function makeClickMovie(
  { startCoord, clickCoords, backgroundMovieFile, cursorImageFile, outputFile },
  done
) {
  var command = makeFfmpegCommandsForClickMovie({
    startCoord,
    clickCoords,
    backgroundMovieFile,
    cursorImageFile,
    outputFile
  });
  console.log(command);
}

function makeFfmpegCommandsForClickMovie({
  startCoord,
  clickCoords,
  pixelsToMovePerSecond = 200,
  clicksPerPoint = 3,
  clickFlashOnLength = 0.1,
  clickFlashOffLength = 0.1,
  backgroundMovieFile,
  cursorImageFile,
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

  return `ffmpeg -i ${backgroundMovieFile} -i ${cursorImageFile} \\
    -filter_complex "[0:v][1:v] \\
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

  // Add clauses for indicating clicks by flashing off and on for each click.
  for (var i = 0; i < numberOfClicks; ++i) {
    let clickStepLabel = `${label}_click_${i}`;
    if (i === 0) {
      moveClause += `[${clickStepLabel}]`;
    }
    elapsedTime += clickFlashOffLength;
    let clickClause = `[${clickStepLabel}][1:v] overlay=x=${endCoord[0]}:y=${
      endCoord[1]
    }:enable='between(t,${startTime + elapsedTime},${startTime +
      elapsedTime +
      clickFlashOnLength})'`;
    elapsedTime += clickFlashOnLength;
    if (i < numberOfClicks - 1) {
      clickClause += ` [${label}_click_${i + 1}]`;
    } else if (nextIndex) {
      // The next clause to run after this last click clause will be
      // the next movement clause.
      clickClause += ` [step${nextIndex}]`;
    }
    clickClauses.push(clickClause);
  }

  return { clauses: [moveClause].concat(clickClauses), elapsedTime };
}

module.exports = makeClickMovie;
