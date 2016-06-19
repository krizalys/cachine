const rootdir      = "../..";
const chai         = require("chai");
const EventEmitter = require("events");
const withData     = require("leche").withData;
const sinon        = require("sinon");
const sinonChai    = require("sinon-chai");
const expect       = chai.expect;
chai.use(sinonChai);

describe("Cachine", () => {
    describe("#request()", () => {
        const origin = {
            "/path/to/resource/with/fresh/cache": {
                mtime: new Date("1979-09-12Z"),
            },

            "/path/to/resource/with/stale/cache": {
                mtime: new Date("1982-05-01Z"),
            },

            "/path/to/resource/without/cache": {
                mtime: new Date("2016-09-15Z"),
            },
        };

        const cache = {
            "/12x34/path/to/resource/with/fresh/cache": {
                mtime:  new Date("1979-09-12Z"),
                stream: "Stubbed cached stream",
            },

            "/12x34/path/to/resource/with/stale/cache": {
                mtime:  new Date("1982-04-30T23:59:59Z"),
                stream: "Stubbed cached stream",
            },
        };

        class Store
        {
            constructor(resources)
            {
                this.resources = resources;
            }

            futimesSync()
            {
            }

            stat(filename)
            {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        if (filename in this.resources) {
                            return resolve({
                                mtime: this.resources[filename].mtime,
                            });
                        }

                        const error      = new Error(`${filename} is not in resources`);
                        error.isNotFound = true;
                        error.storage    = this;
                        reject(error);
                    }, 0);
                });
            }

            createReadStream(filename)
            {
                return new Promise(resolve => {
                    setTimeout(() => {
                        if (!(filename in this.resources)) {
                            return setTimeout(() => {
                                const error      = new Error(`${filename} is not in resources`);
                                error.isNotFound = true;
                                stream.emit("error", error);
                            });
                        }

                        const stream = new EventEmitter();

                        setTimeout(() => {
                            stream.emit("data", "Stubbed stream");
                            stream.emit("end");
                        }, 0);

                        stream.pipe = () => {
                            const stream = new EventEmitter();

                            setTimeout(() => {
                                stream.emit("data", "Stubbed processed stream");
                                stream.emit("end");
                            }, 0);

                            return stream;
                        };

                        resolve(stream);
                    }, 0);
                });
            }

            createWriteStream()
            {
                const stream = new EventEmitter();
                stream.write = sinon.spy();
                stream.end   = sinon.spy();
                return stream;
            }
        }

        const storeOrigin = new Store(origin);
        const storeCache  = new Store(cache);

        const resolver = {
            resolve: (path, properties) => {
                const join = require("path").join;
                return join(`/${properties.width}x${properties.height}`, path);
            },
        };

        const cases = {
            "fresh cache, minMtime == null, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: null},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.not.have.been.called;
                        done();
                    },
                ],
            ],

            "fresh cache, minMtime == mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("1979-09-12Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.not.have.been.called;
                        done();
                    },
                ],
            ],

            "fresh cache, minMtime < mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("1979-09-11T23:59:59Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.not.have.been.called;
                        done();
                    },
                ],
            ],

            "fresh cache, minMtime > mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("1979-09-12T00:00:01Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.not.have.been.called;
                        done();
                    },
                ],
            ],

            "fresh cache, minMtime == null, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: null},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "fresh cache, minMtime == mtime, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: new Date("1979-09-12Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "fresh cache, minMtime < mtime, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: new Date("1979-09-11T23:59:59Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "fresh cache, minMtime > mtime, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/fresh/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: new Date("1979-09-12T00:00:01Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1979-09-12Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime == null, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: null},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime == mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("1982-05-01Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime < mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("1982-04-30T23:59:59Z")},
                /* failOnError */ true,
                [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime > mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("1982-05-01T00:00:01Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime == null, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: null},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime == mtime, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: new Date("1982-05-01Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime < mtime, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: new Date("1982-04-30T23:59:59Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "stale cache, minMtime > mtime, properties != properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/with/stale/cache",
                /* properties */ {
                    width:  34,
                    height: 12,
                },
                /* predicates */ {minMtime: new Date("1982-05-01T00:00:01Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("1982-05-01Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "No cache, minMtime == null, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/without/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: null},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("2016-09-15Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "No cache, minMtime == mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/without/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("2016-09-15Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("2016-09-15Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "No cache, minMtime < mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/without/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("2016-09-14T23:59:59Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.false;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("2016-09-15Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("data", actual => {
                        expect(actual).to.equal("Stubbed processed stream");
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "No cache, minMtime > mtime, properties == properties": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/resource/without/cache",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date("2016-09-15T00:00:01Z")},
                /* failOnError */ true,
                /* callbacksEvent */ [
                    (output, done) => output.on("hit", actual => {
                        expect(actual).to.be.true;
                        done();
                    }),
                    (output, done) => output.on("meta", actual => {
                        const expected = {mtime: new Date("2016-09-15Z")};
                        expect(actual).to.deep.equal(expected);
                        done();
                    }),
                    (output, done) => output.on("end", done),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.have.been.called;
                        done();
                    },
                ],
            ],

            "Inexistent resource": [
                /* dependencies */ {
                    processor: {
                        process: sinon.spy(),
                    },
                },
                /* path */ "/path/to/inexistent/resource",
                /* properties */ {
                    width:  12,
                    height: 34,
                },
                /* predicates */ {minMtime: new Date()},
                /* failOnError */ false,
                /* callbacksEvent */ [
                    (output, done) => output.on("error", () => done()),
                ],
                /* callbacksDependency */ [
                    (dependencies, done) => {
                        expect(dependencies.processor.process).to.not.have.been.called;
                        done();
                    },
                ],
            ],
        };

        withData(cases, (dependencies, path, properties, predicates, failOnError, callbacksEvent, callbacksDependency) => {
            callbacksEvent.forEach(callback => {
                it("should emit the expected event with expected arguments", done => {
                    const Cachine = require(`${rootdir}/lib/Cachine`);

                    const cachine = new Cachine(
                        storeOrigin,
                        storeCache,
                        resolver,
                        dependencies.processor
                    );

                    const output = cachine.request(path, properties, predicates);

                    if (failOnError) {
                        output.on("error", error => {
                            expect.fail();
                            done(error);
                        });
                    }

                    callback(output, done);
                });
            });

            callbacksDependency.forEach(callback => {
                it("should maybe call Processor.process() with expected arguments", done => {
                    const Cachine = require(`${rootdir}/lib/Cachine`);

                    const cachine = new Cachine(
                        storeOrigin,
                        storeCache,
                        resolver,
                        dependencies.processor
                    );

                    const output = cachine.request(path, properties, predicates);

                    if (failOnError) {
                        output.on("error", error => {
                            expect.fail();
                            done(error);
                        });
                    }

                    callback(dependencies, done);
                });
            });
        });
    });
});
