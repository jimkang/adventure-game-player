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
    let { clause, travelTime } = getMovementOverlayClause({
      beginCoord,
      endCoord: clickCoords[i],
      index: i,
      nextIndex,
      startTime: nextStepStartTime
    });
    nextStepStartTime += travelTime;
    overlayClauses.push(clause);
  }

  return `ffmpeg -i ${backgroundMovieFile} -i ${cursorImageFile} \\
    -filter_complex "[0:v][1:v] \\
    ${overlayClauses.join('; \\\n')}" \\
    -pix_fmt yuv420p -c:a copy \\
    ${outputFile}`;

  function getMovementOverlayClause({
    beginCoord,
    endCoord,
    index,
    nextIndex,
    startTime
  }) {
    var travelVector = math2d.subtractPairs(endCoord, beginCoord);
    var distance = math2d.getVectorMagnitude(travelVector);
    var travelTime = distance / pixelsToMovePerSecond;
    var clause = `overlay=x=${beginCoord[0]}+(t-${startTime})/${travelTime}*${
      travelVector[0]
    }:y=${beginCoord[1]}+(t-${startTime})/${travelTime}*${
      travelVector[1]
    }:enable='between(t,${startTime},${startTime + travelTime})'`;

    if (index > 0) {
      clause = `[step${index}][1:v] ${clause}`;
    }
    if (nextIndex) {
      clause += ` [step${nextIndex}]`;
    }
    return { clause, travelTime };
  }
}

module.exports = makeClickMovie;
