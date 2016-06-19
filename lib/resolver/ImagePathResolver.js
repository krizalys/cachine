const path = require("path");

class ImagePathResolver
{
    /**
     * @param String     filename
     * @param Properties properties
     *
     * @return String
     */
    resolve(filename, properties)
    {
        return path.join(`/${properties.width}x${properties.height}`, filename);
    }
}

module.exports = ImagePathResolver;
