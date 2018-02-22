var probable = require('probable');

var clicksTable = probable.createTableFromSizes([
  [8, 1],
  [4, 2],
  [2, 3],
  [1, 10]
]);

function makeRandomClickScript({ pointsOfInterest }) {
  var steps = [];
  pointsOfInterest.forEach(addStepsToPoint);
  return steps;

  function addStepsToPoint(point, i) {
    if (i === 0) {
      steps.push({
        action: 'move',
        coord: point
      });
    } else {
      if (probable.roll(4) === 0) {
        steps.push(getPause({ length: probable.rollDie(3) }));
      }
      steps.push({
        action: 'move',
        coord: point
      });
    }
    if (probable.roll(8) === 0) {
      steps.push(getPause({ length: probable.rollDie(2) }));
    }
    addClicks({ numberOfClicks: clicksTable.roll() });
    if (probable.roll(10) === 0) {
      addClicks({ length: probable.rollDie(3) });
      addClicks({ numberOfClicks: clicksTable.roll() });
    }
  }

  function getPause({ length }) {
    return {
      action: 'cursor-inactive',
      length
    };
  }

  function addClicks({ numberOfClicks }) {
    for (var i = 0; i < numberOfClicks; ++i) {
      steps.push({ action: 'cursor-active' });
      steps.push({ action: 'cursor-inactive' });
    }
  }
}

module.exports = makeRandomClickScript;
