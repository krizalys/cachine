const join = require("path").join;

class ImagePathResolver
{
    /**
     * @param String     path
     * @param Properties properties
     *
     * @return String
     */
    resolve(path, properties)
    {
        return join(`/${properties.width}x${properties.height}`, path);
    }
}

module.exports = ImagePathResolver;
