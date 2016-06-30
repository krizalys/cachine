const rootdir      = "../..";
const http         = require("http");
const join         = require("path").join;
const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

class AwsS3StaticHostingStorage extends AwsS3Storage
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
        super(basedir, accessKeyId, secretAccessKey, bucket, region, options);
    }

    /**
     * @param String path
     *
     * @return Promise
     */
    createReadStream(path)
    {
        path = join(this.basedir, path);

        // Normalize the path.
        if (path.charAt(0) != "/") {
            path = `/${path}`;
        }

        const request = http.request({
            hostname: `${this.bucket}.s3-website-${this.region}.amazonaws.com`,
            path:     path,
        });

        return new Promise((resolve, reject) => {
            request.on("error", error => {
                reject(error);
            })

            request.on("response", response => {
                resolve(response);
            });

            request.end();
        });
    }
}

module.exports = AwsS3StaticHostingStorage;
