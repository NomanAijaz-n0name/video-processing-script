const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Process command line arguments
const [node, script, inputFilename, startTimestamp, endTimestamp] = process.argv;

const inputFilePath = `./videos/${inputFilename}`

// Watermark file path
const watermarkFilePath = './watermark/watermark_file.png';
// Output GIF file path
const outputGifFilePath = './gif/output.gif';

// Check if input file exists
if (!fs.existsSync(inputFilePath)) {
    return console.error('Error: Input file does not exist.');
}

// Validate timestamps
const startTime = parseFloat(startTimestamp);
const endTime = parseFloat(endTimestamp);
if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
    return console.error('Error: Invalid or incorrectly ordered timestamps.');
}

// Resized watermark file path
const resizedWatermarkFilePath = './watermark/resized_watermark_file.png';

// Output file paths
const outputVideoFilePath = './output.mp4';

// Define watermark size
const watermarkSize = '100x50'; // Width x Height

// Resize the watermark image
ffmpeg()
  .input(watermarkFilePath)
  .output(resizedWatermarkFilePath)
  .size(watermarkSize) // Set the desired size
  .on('end', () => {
    console.log('Watermark image resized successfully');

    // Add resized watermark to the video
    ffmpeg(inputFilePath)
      .input(resizedWatermarkFilePath)
      .complexFilter([
        // Apply overlay filter to add resized watermark
        {
          filter: 'overlay',
          options: {
            // Position of the watermark (bottom-right corner with padding)
            x: 'main_w-overlay_w-10',
            y: 'main_h-overlay_h-10'
          }
        }
      ])
      .setStartTime(startTimestamp) // Set start time for video cut
      .duration(endTimestamp) // Set duration for video cut
      .output(outputVideoFilePath)
      .on('end', () => {
        console.log('Video cut successfully');

        // Convert the video segment to GIF with watermark
        ffmpeg(outputVideoFilePath)
          .complexFilter([
            {
              filter: 'overlay',
              options: {
                // Position of the watermark (bottom-right corner with padding)
                x: 'main_w-overlay_w-10',
                y: 'main_h-overlay_h-10'
              }
            }])
          .input(resizedWatermarkFilePath)
          .output(outputGifFilePath)
          .on('end', () => {
            console.log('GIF created successfully');

            // Remove the temporary resized watermark file
            fs.unlinkSync(resizedWatermarkFilePath);
            fs.unlinkSync(outputVideoFilePath);
          })
          .on('error', (err) => {
            console.error('Error creating GIF:', err);
          })
          .run();
      })
      .on('error', (err) => {
        console.error('Error cutting video:', err);
      })
      .run();
  })
  .on('error', (err) => {
    console.error('Error resizing watermark:', err);
  })
  .run();