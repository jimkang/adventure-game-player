var makeClickMovie = require('../make-click-movie');

makeClickMovie({
  startCoord: [0, 200],
  clickCoords: [[500, 600], [300, 100], [50, 400]],
  backgroundMovieFile: 'bg-movie.mp4',
  cursorImageFile: 'static/basic-pointer.png',
  activeCursorImageFile: 'static/basic-pointer-negative.png',
  outputFile: 'make-click-test.mp4'
});
