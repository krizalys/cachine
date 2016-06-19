const rootdir = "../../..";
const expect  = require("chai").expect;
const path    = require("path");
const sinon   = require("sinon");

describe("ImagePathResolver", () => {
    before(() => {
        sinon.stub(path, "join", (segment1, segment2) => `${segment1}${segment2}`);
    });

    after(() => {
        path.join.restore();
    });

    describe("#resolve()", () => {
        function stubProperties()
        {
            return {
                width:  12,
                height: 34,
            };
        }

        it("should return the expected value", () => {
            const ImagePathResolver = require(`${rootdir}/lib/resolver/ImagePathResolver`);
            const resolver          = new ImagePathResolver();
            const properties        = stubProperties();
            const actual            = resolver.resolve("/path/to/image/resource", properties);
            expect(actual).to.equal("/12x34/path/to/image/resource");
        });
    });
});
