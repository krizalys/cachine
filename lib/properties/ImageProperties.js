class ImageProperties
{
    /**
     * @param Number width
     * @param Number height
     */
    constructor(width, height)
    {
        this.width  = width;
        this.height = height;
    }

    /**
     * @param Number width
     */
    set width(width)
    {
        this._width = Number(width);
    }

    /**
     * @return Number
     */
    get width()
    {
        return this._width;
    }

    /**
     * @param Number height
     */
    set height(height)
    {
        this._height = Number(height);
    }

    /**
     * @return Number
     */
    get height()
    {
        return this._height;
    }
}

module.exports = ImageProperties;
