const rootdir  = "../../..";
const Readable = require("stream").Readable;
const expect   = require("chai").expect;

describe("Cachine", () => {
    describe("#process()", () => {
        function stubProperties()
        {
            return {
                width:  12,
                height: 34,
            };
        }

        it("should return a stream.Readable instance", () => {
            const ImageMagickProcessor = require(`${rootdir}/lib/processor/ImageMagickProcessor`);
            const processor            = new ImageMagickProcessor();
            const properties           = stubProperties();
            const actual               = processor.process(properties);
            expect(actual).to.be.an.instanceof(Readable);
        });
    });
});
