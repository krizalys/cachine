const imageMagick = require("imagemagick-native");

class ImageMagickProcessor
{
    /**
     * @param Properties properties
     *
     * @return Stream
     */
    process(properties)
    {
        return imageMagick.streams.convert({
            width:  properties.width,
            height: properties.height,
        });
    }
}

module.exports = ImageMagickProcessor;
