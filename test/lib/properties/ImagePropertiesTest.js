const rootdir = "../../..";
const expect  = require("chai").expect;

describe("ImageProperties", () => {
    describe("#constructor()", () => {
        it("should set its instance's width", () => {
            const ImageProperties = require(`${rootdir}/lib/properties/ImageProperties`);
            const properties      = new ImageProperties(12, 34);
            expect(properties.width).to.equal(12);
        });

        it("should set its instance's height", () => {
            const ImageProperties = require(`${rootdir}/lib/properties/ImageProperties`);
            const properties      = new ImageProperties(12, 34);
            expect(properties.height).to.equal(34);
        });
    });

    describe("#width", () => {
        it("should set its instance's width", () => {
            const ImageProperties = require(`${rootdir}/lib/properties/ImageProperties`);
            const properties      = new ImageProperties(12, 34);
            properties.width      = 56;
            expect(properties.width).to.equal(56);
        });

        it("should get its instance's width", () => {
            const ImageProperties = require(`${rootdir}/lib/properties/ImageProperties`);
            const properties      = new ImageProperties(12, 34);
            expect(properties.width).to.equal(12);
        });
    });

    describe("#height", () => {
        it("should set its instance's height", () => {
            const ImageProperties = require(`${rootdir}/lib/properties/ImageProperties`);
            const properties      = new ImageProperties(12, 34);
            properties.height     = 56;
            expect(properties.height).to.equal(56);
        });

        it("should get its instance's height", () => {
            const ImageProperties = require(`${rootdir}/lib/properties/ImageProperties`);
            const properties      = new ImageProperties(12, 34);
            expect(properties.height).to.equal(34);
        });
    });
});
