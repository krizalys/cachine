const rootdir        = "../../..";
const awsSdk         = require("aws-sdk");
const chai           = require("chai");
const chaiAsPromised = require("chai-as-promised");
const http           = require("http");
const path           = require("path");
const sinon          = require("sinon");
const sinonChai      = require("sinon-chai");
const Readable       = require("stream").Readable;
const expect         = chai.expect;
chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("AwsS3StaticHostingStorage", () => {
    before(() => {
        sinon.stub(path, "join", (segment1, segment2) => `${segment1}${segment2}`);

        sinon.stub(http, "request", options => {
            const request = new http.ClientRequest();
            sinon.stub(request, "end", () => request.emit("response", {}));
            return request;
        });
    });

    after(() => {
        path.join.restore();
        http.request.restore();
    });

    describe("#createReadStream()", () => {
        it("should return a Promise instance", () => {
            const AwsS3StaticHostingStorage = require(`${rootdir}/lib/storage/AwsS3StaticHostingStorage`);

            const storage = new AwsS3StaticHostingStorage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1"
            );

            const actual = storage.createReadStream("/path/to/resource");
            expect(actual).to.be.a("Promise");
        });

        it("should fulfill the Promise instance", () => {
            const AwsS3StaticHostingStorage = require(`${rootdir}/lib/storage/AwsS3StaticHostingStorage`);

            const storage = new AwsS3StaticHostingStorage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1"
            );

            const actual = storage.createReadStream("/path/to/resource");
            return expect(actual).to.be.fulfilled;
        });

        it("should call http.request() with expected arguments", () => {
            const AwsS3StaticHostingStorage = require(`${rootdir}/lib/storage/AwsS3StaticHostingStorage`);

            const storage = new AwsS3StaticHostingStorage(
                "/path/to/base",
                "TESTACCESSKEYID",
                "TestSecretAccessKey",
                "test-buck.et",
                "us-east-1"
            );

            return storage
                .createReadStream("/path/to/resource")
                .then(() => {
                    expect(http.request).to.have.been.calledWith({
                        hostname: "test-buck.et.s3-website-us-east-1.amazonaws.com",
                        path:     "/path/to/base/path/to/resource",
                    });
                });
        });
    });
});
