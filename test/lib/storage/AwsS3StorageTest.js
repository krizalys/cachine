const rootdir     = "../../..";
const awsSdk      = require("aws-sdk");
const chai        = require("chai");
const path        = require("path");
const sinon       = require("sinon");
const sinonChai   = require("sinon-chai");
const stream      = require("stream");
const PassThrough = stream.PassThrough;
const Readable    = stream.Readable;
const expect      = chai.expect;
chai.use(sinonChai);

describe("AwsS3Storage", () => {
    let createReadStream;
    let send;
    let headObject;
    let getObject;
    let upload;

    before(() => {
        sinon.stub(path, "join", (segment1, segment2) => `${segment1}${segment2}`);

        sinon.stub(awsSdk, "S3", function () {
            this.headObject = headObject;
            this.getObject  = getObject;
            this.upload     = upload;
        });
    });

    after(() => {
        path.join.restore();
        awsSdk.S3.restore();
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
        it("should return a Promise instance", () => {
            const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-bucket",
                "us-east-1"
            );

            const actual = storage.stat("/path/to/resource");
            expect(actual).to.be.a("Promise");
            return actual;
        });

        it("should call AWS.S3.headObject() with expected arguments", () => {
            const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-bucket",
                "us-east-1"
            );

            return storage
                .stat("/path/to/resource")
                .then(() => {
                    expect(headObject).to.have.been.calledWith({
                        Bucket: "test-bucket",
                        Key:    "path/to/base/path/to/resource",
                    });
                });
        });
    });

    describe("#createReadStream()", () => {
        it("should return a stream.Readable instance", () => {
            const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-bucket",
                "us-east-1"
            );

            const actual = storage.createReadStream("/path/to/resource");
            expect(actual).to.be.an.instanceof(Readable);
        });

        it("should call AWS.S3.getObject() with expected arguments", () => {
            const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-bucket",
                "us-east-1"
            );

            storage.createReadStream("/path/to/resource");

            expect(getObject).to.have.been.calledWith({
                Bucket: "test-bucket",
                Key:    "path/to/base/path/to/resource",
            });
        });

        it("should call AWS.Request.createReadStream() once", () => {
            const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-bucket",
                "us-east-1"
            );

            storage.createReadStream();
            expect(createReadStream).to.have.been.calledOnce;
        });
    });

    describe("#createWriteStream()", () => {
        it("should return an instance of stream.PassThrough", () => {
            const AwsS3Storage = require(`${rootdir}/lib/storage/AwsS3Storage`);

            const storage = new AwsS3Storage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-bucket",
                "us-east-1"
            );

            const actual = storage.createWriteStream("/path/to/resource");
            expect(actual).to.be.an.instanceof(PassThrough);
        });
    });
});
