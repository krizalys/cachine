const EventEmitter = require("events");

class Cachine
{
    /**
     * @param Storage   origin
     * @param Storage   cache
     * @param Resolver  resolver
     * @param Processor processor
     */
    constructor(origin, cache, resolver, processor)
    {
        this.origin    = origin;
        this.cache     = cache;
        this.resolver  = resolver;
        this.processor = processor;
    }

    /**
     * @param Date time
     * @param Date before
     *
     * @return Boolean
     */
    validateTimeBefore(time, before)
    {
        before = before.getTime();
        time   = time.getTime();
        before = before - before % 1000;
        time   = time - time % 1000;
        return time <= before;
    }

    cacheVariant(pathOriginal, pathCache, properties, mtime, output, valid)
    {
        const streamOriginal = this.origin.createReadStream(pathOriginal);
        const streamCache    = this.cache.createWriteStream(pathCache);
        const stream         = streamOriginal.pipe(this.processor.process(properties));

        stream.on("data", chunk => {
            if (!valid) {
                output.emit("data", chunk);
            }

            streamCache.write(chunk);
        });

        stream.on("end", () => {
            output.emit("end");
            streamCache.end();

            // TODO: async
            this.cache.futimesSync(pathCache, mtime, mtime);
        });
    }

    /**
     * @param String     path
     * @param Properties properties
     * @param Object     predicates
     *
     * @return An EventEmitter instance, emitting the following events:
     *   - "error" Emitted on error. An Error instance is passed as the first
     *             argument. No more events will be emitted on this EventEmitter
     *             instance.
     *   - "hit"   Emitted on caller cache validation. A Boolean is passed as
     *             the first argument to indicate whether the cache was hit.
     *   - "meta"  Emitted on meta information retrieval. Meta information is
     *             passed as a plain object as the first argument.
     *   - "data"  Optional. Emitted on data retrieval. A Buffer instance is
     *             passed as the first argument with the data chunk retrieved.
     *             This event is never emitted if the "hit" event was emitted
     *             with true passed as its first argument.
     *   - "end"   Emitted on end of resource processing.
     */
    request(path, properties, predicates)
    {
        const output    = new EventEmitter();
        const pathCache = this.resolver.resolve(path, properties);

        predicates = Object.assign({
            minMtime: null,
        }, predicates);

        Promise
            .all([
                this.origin.stat(path),
                this.cache.stat(pathCache),
            ])
            .then(results => {
                const statsOriginal = results[0];
                const statsCache    = results[1];
                const mtime         = statsOriginal.mtime;
                const minMtime      = predicates.minMtime;

                const valid = minMtime !== null ?
                    this.validateTimeBefore(mtime, minMtime)
                    : false;

                output.emit("hit", valid);

                const meta = {
                    mtime: mtime,
                };

                output.emit("meta", meta);

                const fresh = this.validateTimeBefore(mtime, statsCache.mtime);

                if (!fresh) {
                    this.cacheVariant(path, pathCache, properties, mtime, output, valid);
                } else {
                    const streamCache = this.cache.createReadStream(pathCache);

                    streamCache.on("data", chunk => {
                        if (!valid) {
                            output.emit("data", chunk);
                        }
                    });

                    streamCache.on("end", () => {
                        output.emit("end");
                    });
                }
            })
            .catch(error => {
                if (error.store == this.cache) {
                    // Assuming ENOENT
                    this
                        .origin
                        .stat(path)
                        .then(stats => {
                            const mtime    = stats.mtime;
                            const minMtime = predicates.minMtime;

                            const valid = minMtime !== null ?
                                this.validateTimeBefore(mtime, minMtime)
                                : false;

                            output.emit("hit", valid);

                            const meta = {
                                mtime: mtime,
                            };

                            output.emit("meta", meta);
                            this.cacheVariant(path, pathCache, properties, mtime, output, valid);
                        })
                        .catch(error => output.emit("error", error));
                } else {
                    output.emit("error", error);
                }
            });

        return output;
    }
}

module.exports = Cachine;
