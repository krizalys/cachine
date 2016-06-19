const rootdir           = "../../..";
const chai              = require("chai");
const chaiAsPromised    = require("chai-as-promised");
const fs                = require("fs");
const path              = require("path");
const sinon             = require("sinon");
const stream            = require("stream");
const FileSystemStorage = require(`${rootdir}/lib/storage/FileSystemStorage`);
const Readable          = stream.Readable;
const Writable          = stream.Writable;
const expect            = chai.expect;
chai.use(chaiAsPromised);

describe("FileSystemStorage", () => {
    before(() => {
        sinon.stub(fs, "mkdirSync");

        sinon.stub(fs, "stat").callsArgWith(1, null, {
            mtime: new Date("1982-01-05Z"),
        });

        sinon.stub(path, "join", (segment1, segment2) => `${segment1}${segment2}`);
    });

    after(() => {
        fs.mkdirSync.restore();
        fs.stat.restore();
        path.join.restore();
    });

    describe("#stat()", () => {
        it("should return a Promise instance", () => {
            const storage = new FileSystemStorage("/path/to/base");
            const actual  = storage.stat("/path/to/resource");
            expect(actual).to.be.a("Promise");
        });

        it("should fulfill the Promise instance", () => {
            const storage = new FileSystemStorage("/path/to/base");
            const actual  = storage.stat("/path/to/resource");
            return expect(actual).to.be.fulfilled;
        });
    });

    describe("#createReadStream()", () => {
        it("should return a Promise instance", () => {
            const storage = new FileSystemStorage("/path/to/base");
            const actual  = storage.createReadStream("/path/to/resource");
            expect(actual).to.be.a("Promise");
        });

        it("should fulfill the Promise instance", () => {
            const storage = new FileSystemStorage("/path/to/base");
            const actual  = storage.createReadStream("/path/to/resource");
            return expect(actual).to.be.fulfilled;
        });

        it("should resolve to a stream.Readable instance", () => {
            const storage = new FileSystemStorage("/path/to/base");
            const actual  = storage.createReadStream("/path/to/resource");
            return expect(actual).to.eventually.be.an.instanceof(Readable);
        });
    });

    describe("#createWriteStream()", () => {
        it("should return a stream.Writable instance", () => {
            const storage = new FileSystemStorage("/path/to/base");
            const actual  = storage.createWriteStream("/path/to/resource");
            expect(actual).to.be.an.instanceof(Writable);
        });
    });
});
