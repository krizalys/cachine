const S3          = require("aws-sdk").S3;
const join        = require("path").join;
const PassThrough = require("stream").PassThrough;

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
    constructor(basedir, accessKeyId, secretAccessKey, bucket, region, options)
    {
        if (typeof options == "undefined") {
            options = {};
        }

        if (typeof region == "undefined") {
            region = "us-east-1";
        }

        options = Object.assign({
            accessKeyId:     accessKeyId,
            secretAccessKey: secretAccessKey,
            region:          region,
        }, options);

        this.basedir = basedir;
        this.s3      = new S3(options);
        this.region  = region;
        this.bucket  = bucket;
    }

    futimesSync()
    {
    }

    /**
     * @param String path
     *
     * @return Promise
     */
    stat(path)
    {
        path = join(this.basedir, path);
        path = path.replace(/^\//, "");

        return new Promise((resolve, reject) => {
            this
                .s3
                .headObject({
                    Bucket: this.bucket,
                    Key:    path,
                }, (error, data) => {
                    if (error) {
                        error.store = this;
                        return reject(error);
                    }

                    resolve({
                        mtime: new Date(data.LastModified),
                    });
                });
        });
    }

    /**
     * @param String path
     *
     * @return Promise
     */
    createReadStream(path)
    {
        path = join(this.basedir, path);

        // Remove the leading slash, it is not needed by S3.
        path = path.replace(/^\//, "");

        const stream = this
            .s3
            .getObject({
                Bucket: this.bucket,
                Key:    path,
            })
            .createReadStream();

        return Promise.resolve(stream);
    }

    /**
     * @param String path
     *
     * @return Stream
     */
    createWriteStream(path)
    {
        const stream = new PassThrough();
        path         = join(this.basedir, path);

        // Remove the leading slash, it is not needed by S3.
        path = path.replace(/^\//, "");

        this
            .s3
            .upload({
                Bucket: this.bucket,
                Key:    path,
                Body:   stream,
            })
            .send();

        return stream;
    }
}

module.exports = AwsS3Storage;
