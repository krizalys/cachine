const rootdir  = "../../..";
const expect   = require("chai").expect;
const fs       = require("fs");
const path     = require("path");
const sinon    = require("sinon");
const stream   = require("stream");
const Readable = stream.Readable;
const Writable = stream.Writable;

describe("FileSystemStorage", () => {
    before(() => {
        sinon.stub(path, "join", (segment1, segment2) => `${segment1}${segment2}`);

        sinon.stub(fs, "stat").callsArgWith(1, null, {
            mtime: new Date("1982-01-05Z"),
        });

        sinon.stub(fs, "mkdirSync");
    });

    after(() => {
        path.join.restore();
        fs.stat.restore();
        fs.mkdirSync.restore();
    });

    describe("#stat()", () => {
        it("should return a Promise instance", () => {
            const FileSystemStorage = require(`${rootdir}/lib/storage/FileSystemStorage`);
            const storage           = new FileSystemStorage("/path/to/base");
            const actual            = storage.stat("/path/to/resource");
            expect(actual).to.be.a("Promise");
            return actual;
        });
    });

    describe("#createReadStream()", () => {
        it("should return a stream.Readable instance", () => {
            const FileSystemStorage = require(`${rootdir}/lib/storage/FileSystemStorage`);
            const storage           = new FileSystemStorage("/path/to/base");
            const actual            = storage.createReadStream("/path/to/resource");
            expect(actual).to.be.an.instanceof(Readable);
        });
    });

    describe("#createWriteStream()", () => {
        it("should return a stream.Writable instance", () => {
            const FileSystemStorage = require(`${rootdir}/lib/storage/FileSystemStorage`);
            const storage           = new FileSystemStorage("/path/to/base");
            const actual            = storage.createWriteStream("/path/to/resource");
            expect(actual).to.be.an.instanceof(Writable);
        });
    });
});
