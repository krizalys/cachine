const dirname = require("path").dirname;
const fs      = require("fs");
const join    = require("path").join;

class FileSystemStorage
{
    /**
     * @param String basedir
     */
    constructor(basedir)
    {
        this.basedir = basedir;
    }

    futimesSync(path, atime, mtime)
    {
        path     = join(this.basedir, path);
        const fd = fs.openSync(path, "r");
        fs.futimesSync(fd, atime, mtime);
    }

    /**
     * @param String path
     *
     * @return Promise
     */
    stat(path)
    {
        path = join(this.basedir, path);

        return new Promise((resolve, reject) => {
            fs.stat(path, (error, stats) => {
                if (error) {
                    error.store = this;
                    return reject(error);
                }

                resolve({
                    mtime: stats.mtime,
                });
            });
        });
    }

    /**
     * @param String path
     *
     * @return Stream
     */
    createReadStream(path)
    {
        path = join(this.basedir, path);
        return fs.createReadStream(path);
    }

    /**
     * @param String path
     *
     * @return Stream
     */
    createWriteStream(path)
    {
        path           = join(this.basedir, path);
        const pathBase = dirname(path);
        fs.mkdirSync(pathBase);
        return fs.createWriteStream(path);
    }
}

module.exports = FileSystemStorage;
