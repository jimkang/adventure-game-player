function makeBackgroundMovieCmd({
  imageFilePath,
  duration,
  outputFile,
  width,
  height
}) {
  var sizeSwitch = '';
  if (width && height) {
    sizeSwitch = '-s ' + width + 'x' + height;
  }
  return `ffmpeg -loop 1 -i ${imageFilePath} \\
      -c:v libx264 -t ${duration} -pix_fmt yuv420p ${sizeSwitch} \\
      ${outputFile}`;
}

module.exports = makeBackgroundMovieCmd;
