/**
 * The implementation of the log cache.
 * It has to be in a separate file so that a cache can be used by 
 * different components.
 * 
 * It's just a linked list because that's easy to implement and
 * also performant when writing.
 */


const caches = {};



/**
 * Creates a new cache with a given size
 * @param {string} name The name of the cache 
 * @param {number} size The maximum amount of logs to keep
 */
function initCache(name, size) {
    const cache = new Cache(size);
    caches[name] = cache;
    return cache;
}

/**
 * Returns a cache that has previously been initialized, or undefined
 * @param {*} name The name of the cache.
 */
function getCache(name) {
    return caches[name];
}

/**
 * Deletes most internal references to be sure garbage collection works
 * as intende. Using the cache will still be safe, it will just not return
 * any items.
 * @param {*} name The name of the cache to delete
 */
function deleteCache(name) {
    const cache = caches[name];
    cache.clear();
    delete cache[name];
}

/**
 * It's a linked list.
 */
class Cache {
    constructor(size) {
        this.maxSize = size;
        this.size = 0;
        this.first = undefined;
        this.last = undefined;
    }

    /**
     * Gets the most recent logs from the cahce
     * @param {number} amount The amount of logs to get
     */
    *get(amount) {
        for (const log of this.getAll()) {
            if (amount <= 0)
                return;
            
            yield log;
            amount--;   
        }
    }

    /**
     * Gets all logs from the cache.
     * As This method is a generator, it won't return the logs
     * until actually used and can therfore be used for filtering.
     */
    *getAll() {
        let current = this.first;
        while (typeof current !== 'undefined') {
            yield current.log;
            current = current.next;
        }
    }

    /**
     * Adds a log to the cache
     * @param {*} log The log to add. Can be anything.
     */
    add(log) {
        // Create new node
        const node = {
            log,
            next: this.first
        };

        // Update first
        if (typeof this.first !== 'undefined')
            this.first.prev = node;
        this.first = node;

        // Update last
        if (typeof this.last === 'undefined')
            this.last = node;
        if (this.size >= this.maxSize) {
            this.last = this.last.prev;
            delete this.last.next;
        }
        else {
            this.size++;
        }
    }

    /**
     * Clears all items from the cache.
     */
    clear() {
        let current = this.first;
        while (typeof current !== 'undefined') {
            const next = current.next;
            delete current.next;
            delete current.prev;
            delete current.log;
            current = next;
        }
        delete this.first;
        delete this.last;
    }
}

module.exports.initCache = initCache;
module.exports.getCache = getCache;
module.exports.deleteCache = deleteCache;
