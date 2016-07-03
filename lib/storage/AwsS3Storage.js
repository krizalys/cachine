const awsSdk = require("aws-sdk");
const path   = require("path");
const http   = require("http");
const stream = require("stream");

class AwsS3Storage
{
    /**
     * @param String basedir
     * @param String accessKeyId
     * @param String secretAccessKey
     * @param String bucket
     * @param String region          See http://docs.aws.amazon.com/general/latest/gr/rande.html
     *                               for the list of regions currently supported.
     * @param Object options         Optional.
     */
    constructor(basedir, accessKeyId, secretAccessKey, bucket, region, readStrategy, options)
    {
        if (typeof options == "undefined") {
            options = {};
        }

        if (typeof region == "undefined") {
            region = "us-east-1";
        }

        if (typeof readStrategy == "undefined") {
            readStrategy = AwsS3Storage.DefaultReadStrategy;
        }

        options = Object.assign({
            accessKeyId:     accessKeyId,
            secretAccessKey: secretAccessKey,
            region:          region,
        }, options);

        this.basedir      = basedir;
        this.s3           = new awsSdk.S3(options);
        this.region       = region;
        this.bucket       = bucket;
        this.readStrategy = readStrategy;
    }

    /**
     */
    futimesSync()
    {
    }

    /**
     * @param String filename
     *
     * @return Promise
     */
    stat(filename)
    {
        return this
            .readStrategy
            .stat(this, filename);
    }

    /**
     * @param String filename
     *
     * @return Promise
     */
    createReadStream(filename)
    {
        return this
            .readStrategy
            .createReadStream(this, filename);
    }

    /**
     * @param String filename
     *
     * @return Stream
     */
    createWriteStream(filename)
    {
        const result = new stream.PassThrough();
        filename     = path.join(this.basedir, filename);

        // Remove the leading slash, it is not needed by S3.
        filename = filename.replace(/^\//, "");

        this
            .s3
            .upload({
                Bucket: this.bucket,
                Key:    filename,
                Body:   result,
            })
            .send();

        return result;
    }
}

AwsS3Storage.DefaultReadStrategy = {
    /**
     * @param AwsStorage storage
     * @param String     filename
     *
     * @return Promise
     */
    stat: function (storage, filename) {
        filename = path.join(storage.basedir, filename);
        filename = filename.replace(/^\//, "");

        return new Promise((resolve, reject) => {
            storage
                .s3
                .headObject({
                    Bucket: storage.bucket,
                    Key:    filename,
                }, (error, data) => {
                    if (error) {
                        error.storage = storage;
                        return reject(error);
                    }

                    resolve({
                        mtime: new Date(data.LastModified),
                    });
                });
        });
    },

    /**
     * @param AwsS3Storage storage
     * @param String       filename
     *
     * @return Promise
     */
    createReadStream: function (storage, filename) {
        filename = path.join(storage.basedir, filename);

        // Remove the leading slash, it is not needed by S3.
        filename = filename.replace(/^\//, "");

        const result = storage
            .s3
            .getObject({
                Bucket: storage.bucket,
                Key:    filename,
            })
            .createReadStream();

        return Promise.resolve(result);
    },
};

AwsS3Storage.StaticHostingReadStrategy = {
    /**
     * @param AwsStorage storage
     * @param String     filename
     *
     * @return Promise
     */
    stat: function (storage, filename) {
        filename = path.join(storage.basedir, filename);

        // Normalize the path.
        if (filename.charAt(0) != "/") {
            filename = `/${filename}`;
        }

        const request = http.request({
            hostname: `${storage.bucket}.s3-website.${storage.region}.amazonaws.com`,
            path:     filename,
            method:   "HEAD",
        });

        return new Promise((resolve, reject) => {
            request.on("error", error => {
                reject(error);
            });

            request.on("response", response => {
                const headers = response.headers;

                if (!("last-modified" in headers)) {
                    const error   = new Error("Header \"Last-Modified\" not found in response");
                    error.storage = storage;
                    return reject(error);
                }

                resolve({
                    mtime: new Date(headers["last-modified"]),
                });
            });

            request.end();
        });
    },

    /**
     * @param AwsS3Storage storage
     * @param String       filename
     *
     * @return Promise
     */
    createReadStream: function (storage, filename) {
        filename = path.join(storage.basedir, filename);

        // Normalize the path.
        if (filename.charAt(0) != "/") {
            filename = `/${filename}`;
        }

        const request = http.request({
            hostname: `${storage.bucket}.s3-website.${storage.region}.amazonaws.com`,
            path:     filename,
        });

        return new Promise((resolve, reject) => {
            request.on("error", error => {
                error.storage = storage;
                reject(error);
            });

            request.on("response", response => {
                resolve(response);
            });

            request.end();
        });
    },
};

module.exports = AwsS3Storage;
