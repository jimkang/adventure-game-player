var math2d = require('basic-2d-math');

function makeClickMovieCmd({
  startCoord,
  mouseSteps, // See make-click-move-cmd-tests for format.
  pixelsToMovePerSecond = 200,
  clickFlashOnLength = 0.2,
  clickFlashOffLength = 0.1,
  backgroundMovieFile,
  cursorImageFile,
  activeCursorImageFile,
  outputFile
}) {
  var overlayClauseKits = [];
  var nextStepStartTime = 0;
  var lastPosition;

  for (var i = 0; i < mouseSteps.length; ++i) {
    let step = mouseSteps[i];
    let beginCoord = startCoord;
    if (i > 0) {
      beginCoord = lastPosition;
    }
    let clauseKit;
    if (step.action === 'move') {
      clauseKit = getMovementOverlayClause({
        beginCoord,
        endCoord: step.coord,
        startTime: nextStepStartTime,
        index: i,
        pixelsToMovePerSecond
      });
    } else if (
      step.action === 'cursor-active' ||
      step.action === 'cursor-inactive'
    ) {
      clauseKit = getClickOverlaySegmentClause({
        isActiveSegmentOfClick: step.action === 'cursor-active',
        coord: lastPosition,
        index: i,
        startTime: nextStepStartTime,
        lengthOfSegment:
          step.action === 'cursor-active'
            ? clickFlashOnLength
            : clickFlashOffLength
      });
    }
    lastPosition = clauseKit.endCoord;
    nextStepStartTime += clauseKit.elapsedTime;
    overlayClauseKits.push(clauseKit);
  }

  var overlayClauses = convertKitsIntoClauses(overlayClauseKits);

  return {
    cmd: `ffmpeg -i ${backgroundMovieFile} -i ${cursorImageFile} -i ${
      activeCursorImageFile
    } \\
      -filter_complex "[0:v] \\
      ${overlayClauses.join('; \\\n')}" \\
      -pix_fmt yuv420p -c:a copy \\
      ${outputFile}`,
    duration: nextStepStartTime
  };
}

function getMovementOverlayClause({
  beginCoord,
  endCoord,
  startTime,
  index,
  pixelsToMovePerSecond
}) {
  var travelVector = math2d.subtractPairs(endCoord, beginCoord);
  var distance = math2d.getVectorMagnitude(travelVector);
  var travelTime = distance / pixelsToMovePerSecond;
  var label = `step_${index}_move`;
  var clause = `[1:v] overlay=x=${beginCoord[0]}+(t-${startTime})/${
    travelTime
  }*${travelVector[0]}:y=${beginCoord[1]}+(t-${startTime})/${travelTime}*${
    travelVector[1]
  }:enable='between(t,${startTime},${startTime + travelTime})'`;

  return { label, clause, endCoord, elapsedTime: travelTime };
}

// Add clauses for indicating click by alternating cursor image with active cursor image.
function getClickOverlaySegmentClause({
  isActiveSegmentOfClick,
  coord,
  index,
  startTime,
  lengthOfSegment
}) {
  var streamNumber = 1;
  var subTypeForLabel = 'inactive';

  if (isActiveSegmentOfClick) {
    streamNumber = 2;
    subTypeForLabel = 'active';
  }

  return {
    label: `step_${index}_click_${subTypeForLabel}`,
    clause: `[${streamNumber}:v] overlay=x=${coord[0]}:y=${
      coord[1]
    }:enable='between(t,${startTime},${startTime + lengthOfSegment})'`,
    endCoord: coord,
    elapsedTime: lengthOfSegment
  };
}

function convertKitsIntoClauses(kits) {
  var clauses = [];
  for (var i = 0; i < kits.length; ++i) {
    let kit = kits[i];
    let clause = kit.clause;
    if (i < kits.length - 1) {
      // Append next label.
      clause += ` [${kits[i + 1].label}]`;
    }
    if (i > 0) {
      clause = `[${kit.label}] ` + clause;
    }
    clauses.push(clause);
  }
  return clauses;
}

module.exports = makeClickMovieCmd;
