const rootdir        = "../../..";
const awsSdk         = require("aws-sdk");
const chai           = require("chai");
const chaiAsPromised = require("chai-as-promised");
const EventEmitter   = require("events");
const http           = require("http");
const withData       = require("leche").withData;
const path           = require("path");
const sinon          = require("sinon");
const sinonChai      = require("sinon-chai");
const stream         = require("stream");
const AwsS3Storage   = require(`${rootdir}/lib/storage/AwsS3Storage`);
const PassThrough    = stream.PassThrough;
const Readable       = stream.Readable;
const expect         = chai.expect;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("AwsS3Storage", () => {
    let createReadStream;
    let send;
    let headObject;
    let getObject;
    let upload;

    before(() => {
        sinon.stub(awsSdk, "S3", function () {
            this.headObject = headObject;
            this.getObject  = getObject;
            this.upload     = upload;
        });

        sinon.stub(http, "request", () => {
            const request = new EventEmitter();

            request.end = () => {
                setTimeout(() => {
                    request.emit("response", {
                        headers: {
                            "last-modified": "Sat, 01 May 1982 12:34:56 GMT",
                        },
                    });
                }, 0);
            };

            return request;
        });

        sinon.stub(path, "join", (segment1, segment2) => `${segment1}${segment2}`);
    });

    after(() => {
        awsSdk.S3.restore();
        http.request.restore();
        path.join.restore();
    });

    beforeEach(() => {
        const readable = new Readable();

        createReadStream = sinon
            .stub()
            .returns(readable);

        send = sinon.spy();

        headObject = sinon.stub().callsArgWith(1, null, {
            LastModified: "Sat, 01 May 1982 12:34:56 GMT",
        });

        getObject = sinon.stub().returns({
            createReadStream: createReadStream,
        });

        upload = sinon.stub().returns({
            send: send,
        });
    });

    describe("#stat()", () => {
        withData({
            "default read strategy": [
                /* readStrategy */ AwsS3Storage.DefaultReadStrategy,
            ],

            "static hosting read strategy": [
                /* readStrategy */ AwsS3Storage.StaticHostingReadStrategy,
            ],
        }, readStrategy => {
            it("should return a Promise instance", () => {
                const storage = new AwsS3Storage(
                    "/path/to/base",
                    "TESTACCESSKEYID",
                    "TestSecretAccessKey",
                    "test-buck.et",
                    "us-east-1",
                    readStrategy
                );

                const actual = storage.stat("/path/to/resource");
                expect(actual).to.be.a("Promise");
            });

            it("should fulfill the Promise instance", () => {
                const storage = new AwsS3Storage(
                    "/path/to/base",
                    "TESTACCESSKEYID",
                    "TestSecretAccessKey",
                    "test-buck.et",
                    "us-east-1",
                    readStrategy
                );

                const actual = storage.stat("/path/to/resource");
                return expect(actual).to.be.fulfilled;
            });
        });

        it("should call AWS.S3.headObject() with expected arguments when using the default read strategy", () => {
            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1",
                AwsS3Storage.DefaultReadStrategy
            );

            return storage
                .stat("/path/to/resource")
                .then(() => expect(headObject).to.have.been.calledWith({
                    Bucket: "test-buck.et",
                    Key:    "path/to/base/path/to/resource",
                }));
        });

        it("should call http.request() with expected arguments when using the static hosting read strategy", () => {
            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1",
                AwsS3Storage.StaticHostingReadStrategy
            );

            return storage
                .stat("/path/to/resource")
                .then(() => expect(http.request).to.have.been.calledWith({
                    hostname: "test-buck.et.s3-website-us-east-1.amazonaws.com",
                    path:     "/path/to/base/path/to/resource",
                    method:   "HEAD",
                }));
        });
    });

    describe("#createReadStream()", () => {
        withData({
            "default read strategy": [
                /* readStrategy */ AwsS3Storage.DefaultReadStrategy,
            ],

            "static hosting read strategy": [
                /* readStrategy */ AwsS3Storage.StaticHostingReadStrategy,
            ],
        }, readStrategy => {
            it("should return a Promise instance", () => {
                const storage = new AwsS3Storage(
                    "/path/to/base",
                    "TESTACCESSKEYID",
                    "TestSecretAccessKey",
                    "test-buck.et",
                    "us-east-1",
                    readStrategy
                );

                const actual = storage.createReadStream("/path/to/resource");
                expect(actual).to.be.a("Promise");
            });

            it("should fulfill the Promise instance", () => {
                const storage = new AwsS3Storage(
                    "/path/to/base",
                    "TESTACCESSKEYID",
                    "TestSecretAccessKey",
                    "test-buck.et",
                    "us-east-1",
                    readStrategy
                );

                const actual = storage.createReadStream("/path/to/resource");
                return expect(actual).to.be.fulfilled;
            });
        });

        it("should resolve to a stream.Readable instance when using the default strategy", () => {
            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1",
                AwsS3Storage.DefaultReadStrategy
            );

            const actual = storage.createReadStream("/path/to/resource");
            return expect(actual).to.eventually.be.an.instanceof(Readable);
        });

        it("should call AWS.S3.getObject() with expected arguments when using the default strategy", () => {
            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1",
                AwsS3Storage.DefaultReadStrategy
            );

            return storage
                .createReadStream("/path/to/resource")
                .then(() => expect(getObject).to.have.been.calledWith({
                    Bucket: "test-buck.et",
                    Key:    "path/to/base/path/to/resource",
                }));
        });

        it("should call AWS.Request.createReadStream() once when using the default strategy", () => {
            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1",
                AwsS3Storage.DefaultReadStrategy
            );

            return storage
                .createReadStream()
                .then(() => expect(createReadStream).to.have.been.calledOnce);
        });

        it("should call http.request() with expected arguments when using the static hosting strategy", () => {
            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1",
                AwsS3Storage.StaticHostingReadStrategy
            );

            return storage
                .createReadStream("/path/to/resource")
                .then(() => expect(http.request).to.have.been.calledWith({
                    hostname: "test-buck.et.s3-website-us-east-1.amazonaws.com",
                    path:     "/path/to/base/path/to/resource",
                }));
        });
    });

    describe("#createWriteStream()", () => {
        it("should return an instance of stream.PassThrough", () => {
            const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1",
                AwsS3Storage.DefaultReadStrategy
            );

            const actual = storage.createWriteStream("/path/to/resource");
            expect(actual).to.be.an.instanceof(PassThrough);
        });
    });
});
