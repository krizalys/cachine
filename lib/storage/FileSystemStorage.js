const fs   = require("fs");
const path = require("path");

class FileSystemStorage
{
    /**
     * @param String basedir
     */
    constructor(basedir)
    {
        this.basedir = basedir;
    }

    /**
     * @param String filename
     * @param Date   atime
     * @param Date   mtime
     */
    futimesSync(filename, atime, mtime)
    {
        filename = path.join(this.basedir, filename);
        const fd = fs.openSync(filename, "r");
        fs.futimesSync(fd, atime, mtime);
    }

    /**
     * @param String filename
     *
     * @return Promise
     */
    stat(filename)
    {
        filename = path.join(this.basedir, filename);

        return new Promise((resolve, reject) => {
            fs.stat(filename, (error, stats) => {
                if (error) {
                    error.storage = this;
                    return reject(error);
                }

                resolve({
                    mtime: stats.mtime,
                });
            });
        });
    }

    /**
     * @param String filename
     *
     * @return Promise
     */
    createReadStream(filename)
    {
        filename     = path.join(this.basedir, filename);
        const stream = fs.createReadStream(filename);
        return Promise.resolve(stream);
    }

    /**
     * @param String filename
     *
     * @return Stream
     */
    createWriteStream(filename)
    {
        filename   = path.join(this.basedir, filename);
        const base = path.dirname(filename);
        fs.mkdirSync(base);
        return fs.createWriteStream(filename);
    }
}

module.exports = FileSystemStorage;
