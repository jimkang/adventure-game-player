function makeBackgroundMovieCmd({ imageFilePath, duration, outputFile }) {
  return `ffmpeg -loop 1 -i ${imageFilePath} \\
      -c:v libx264 -t ${duration} -pix_fmt yuv420p \\
      ${outputFile}`;
}

module.exports = makeBackgroundMovieCmd;
