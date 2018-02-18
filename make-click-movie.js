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
  var travelVector = math2d.subtractPairs(clickCoords[0], startCoord);
  var distance = math2d.getVectorMagnitude(travelVector);
  var travelTime = distance / pixelsToMovePerSecond;
  var overlayClauses = `overlay=x=${startCoord[0]}+t/${travelTime}*${
    travelVector[0]
  }:y=${startCoord[1]}+t/${travelTime}*${travelVector[1]}:enable='between(t,0,${
    travelTime
  })'`;
  return `ffmpeg -i ${backgroundMovieFile} -i ${cursorImageFile} \\
    -filter_complex "[0:v][1:v] \\
    ${overlayClauses}" \\
    -pix_fmt yuv420p -c:a copy \\
    ${outputFile}`;
}

module.exports = makeClickMovie;
