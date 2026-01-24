import { DurableObject } from "cloudflare:workers";
var Scry = {};
var Cards = {};
var IScry = {};
var hasRequiredIScry;
function requireIScry() {
  if (hasRequiredIScry) return IScry;
  hasRequiredIScry = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.IScry = exports$1.SYMBOL_CARDS = exports$1.SYMBOL_PRINTS = exports$1.SYMBOL_RULINGS = exports$1.SYMBOL_SET = exports$1.SYMBOL_COST = exports$1.SYMBOL_TEXT = exports$1.RESOURCE_GENERIC_CARD_BACK = exports$1.ENDPOINT_FILE_3 = exports$1.ENDPOINT_FILE_2 = exports$1.ENDPOINT_FILE_1 = exports$1.ENDPOINT_API = void 0;
    exports$1.ENDPOINT_API = "https://api.scryfall.com";
    exports$1.ENDPOINT_FILE_1 = "https://cards.scryfall.io";
    exports$1.ENDPOINT_FILE_2 = "https://c2.scryfall.com/file";
    exports$1.ENDPOINT_FILE_3 = "https://c3.scryfall.com/file";
    exports$1.RESOURCE_GENERIC_CARD_BACK = `${exports$1.ENDPOINT_FILE_2}/scryfall-errors/missing.jpg`;
    exports$1.SYMBOL_TEXT = /* @__PURE__ */ Symbol("TEXT");
    exports$1.SYMBOL_COST = /* @__PURE__ */ Symbol("COST");
    exports$1.SYMBOL_SET = /* @__PURE__ */ Symbol("SET");
    exports$1.SYMBOL_RULINGS = /* @__PURE__ */ Symbol("RULINGS");
    exports$1.SYMBOL_PRINTS = /* @__PURE__ */ Symbol("PRINTS");
    exports$1.SYMBOL_CARDS = /* @__PURE__ */ Symbol("CARDS");
    var Colors;
    (function(Colors2) {
      Colors2[Colors2["W"] = 0] = "W";
      Colors2[Colors2["B"] = 1] = "B";
      Colors2[Colors2["R"] = 2] = "R";
      Colors2[Colors2["U"] = 3] = "U";
      Colors2[Colors2["G"] = 4] = "G";
    })(Colors || (Colors = {}));
    /* @__PURE__ */ (function(IScry2) {
    })(exports$1.IScry || (exports$1.IScry = {}));
  })(IScry);
  return IScry;
}
var Cached = {};
var hasRequiredCached;
function requireCached() {
  if (hasRequiredCached) return Cached;
  hasRequiredCached = 1;
  Object.defineProperty(Cached, "__esModule", { value: true });
  const MIN_CACHE_DURATION = 1e3 * 10;
  const DEFAULT_CACHE_DURATION = 1e3 * 60 * 60;
  let configuredCacheDuration = DEFAULT_CACHE_DURATION;
  const MIN_CACHE_LIMIT = 1;
  const DEFAULT_CACHE_LIMIT = 500;
  let configuredCacheLimit = DEFAULT_CACHE_LIMIT;
  let caches = [];
  function Cached$1(target, key, descriptor) {
    let topCache = { map: /* @__PURE__ */ new Map(), time: 0 };
    return {
      value(...args) {
        let cache = topCache;
        let shouldCache = false;
        if (configuredCacheDuration >= MIN_CACHE_DURATION && configuredCacheLimit >= MIN_CACHE_LIMIT) {
          let now = Date.now();
          for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            let nextCache = cache.map.get(arg);
            if (!nextCache) {
              nextCache = { key: arg, map: /* @__PURE__ */ new Map(), time: 0 };
              cache.map.set(arg, nextCache);
              nextCache.parent = cache;
            }
            cache = nextCache;
          }
          if (now - cache.time < configuredCacheDuration)
            return cache.value;
          cache.time = now;
          shouldCache = true;
        }
        const result = descriptor.value.apply(this, args);
        if (shouldCache) {
          cache.value = result;
          caches.push(cache);
          while (caches.length > configuredCacheLimit)
            deleteCacheValue(caches.shift());
          handleCacheGarbageCollection(false);
        }
        return result;
      }
    };
  }
  function deleteCacheValue(cache) {
    var _a;
    delete cache.value;
    if (cache.map.size === 0)
      (_a = cache.parent) === null || _a === void 0 ? void 0 : _a.map.delete(cache.key);
  }
  let garbageCollectionTimer;
  function handleCacheGarbageCollection(reset) {
    if (!reset && garbageCollectionTimer !== void 0)
      return;
    if (garbageCollectionTimer !== void 0 && reset)
      clearInterval(garbageCollectionTimer);
    if (configuredCacheDuration < MIN_CACHE_DURATION || configuredCacheLimit < MIN_CACHE_LIMIT) {
      caches.forEach(deleteCacheValue);
      caches = [];
      return;
    }
    garbageCollectionTimer = setInterval(() => {
      const now = Date.now();
      let newCaches = caches;
      for (let i = 0; i < caches.length; i++) {
        const cache = caches[i];
        if (now - cache.time > configuredCacheDuration) {
          deleteCacheValue(cache);
          newCaches = [];
        } else {
          if (i)
            newCaches = caches.slice(i);
          break;
        }
      }
      caches = newCaches;
      if (caches.length === 0 && garbageCollectionTimer !== void 0) {
        clearInterval(garbageCollectionTimer);
        garbageCollectionTimer = void 0;
      }
    }, Math.sqrt(configuredCacheDuration / 1e3) * 2e3);
  }
  (function(Cached2) {
    function getObjectsCount() {
      return caches.length;
    }
    Cached2.getObjectsCount = getObjectsCount;
    function isGarbageCollectorRunning() {
      return garbageCollectionTimer !== void 0;
    }
    Cached2.isGarbageCollectorRunning = isGarbageCollectorRunning;
    function clear() {
      caches.forEach(deleteCacheValue);
      caches = [];
    }
    Cached2.clear = clear;
    function resetCacheDuration() {
      setDuration(DEFAULT_CACHE_DURATION);
    }
    Cached2.resetCacheDuration = resetCacheDuration;
    function setDuration(ms) {
      if (configuredCacheDuration !== ms) {
        configuredCacheDuration = ms;
        handleCacheGarbageCollection(true);
      }
    }
    Cached2.setDuration = setDuration;
    function resetLimit() {
      setLimit(DEFAULT_CACHE_LIMIT);
    }
    Cached2.resetLimit = resetLimit;
    function setLimit(count) {
      configuredCacheLimit = count;
      while (caches.length > configuredCacheLimit)
        deleteCacheValue(caches.shift());
      handleCacheGarbageCollection(true);
    }
    Cached2.setLimit = setLimit;
  })(Cached$1 || (Cached$1 = {}));
  Cached.default = Cached$1;
  return Cached;
}
var MagicEmitter = {};
var EventEmitter = {};
var hasRequiredEventEmitter;
function requireEventEmitter() {
  if (hasRequiredEventEmitter) return EventEmitter;
  hasRequiredEventEmitter = 1;
  Object.defineProperty(EventEmitter, "__esModule", { value: true });
  const EMPTY = [];
  let EventEmitter$1 = class EventEmitter {
    constructor() {
      this._maxListeners = 10;
      this._listeners = {};
    }
    addListener(eventName, listener) {
      var _a;
      var _b;
      const listeners = (_a = (_b = this._listeners)[eventName]) !== null && _a !== void 0 ? _a : _b[eventName] = [];
      listeners.push(listener);
      if (listeners.length > this._maxListeners)
        console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${eventName.toString()} listeners added. Use emitter.setMaxListeners() to increase limit`);
      return this;
    }
    prependListener(eventName, listener) {
      var _a;
      var _b;
      const listeners = (_a = (_b = this._listeners)[eventName]) !== null && _a !== void 0 ? _a : _b[eventName] = [];
      listeners.unshift(listener);
      if (listeners.length > this._maxListeners)
        console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${eventName.toString()} listeners added. Use emitter.setMaxListeners() to increase limit`);
      return this;
    }
    removeListener(eventName, listener) {
      const listeners = this._listeners[eventName];
      if (listeners) {
        const index2 = listeners.indexOf(listener);
        if (index2 >= 0) {
          if (listeners.length === 1)
            delete this._listeners[eventName];
          else
            listeners.splice(index2, 1);
        }
      }
      return this;
    }
    on(eventName, listener) {
      this.addListener(eventName, listener);
      return this;
    }
    once(eventName, listener) {
      const realListener = (...args) => {
        this.removeListener(eventName, realListener);
        listener(...args);
      };
      this.addListener(eventName, realListener);
      return this;
    }
    prependOnceListener(eventName, listener) {
      const realListener = (...args) => {
        this.removeListener(eventName, realListener);
        listener(...args);
      };
      this.prependListener(eventName, realListener);
      return this;
    }
    off(eventName, listener) {
      this.removeListener(eventName, listener);
      return this;
    }
    removeAllListeners(event) {
      if (event !== void 0)
        delete this._listeners[event];
      return this;
    }
    emit(eventName, ...args) {
      if (this._listeners[eventName])
        for (const listener of this._listeners[eventName])
          listener(...args);
      return true;
    }
    setMaxListeners(n) {
      this._maxListeners = n;
      return this;
    }
    getMaxListeners() {
      return this._maxListeners;
    }
    listeners(eventName) {
      const listeners = this._listeners[eventName];
      return listeners ? [...listeners] : EMPTY;
    }
    rawListeners(eventName) {
      throw new Error("The rawListeners method is not available using this polyfill");
    }
    listenerCount(eventName) {
      var _a, _b;
      return (_b = (_a = this._listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
    }
    eventNames() {
      return Object.keys(this._listeners);
    }
  };
  EventEmitter.default = EventEmitter$1;
  return EventEmitter;
}
var hasRequiredMagicEmitter;
function requireMagicEmitter() {
  if (hasRequiredMagicEmitter) return MagicEmitter;
  hasRequiredMagicEmitter = 1;
  var __awaiter = MagicEmitter && MagicEmitter.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __await = MagicEmitter && MagicEmitter.__await || function(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
  };
  var __asyncGenerator = MagicEmitter && MagicEmitter.__asyncGenerator || function(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i;
    function verb(n) {
      if (g[n]) i[n] = function(v) {
        return new Promise(function(a, b) {
          q.push([n, v, a, b]) > 1 || resume(n, v);
        });
      };
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
  };
  Object.defineProperty(MagicEmitter, "__esModule", { value: true });
  const EventEmitter_1 = requireEventEmitter();
  let MagicEmitter$1 = class MagicEmitter extends EventEmitter_1.default {
    get ended() {
      return this._ended;
    }
    get cancelled() {
      return this._cancelled;
    }
    get willCancelAfterPage() {
      return this._willCancelAfterPage;
    }
    constructor() {
      super();
      this._ended = false;
      this._cancelled = false;
      this._willCancelAfterPage = false;
      this.mappers = [];
      this.on("end", () => {
        this._ended = true;
      });
      this.on("cancel", () => {
        this._ended = true;
      });
    }
    on(event, listener) {
      super.on(event, listener);
      return this;
    }
    emit(event, ...data) {
      if (event === "data")
        return super.emit(event, this.mappers.reduce((current, mapper) => mapper(current), data[0]));
      return super.emit(event, ...data);
    }
    emitAll(event, ...data) {
      for (const item of data) {
        super.emit(event, event !== "data" ? item : this.mappers.reduce((current, mapper) => mapper(current), item));
        if (this._cancelled)
          break;
      }
    }
    cancel() {
      this._cancelled = true;
      this.emit("cancel");
      return this;
    }
    cancelAfterPage() {
      this._willCancelAfterPage = true;
      return this;
    }
    waitForAll() {
      return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
          const results = [];
          results.not_found = [];
          this.on("data", (result) => {
            results.push(result);
          });
          this.on("not_found", (notFound) => {
            results.not_found.push(notFound);
          });
          this.on("done", () => resolve(results));
          this.on("error", reject);
        });
      });
    }
    [Symbol.asyncIterator]() {
      return this.generate("data");
    }
    all() {
      return this.generate("data");
    }
    notFound() {
      return this.generate("not_found");
    }
    map(mapper) {
      this.mappers.push(mapper);
      return this;
    }
    generate(event) {
      return __asyncGenerator(this, arguments, function* generate_1() {
        const unyielded = [];
        this.on(event, (data) => unyielded.push(data));
        while (!this._ended) {
          yield __await(new Promise((resolve) => this.once(event, resolve)));
          let data;
          while (data = unyielded.shift())
            yield yield __await(data);
        }
      });
    }
  };
  MagicEmitter.default = MagicEmitter$1;
  return MagicEmitter;
}
var MagicQuerier = {};
var hasRequiredMagicQuerier;
function requireMagicQuerier() {
  if (hasRequiredMagicQuerier) return MagicQuerier;
  hasRequiredMagicQuerier = 1;
  (function(exports$1) {
    var __awaiter = MagicQuerier && MagicQuerier.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.minimumRequestTimeout = exports$1.defaultRequestTimeout = void 0;
    const IScry_1 = requireIScry();
    let axios;
    if (typeof fetch === "undefined") {
      try {
        axios = require("axios").default;
      } catch (_a) {
        throw new Error("[scryfall-sdk] If the global `fetch` function is undefined (any node.js version older than v18), the axios peerDependency is required.");
      }
    }
    exports$1.defaultRequestTimeout = 100;
    exports$1.minimumRequestTimeout = 50;
    let lastQuery = 0;
    function sleep(ms = 0) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    let MagicQuerier$1 = class MagicQuerier2 {
      query(apiPath, query, post) {
        return __awaiter(this, void 0, void 0, function* () {
          if (Array.isArray(apiPath))
            apiPath = apiPath.join("/");
          let lastError;
          let result;
          let retries;
          for (retries = 0; retries < MagicQuerier2.retry.attempts; retries++) {
            ({ result, lastError } = yield this.tryQuery(`${apiPath}`, query, post));
            if (result || !this.canRetry(lastError) && !MagicQuerier2.retry.forced)
              break;
            yield sleep(MagicQuerier2.retry.timeout);
          }
          if (!result) {
            lastError !== null && lastError !== void 0 ? lastError : lastError = new Error("No data");
            lastError.attempts = retries;
            throw lastError;
          }
          return result;
        });
      }
      queryPage(emitter, apiPath, query, page) {
        var _a, _b;
        if (page === void 0) {
          page = (_a = query === null || query === void 0 ? void 0 : query.page) !== null && _a !== void 0 ? _a : 1;
        }
        return __awaiter(this, void 0, void 0, function* () {
          let error;
          const results = yield this.query(apiPath, Object.assign(Object.assign({}, query), { page })).catch((err) => error = err);
          const data = (_b = results === null || results === void 0 ? void 0 : results.data) !== null && _b !== void 0 ? _b : [];
          if ((results === null || results === void 0 ? void 0 : results.object) !== "list" && error === void 0) {
            emitter.emit("error", new Error("Result object is not a list"));
            return;
          }
          for (const card of data) {
            if (emitter.cancelled)
              break;
            emitter.emit("data", card);
          }
          if ((results === null || results === void 0 ? void 0 : results.has_more) && data.length !== 0) {
            if (!emitter.cancelled) {
              if (emitter.willCancelAfterPage)
                emitter.cancel();
              else
                return this.queryPage(emitter, apiPath, query, page + 1).catch((err) => {
                  emitter.emit("error", err);
                });
            }
          }
          if (!emitter.cancelled)
            emitter.emit("end");
          emitter.emit("done");
        });
      }
      tryQuery(apiPath, query, post) {
        return __awaiter(this, void 0, void 0, function* () {
          const now = Date.now();
          const timeSinceLastQuery = now - lastQuery;
          if (timeSinceLastQuery >= MagicQuerier2.timeout) {
            lastQuery = now;
          } else {
            const timeUntilNextQuery = MagicQuerier2.timeout - timeSinceLastQuery;
            lastQuery += timeUntilNextQuery;
            yield sleep(timeUntilNextQuery);
          }
          MagicQuerier2.requestCount++;
          if (axios)
            return this.queryAxios(apiPath, query, post);
          else
            return this.queryFetch(apiPath, query, post);
        });
      }
      queryFetch(apiPath, query, post) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          const cleanParams = {};
          for (const [key, value] of Object.entries(query !== null && query !== void 0 ? query : {}))
            if (value !== void 0)
              cleanParams[key] = value;
          const searchParams = query ? `?${new URLSearchParams(cleanParams).toString()}` : "";
          const url = `${IScry_1.ENDPOINT_API}/${apiPath}` + searchParams;
          let result = yield fetch(url, {
            body: JSON.stringify(post),
            headers: Object.assign(Object.assign({ "Content-Type": "application/json" }, !MagicQuerier2.agent ? void 0 : {
              "User-Agent": MagicQuerier2.agent
            }), { Accept: "*/*" }),
            method: post ? "POST" : "GET"
          });
          let lastError;
          if (result !== void 0 && !result.ok) {
            const error = yield result.json();
            lastError = new Error((_a = error.details) !== null && _a !== void 0 ? _a : error.code);
            Object.assign(lastError, error);
            result = void 0;
          }
          return { result: yield result === null || result === void 0 ? void 0 : result.json(), lastError };
        });
      }
      queryAxios(apiPath, query, post) {
        return __awaiter(this, void 0, void 0, function* () {
          let lastError;
          const result = (yield axios.request({
            data: post,
            method: post ? "POST" : "GET",
            params: query,
            url: `${IScry_1.ENDPOINT_API}/${apiPath}`
          }).catch(({ response }) => {
            var _a;
            const error = response.data;
            lastError = new Error((_a = error.details) !== null && _a !== void 0 ? _a : error.code);
            Object.assign(lastError, response.data);
          })) || void 0;
          return { result: result === null || result === void 0 ? void 0 : result.data, lastError };
        });
      }
      canRetry(error) {
        if (error.code === "not_found" || error.code === "bad_request")
          return false;
        return !MagicQuerier2.retry.canRetry || MagicQuerier2.retry.canRetry(error);
      }
    };
    exports$1.default = MagicQuerier$1;
    MagicQuerier$1.lastQuery = 0;
    MagicQuerier$1.retry = { attempts: 1 };
    MagicQuerier$1.timeout = exports$1.defaultRequestTimeout;
    MagicQuerier$1.requestCount = 0;
  })(MagicQuerier);
  return MagicQuerier;
}
var hasRequiredCards;
function requireCards() {
  if (hasRequiredCards) return Cards;
  hasRequiredCards = 1;
  (function(exports$1) {
    var __decorate = Cards && Cards.__decorate || function(decorators, target, key, desc) {
      var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
      if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
      else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
      return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __awaiter = Cards && Cards.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.Card = exports$1.CardIdentifier = exports$1.CardSecurityStamp = exports$1.CardStatus = exports$1.CardFrame = exports$1.CardFinish = exports$1.PromoType = exports$1.RelatedCard = exports$1.RelatedCardComponent = exports$1.Format = exports$1.Layout = exports$1.Border = exports$1.Legality = exports$1.Game = exports$1.FrameEffect = exports$1.Rarity = exports$1.SortDirection = exports$1.Sort = exports$1.UniqueStrategy = void 0;
    const IScry_1 = requireIScry();
    const Cached_1 = requireCached();
    const MagicEmitter_1 = requireMagicEmitter();
    const MagicQuerier_1 = requireMagicQuerier();
    (function(UniqueStrategy) {
      UniqueStrategy[UniqueStrategy["cards"] = 0] = "cards";
      UniqueStrategy[UniqueStrategy["art"] = 1] = "art";
      UniqueStrategy[UniqueStrategy["prints"] = 2] = "prints";
    })(exports$1.UniqueStrategy || (exports$1.UniqueStrategy = {}));
    (function(Sort) {
      Sort[Sort["name"] = 0] = "name";
      Sort[Sort["set"] = 1] = "set";
      Sort[Sort["released"] = 2] = "released";
      Sort[Sort["rarity"] = 3] = "rarity";
      Sort[Sort["color"] = 4] = "color";
      Sort[Sort["usd"] = 5] = "usd";
      Sort[Sort["tix"] = 6] = "tix";
      Sort[Sort["eur"] = 7] = "eur";
      Sort[Sort["cmc"] = 8] = "cmc";
      Sort[Sort["power"] = 9] = "power";
      Sort[Sort["toughness"] = 10] = "toughness";
      Sort[Sort["edhrec"] = 11] = "edhrec";
      Sort[Sort["artist"] = 12] = "artist";
    })(exports$1.Sort || (exports$1.Sort = {}));
    (function(SortDirection) {
      SortDirection[SortDirection["auto"] = 0] = "auto";
      SortDirection[SortDirection["asc"] = 1] = "asc";
      SortDirection[SortDirection["desc"] = 2] = "desc";
    })(exports$1.SortDirection || (exports$1.SortDirection = {}));
    (function(Rarity) {
      Rarity[Rarity["common"] = 0] = "common";
      Rarity[Rarity["uncommon"] = 1] = "uncommon";
      Rarity[Rarity["rare"] = 2] = "rare";
      Rarity[Rarity["special"] = 3] = "special";
      Rarity[Rarity["mythic"] = 4] = "mythic";
      Rarity[Rarity["bonus"] = 5] = "bonus";
    })(exports$1.Rarity || (exports$1.Rarity = {}));
    (function(FrameEffect) {
      FrameEffect[FrameEffect["legendary"] = 0] = "legendary";
      FrameEffect[FrameEffect["miracle"] = 1] = "miracle";
      FrameEffect[FrameEffect["nyxtouched"] = 2] = "nyxtouched";
      FrameEffect[FrameEffect["draft"] = 3] = "draft";
      FrameEffect[FrameEffect["devoid"] = 4] = "devoid";
      FrameEffect[FrameEffect["tombstone"] = 5] = "tombstone";
      FrameEffect[FrameEffect["colorshifted"] = 6] = "colorshifted";
      FrameEffect[FrameEffect["inverted"] = 7] = "inverted";
      FrameEffect[FrameEffect["sunmoondfc"] = 8] = "sunmoondfc";
      FrameEffect[FrameEffect["compasslanddfc"] = 9] = "compasslanddfc";
      FrameEffect[FrameEffect["originpwdfc"] = 10] = "originpwdfc";
      FrameEffect[FrameEffect["mooneldrazidfc"] = 11] = "mooneldrazidfc";
      FrameEffect[FrameEffect["moonreversemoondfc"] = 12] = "moonreversemoondfc";
      FrameEffect[FrameEffect["showcase"] = 13] = "showcase";
      FrameEffect[FrameEffect["extendedart"] = 14] = "extendedart";
      FrameEffect[FrameEffect["companion"] = 15] = "companion";
      FrameEffect[FrameEffect["etched"] = 16] = "etched";
      FrameEffect[FrameEffect["snow"] = 17] = "snow";
      FrameEffect[FrameEffect["lesson"] = 18] = "lesson";
      FrameEffect[FrameEffect["shatteredglass"] = 19] = "shatteredglass";
      FrameEffect[FrameEffect["convertdfc"] = 20] = "convertdfc";
      FrameEffect[FrameEffect["fandfc"] = 21] = "fandfc";
      FrameEffect[FrameEffect["upsidedowndfc"] = 22] = "upsidedowndfc";
    })(exports$1.FrameEffect || (exports$1.FrameEffect = {}));
    (function(Game) {
      Game[Game["paper"] = 0] = "paper";
      Game[Game["arena"] = 1] = "arena";
      Game[Game["mtgo"] = 2] = "mtgo";
    })(exports$1.Game || (exports$1.Game = {}));
    (function(Legality) {
      Legality[Legality["legal"] = 0] = "legal";
      Legality[Legality["not_legal"] = 1] = "not_legal";
      Legality[Legality["restricted"] = 2] = "restricted";
      Legality[Legality["banned"] = 3] = "banned";
    })(exports$1.Legality || (exports$1.Legality = {}));
    (function(Border) {
      Border[Border["black"] = 0] = "black";
      Border[Border["borderless"] = 1] = "borderless";
      Border[Border["gold"] = 2] = "gold";
      Border[Border["silver"] = 3] = "silver";
      Border[Border["white"] = 4] = "white";
    })(exports$1.Border || (exports$1.Border = {}));
    (function(Layout) {
      Layout[Layout["normal"] = 0] = "normal";
      Layout[Layout["split"] = 1] = "split";
      Layout[Layout["flip"] = 2] = "flip";
      Layout[Layout["transform"] = 3] = "transform";
      Layout[Layout["modal_dfc"] = 4] = "modal_dfc";
      Layout[Layout["meld"] = 5] = "meld";
      Layout[Layout["leveler"] = 6] = "leveler";
      Layout[Layout["saga"] = 7] = "saga";
      Layout[Layout["adventure"] = 8] = "adventure";
      Layout[Layout["planar"] = 9] = "planar";
      Layout[Layout["scheme"] = 10] = "scheme";
      Layout[Layout["vanguard"] = 11] = "vanguard";
      Layout[Layout["token"] = 12] = "token";
      Layout[Layout["double_faced_token"] = 13] = "double_faced_token";
      Layout[Layout["emblem"] = 14] = "emblem";
      Layout[Layout["augment"] = 15] = "augment";
      Layout[Layout["host"] = 16] = "host";
      Layout[Layout["art_series"] = 17] = "art_series";
      Layout[Layout["double_sided"] = 18] = "double_sided";
    })(exports$1.Layout || (exports$1.Layout = {}));
    (function(Format) {
      Format[Format["standard"] = 0] = "standard";
      Format[Format["future"] = 1] = "future";
      Format[Format["historic"] = 2] = "historic";
      Format[Format["gladiator"] = 3] = "gladiator";
      Format[Format["pioneer"] = 4] = "pioneer";
      Format[Format["explorer"] = 5] = "explorer";
      Format[Format["modern"] = 6] = "modern";
      Format[Format["legacy"] = 7] = "legacy";
      Format[Format["pauper"] = 8] = "pauper";
      Format[Format["vintage"] = 9] = "vintage";
      Format[Format["penny"] = 10] = "penny";
      Format[Format["commander"] = 11] = "commander";
      Format[Format["oathbreaker"] = 12] = "oathbreaker";
      Format[Format["brawl"] = 13] = "brawl";
      Format[Format["historicbrawl"] = 14] = "historicbrawl";
      Format[Format["alchemy"] = 15] = "alchemy";
      Format[Format["paupercommander"] = 16] = "paupercommander";
      Format[Format["duel"] = 17] = "duel";
      Format[Format["premodern"] = 18] = "premodern";
      Format[Format["oldschool"] = 19] = "oldschool";
    })(exports$1.Format || (exports$1.Format = {}));
    (function(RelatedCardComponent) {
      RelatedCardComponent[RelatedCardComponent["token"] = 0] = "token";
      RelatedCardComponent[RelatedCardComponent["meld_part"] = 1] = "meld_part";
      RelatedCardComponent[RelatedCardComponent["meld_result"] = 2] = "meld_result";
      RelatedCardComponent[RelatedCardComponent["combo_piece"] = 3] = "combo_piece";
    })(exports$1.RelatedCardComponent || (exports$1.RelatedCardComponent = {}));
    let Scry2;
    const SYMBOL_CARD = /* @__PURE__ */ Symbol("CARD");
    class RelatedCard {
      static construct(card) {
        Object.setPrototypeOf(card, RelatedCard.prototype);
        return card;
      }
      get() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          return (_a = this[SYMBOL_CARD]) !== null && _a !== void 0 ? _a : this[SYMBOL_CARD] = yield Scry2.Cards.byId(this.id);
        });
      }
    }
    exports$1.RelatedCard = RelatedCard;
    (function(PromoType) {
      PromoType[PromoType["alchemy"] = 0] = "alchemy";
      PromoType[PromoType["arenaleague"] = 1] = "arenaleague";
      PromoType[PromoType["beginnerbox"] = 2] = "beginnerbox";
      PromoType[PromoType["boosterfun"] = 3] = "boosterfun";
      PromoType[PromoType["boxtopper"] = 4] = "boxtopper";
      PromoType[PromoType["brawldeck"] = 5] = "brawldeck";
      PromoType[PromoType["bringafriend"] = 6] = "bringafriend";
      PromoType[PromoType["bundle"] = 7] = "bundle";
      PromoType[PromoType["buyabox"] = 8] = "buyabox";
      PromoType[PromoType["commanderparty"] = 9] = "commanderparty";
      PromoType[PromoType["concept"] = 10] = "concept";
      PromoType[PromoType["confettifoil"] = 11] = "confettifoil";
      PromoType[PromoType["convention"] = 12] = "convention";
      PromoType[PromoType["datestamped"] = 13] = "datestamped";
      PromoType[PromoType["dossier"] = 14] = "dossier";
      PromoType[PromoType["doubleexposure"] = 15] = "doubleexposure";
      PromoType[PromoType["doublerainbow"] = 16] = "doublerainbow";
      PromoType[PromoType["draculaseries"] = 17] = "draculaseries";
      PromoType[PromoType["draftweekend"] = 18] = "draftweekend";
      PromoType[PromoType["duels"] = 19] = "duels";
      PromoType[PromoType["embossed"] = 20] = "embossed";
      PromoType[PromoType["event"] = 21] = "event";
      PromoType[PromoType["fnm"] = 22] = "fnm";
      PromoType[PromoType["fracturefoil"] = 23] = "fracturefoil";
      PromoType[PromoType["galaxyfoil"] = 24] = "galaxyfoil";
      PromoType[PromoType["gameday"] = 25] = "gameday";
      PromoType[PromoType["giftbox"] = 26] = "giftbox";
      PromoType[PromoType["gilded"] = 27] = "gilded";
      PromoType[PromoType["glossy"] = 28] = "glossy";
      PromoType[PromoType["godzillaseries"] = 29] = "godzillaseries";
      PromoType[PromoType["halofoil"] = 30] = "halofoil";
      PromoType[PromoType["imagine"] = 31] = "imagine";
      PromoType[PromoType["instore"] = 32] = "instore";
      PromoType[PromoType["intropack"] = 33] = "intropack";
      PromoType[PromoType["invisibleink"] = 34] = "invisibleink";
      PromoType[PromoType["jpwalker"] = 35] = "jpwalker";
      PromoType[PromoType["judgegift"] = 36] = "judgegift";
      PromoType[PromoType["league"] = 37] = "league";
      PromoType[PromoType["magnified"] = 38] = "magnified";
      PromoType[PromoType["manafoil"] = 39] = "manafoil";
      PromoType[PromoType["mediainsert"] = 40] = "mediainsert";
      PromoType[PromoType["moonlitland"] = 41] = "moonlitland";
      PromoType[PromoType["neonink"] = 42] = "neonink";
      PromoType[PromoType["oilslick"] = 43] = "oilslick";
      PromoType[PromoType["openhouse"] = 44] = "openhouse";
      PromoType[PromoType["planeswalkerdeck"] = 45] = "planeswalkerdeck";
      PromoType[PromoType["plastic"] = 46] = "plastic";
      PromoType[PromoType["playerrewards"] = 47] = "playerrewards";
      PromoType[PromoType["playpromo"] = 48] = "playpromo";
      PromoType[PromoType["playtest"] = 49] = "playtest";
      PromoType[PromoType["portrait"] = 50] = "portrait";
      PromoType[PromoType["poster"] = 51] = "poster";
      PromoType[PromoType["premiereshop"] = 52] = "premiereshop";
      PromoType[PromoType["prerelease"] = 53] = "prerelease";
      PromoType[PromoType["promopack"] = 54] = "promopack";
      PromoType[PromoType["rainbowfoil"] = 55] = "rainbowfoil";
      PromoType[PromoType["raisedfoil"] = 56] = "raisedfoil";
      PromoType[PromoType["ravnicacity"] = 57] = "ravnicacity";
      PromoType[PromoType["rebalanced"] = 58] = "rebalanced";
      PromoType[PromoType["release"] = 59] = "release";
      PromoType[PromoType["resale"] = 60] = "resale";
      PromoType[PromoType["ripplefoil"] = 61] = "ripplefoil";
      PromoType[PromoType["schinesealtart"] = 62] = "schinesealtart";
      PromoType[PromoType["scroll"] = 63] = "scroll";
      PromoType[PromoType["serialized"] = 64] = "serialized";
      PromoType[PromoType["setextension"] = 65] = "setextension";
      PromoType[PromoType["setpromo"] = 66] = "setpromo";
      PromoType[PromoType["silverfoil"] = 67] = "silverfoil";
      PromoType[PromoType["sldbonus"] = 68] = "sldbonus";
      PromoType[PromoType["stamped"] = 69] = "stamped";
      PromoType[PromoType["startercollection"] = 70] = "startercollection";
      PromoType[PromoType["starterdeck"] = 71] = "starterdeck";
      PromoType[PromoType["stepandcompleat"] = 72] = "stepandcompleat";
      PromoType[PromoType["storechampionship"] = 73] = "storechampionship";
      PromoType[PromoType["surgefoil"] = 74] = "surgefoil";
      PromoType[PromoType["textured"] = 75] = "textured";
      PromoType[PromoType["themepack"] = 76] = "themepack";
      PromoType[PromoType["thick"] = 77] = "thick";
      PromoType[PromoType["tourney"] = 78] = "tourney";
      PromoType[PromoType["upsidedown"] = 79] = "upsidedown";
      PromoType[PromoType["upsidedownback"] = 80] = "upsidedownback";
      PromoType[PromoType["vault"] = 81] = "vault";
      PromoType[PromoType["wizardsplaynetwork"] = 82] = "wizardsplaynetwork";
    })(exports$1.PromoType || (exports$1.PromoType = {}));
    (function(CardFinish) {
      CardFinish[CardFinish["foil"] = 0] = "foil";
      CardFinish[CardFinish["nonfoil"] = 1] = "nonfoil";
      CardFinish[CardFinish["etched"] = 2] = "etched";
      CardFinish[CardFinish["glossy"] = 3] = "glossy";
    })(exports$1.CardFinish || (exports$1.CardFinish = {}));
    exports$1.CardFrame = {
      "1993": 0,
      "1997": 1,
      "2003": 2,
      "2015": 3,
      "Future": 4
    };
    (function(CardStatus) {
      CardStatus[CardStatus["missing"] = 0] = "missing";
      CardStatus[CardStatus["placeholder"] = 1] = "placeholder";
      CardStatus[CardStatus["lowres"] = 2] = "lowres";
      CardStatus[CardStatus["highres_scan"] = 3] = "highres_scan";
    })(exports$1.CardStatus || (exports$1.CardStatus = {}));
    (function(CardSecurityStamp) {
      CardSecurityStamp[CardSecurityStamp["oval"] = 0] = "oval";
      CardSecurityStamp[CardSecurityStamp["triangle"] = 1] = "triangle";
      CardSecurityStamp[CardSecurityStamp["acorn"] = 2] = "acorn";
      CardSecurityStamp[CardSecurityStamp["circle"] = 3] = "circle";
      CardSecurityStamp[CardSecurityStamp["arena"] = 4] = "arena";
      CardSecurityStamp[CardSecurityStamp["heart"] = 5] = "heart";
    })(exports$1.CardSecurityStamp || (exports$1.CardSecurityStamp = {}));
    (function(CardIdentifier) {
      function byId(id) {
        return { id };
      }
      CardIdentifier.byId = byId;
      function byMtgoId(id) {
        return { mtgo_id: id };
      }
      CardIdentifier.byMtgoId = byMtgoId;
      function byMultiverseId(id) {
        return { multiverse_id: id };
      }
      CardIdentifier.byMultiverseId = byMultiverseId;
      function byOracleId(id) {
        return { oracle_id: id };
      }
      CardIdentifier.byOracleId = byOracleId;
      function byIllustrationId(id) {
        return { illustration_id: id };
      }
      CardIdentifier.byIllustrationId = byIllustrationId;
      function byName(name, set) {
        return { name, set };
      }
      CardIdentifier.byName = byName;
      function bySet(set, collectorNumber) {
        return { collector_number: `${collectorNumber}`, set };
      }
      CardIdentifier.bySet = bySet;
    })(exports$1.CardIdentifier || (exports$1.CardIdentifier = {}));
    let symbologyTransformer;
    const REGEX_SYMBOLOGY = /{([a-z]|\d+)(?:\/([a-z]))?}/gi;
    function transform(self, key, map) {
      const text = self[key];
      if (!text || !symbologyTransformer)
        return text;
      const transformerKey = typeof symbologyTransformer === "string" ? new String(symbologyTransformer) : symbologyTransformer;
      const value = map.get(transformerKey);
      if (value)
        return value;
      const transformed = typeof symbologyTransformer === "string" ? text.replace(REGEX_SYMBOLOGY, symbologyTransformer) : text.replace(REGEX_SYMBOLOGY, (_, type1, type2) => symbologyTransformer(type1, type2 !== null && type2 !== void 0 ? type2 : ""));
      map.set(transformerKey, transformed);
      return transformed;
    }
    class Card {
      static construct(card) {
        var _a;
        Object.setPrototypeOf(card, Card.prototype);
        if (!card.card_faces)
          card.card_faces = [{ object: "card_face" }];
        for (const face of card.card_faces)
          Object.setPrototypeOf(face, card);
        (_a = card.all_parts) === null || _a === void 0 ? void 0 : _a.forEach(RelatedCard.construct);
        return card;
      }
      getSet() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          return (_a = this[IScry_1.SYMBOL_SET]) !== null && _a !== void 0 ? _a : this[IScry_1.SYMBOL_SET] = yield Scry2.Sets.byId(this.set);
        });
      }
      getRulings() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
          return (_a = this[IScry_1.SYMBOL_RULINGS]) !== null && _a !== void 0 ? _a : this[IScry_1.SYMBOL_RULINGS] = yield Scry2.Rulings.byId(this.id);
        });
      }
      getPrints() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
          if (!this[IScry_1.SYMBOL_PRINTS]) {
            this[IScry_1.SYMBOL_PRINTS] = yield Scry2.Cards.search(`oracleid:${this.oracle_id}`, { unique: "prints" }).waitForAll();
            for (const card of this[IScry_1.SYMBOL_PRINTS]) {
              (_a = card[IScry_1.SYMBOL_SET]) !== null && _a !== void 0 ? _a : card[IScry_1.SYMBOL_SET] = this[IScry_1.SYMBOL_SET];
              (_b = card[IScry_1.SYMBOL_RULINGS]) !== null && _b !== void 0 ? _b : card[IScry_1.SYMBOL_RULINGS] = this[IScry_1.SYMBOL_RULINGS];
              (_c = card[IScry_1.SYMBOL_PRINTS]) !== null && _c !== void 0 ? _c : card[IScry_1.SYMBOL_PRINTS] = this[IScry_1.SYMBOL_PRINTS];
            }
          }
          return this[IScry_1.SYMBOL_PRINTS];
        });
      }
      getTokens() {
        return !this.all_parts ? [] : this.all_parts.filter((part) => part.component === "token");
      }
      /**
       * @returns `true` if this card is `legal` or `restricted` in the given format.
       */
      isLegal(format) {
        return this.legalities[format] === "legal" || this.legalities[format] === "restricted";
      }
      /**
       * @returns `true` if this card is `not_legal` or `banned` in the given format.
       */
      isIllegal(format) {
        return this.legalities[format] === "not_legal" || this.legalities[format] === "banned";
      }
      /**
       * @returns The `oracle_text` of this card, with symbols transformed by the transformer as set by @see {@link Cards.setSymbologyTransformer}
       */
      getText() {
        if (!this.hasOwnProperty(IScry_1.SYMBOL_TEXT))
          this[IScry_1.SYMBOL_TEXT] = /* @__PURE__ */ new WeakMap();
        return transform(this, "oracle_text", this[IScry_1.SYMBOL_TEXT]);
      }
      /**
       * @returns The `mana_cost` of this card, with symbols transformed by the transformer as set by @see {@link Cards.setSymbologyTransformer}
       */
      getCost() {
        if (!this.hasOwnProperty(IScry_1.SYMBOL_COST))
          this[IScry_1.SYMBOL_COST] = /* @__PURE__ */ new WeakMap();
        return transform(this, "mana_cost", this[IScry_1.SYMBOL_COST]);
      }
      getImageURI(version) {
        var _a, _b, _c;
        return (_b = (_a = this.image_uris) === null || _a === void 0 ? void 0 : _a[version]) !== null && _b !== void 0 ? _b : (_c = this.card_faces[0].image_uris) === null || _c === void 0 ? void 0 : _c[version];
      }
      getFrontImageURI(version) {
        var _a, _b, _c;
        return (_b = (_a = this.card_faces[0].image_uris) === null || _a === void 0 ? void 0 : _a[version]) !== null && _b !== void 0 ? _b : (_c = this.image_uris) === null || _c === void 0 ? void 0 : _c[version];
      }
      getBackImageURI(version) {
        var _a, _b;
        return this.layout !== "transform" && this.layout !== "double_faced_token" ? IScry_1.RESOURCE_GENERIC_CARD_BACK : (_b = (_a = this.card_faces[1].image_uris) === null || _a === void 0 ? void 0 : _a[version]) !== null && _b !== void 0 ? _b : IScry_1.RESOURCE_GENERIC_CARD_BACK;
      }
    }
    exports$1.Card = Card;
    let Cards$1 = class Cards extends MagicQuerier_1.default {
      set Scry(scry) {
        Scry2 = scry;
      }
      setSymbologyTransformer(transformer) {
        symbologyTransformer = transformer;
        return this;
      }
      byName(name, set, fuzzy = false) {
        return __awaiter(this, void 0, void 0, function* () {
          if (typeof set === "boolean") {
            fuzzy = set;
            set = void 0;
          }
          const promise = this.queryCard("cards/named", {
            [fuzzy ? "fuzzy" : "exact"]: name,
            set
          });
          return promise;
        });
      }
      byId(id) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.queryCard(["cards", id]);
        });
      }
      bySet(setCode, collectorNumber, lang) {
        return __awaiter(this, void 0, void 0, function* () {
          const path = ["cards", typeof setCode === "string" ? setCode : setCode.code, collectorNumber];
          if (lang)
            path.push(lang);
          return this.queryCard(path);
        });
      }
      byMultiverseId(id) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.queryCard(["cards/multiverse", id]);
        });
      }
      byMtgoId(id) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.queryCard(["cards/mtgo", id]);
        });
      }
      byArenaId(id) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.queryCard(["cards/arena", id]);
        });
      }
      byTcgPlayerId(id) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.queryCard(["cards/tcgplayer", id]);
        });
      }
      byCardmarketId(id) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.queryCard(["cards/cardmarket", id]);
        });
      }
      random(query) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.queryCard("cards/random", { q: query });
        });
      }
      search(query, options) {
        const emitter = new MagicEmitter_1.default().map(Card.construct);
        this.queryPage(emitter, "cards/search", Object.assign({ q: query }, typeof options === "number" ? { page: options } : options)).catch((err) => emitter.emit("error", err));
        return emitter;
      }
      autoCompleteName(name) {
        return __awaiter(this, void 0, void 0, function* () {
          return (yield this.query("cards/autocomplete", { q: name })).data;
        });
      }
      collection(...identifiers) {
        const emitter = new MagicEmitter_1.default().map(Card.construct);
        void this.processCollection(emitter, identifiers);
        return emitter;
      }
      queryCard(apiPath, query, post) {
        return __awaiter(this, void 0, void 0, function* () {
          return yield this.query(apiPath, query, post).then(Card.construct);
        });
      }
      processCollection(emitter, identifiers) {
        return __awaiter(this, void 0, void 0, function* () {
          for (let i = 0; i < identifiers.length; i += 75) {
            if (emitter.cancelled)
              break;
            const collectionSection = { identifiers: identifiers.slice(i, i + 75) };
            const { data, not_found } = yield this.query("cards/collection", void 0, collectionSection);
            emitter.emitAll("not_found", ...not_found !== null && not_found !== void 0 ? not_found : []);
            if (!emitter.cancelled)
              emitter.emitAll("data", ...data);
            if (emitter.willCancelAfterPage)
              emitter.cancel();
          }
          if (!emitter.cancelled)
            emitter.emit("end");
          emitter.emit("done");
        });
      }
    };
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "byName", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "byId", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "bySet", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "byMultiverseId", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "byMtgoId", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "byArenaId", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "byTcgPlayerId", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "byCardmarketId", null);
    __decorate([
      Cached_1.default
    ], Cards$1.prototype, "autoCompleteName", null);
    exports$1.default = new Cards$1();
  })(Cards);
  return Cards;
}
var Sets = {};
var hasRequiredSets;
function requireSets() {
  if (hasRequiredSets) return Sets;
  hasRequiredSets = 1;
  var __decorate = Sets && Sets.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __awaiter = Sets && Sets.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  Object.defineProperty(Sets, "__esModule", { value: true });
  Sets.Set = void 0;
  const IScry_1 = requireIScry();
  const Cached_1 = requireCached();
  const MagicQuerier_1 = requireMagicQuerier();
  var SetType;
  (function(SetType2) {
    SetType2[SetType2["core"] = 0] = "core";
    SetType2[SetType2["expansion"] = 1] = "expansion";
    SetType2[SetType2["masters"] = 2] = "masters";
    SetType2[SetType2["alchemy"] = 3] = "alchemy";
    SetType2[SetType2["masterpiece"] = 4] = "masterpiece";
    SetType2[SetType2["arsenal"] = 5] = "arsenal";
    SetType2[SetType2["from_the_vault"] = 6] = "from_the_vault";
    SetType2[SetType2["spellbook"] = 7] = "spellbook";
    SetType2[SetType2["premium_deck"] = 8] = "premium_deck";
    SetType2[SetType2["duel_deck"] = 9] = "duel_deck";
    SetType2[SetType2["draft_innovation"] = 10] = "draft_innovation";
    SetType2[SetType2["treasure_chest"] = 11] = "treasure_chest";
    SetType2[SetType2["commander"] = 12] = "commander";
    SetType2[SetType2["planechase"] = 13] = "planechase";
    SetType2[SetType2["archenemy"] = 14] = "archenemy";
    SetType2[SetType2["vanguard"] = 15] = "vanguard";
    SetType2[SetType2["funny"] = 16] = "funny";
    SetType2[SetType2["starter"] = 17] = "starter";
    SetType2[SetType2["box"] = 18] = "box";
    SetType2[SetType2["promo"] = 19] = "promo";
    SetType2[SetType2["token"] = 20] = "token";
    SetType2[SetType2["memorabilia"] = 21] = "memorabilia";
    SetType2[SetType2["minigame"] = 22] = "minigame";
  })(SetType || (SetType = {}));
  let Scry2;
  class Set {
    static construct(set) {
      Object.setPrototypeOf(set, Set.prototype);
      return set;
    }
    getCards(options) {
      var _a;
      return __awaiter(this, void 0, void 0, function* () {
        if (!options)
          return (_a = this[IScry_1.SYMBOL_CARDS]) !== null && _a !== void 0 ? _a : this[IScry_1.SYMBOL_CARDS] = yield this.search(`s:${this.code}`, { order: "set" });
        return this.search(`s:${this.code}`, Object.assign({ order: "set" }, options));
      });
    }
    search(query, options) {
      return Scry2.Cards.search(`s:${this.code} ${query}`, options).map((card) => {
        var _a;
        (_a = card[IScry_1.SYMBOL_SET]) !== null && _a !== void 0 ? _a : card[IScry_1.SYMBOL_SET] = this;
        return card;
      }).waitForAll();
    }
  }
  Sets.Set = Set;
  let Sets$1 = class Sets extends MagicQuerier_1.default {
    set Scry(scry) {
      Scry2 = scry;
    }
    all() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("sets")).data.map(Set.construct);
      });
    }
    byCode(code) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.querySet(["sets", code]);
      });
    }
    byId(id) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.querySet(["sets", id]);
      });
    }
    byTcgPlayerId(id) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.querySet(["sets/tcgplayer", id]);
      });
    }
    /**
     * @param fuzzy This parameter only works if you've previously set a fuzzy comparer with `Scry.setFuzzySearch`. Otherwise it only returns exact matches.
     */
    byName(name, fuzzy) {
      return __awaiter(this, void 0, void 0, function* () {
        const all = yield this.all();
        let result;
        if (fuzzy && IScry_1.IScry.fuzzySearch)
          result = IScry_1.IScry.fuzzySearch(name, all, "name");
        else {
          name = name.toLowerCase();
          result = all.find((set) => set.name.toLowerCase() === name);
        }
        if (result)
          return result;
        const error = new Error(`No sets found matching “${name}”`);
        error.status = 404;
        error.code = "not_found";
        throw error;
      });
    }
    querySet(apiPath, query, post) {
      return __awaiter(this, void 0, void 0, function* () {
        return yield this.query(apiPath, query, post).then(Set.construct);
      });
    }
  };
  __decorate([
    Cached_1.default
  ], Sets$1.prototype, "all", null);
  __decorate([
    Cached_1.default
  ], Sets$1.prototype, "byCode", null);
  __decorate([
    Cached_1.default
  ], Sets$1.prototype, "byId", null);
  __decorate([
    Cached_1.default
  ], Sets$1.prototype, "byTcgPlayerId", null);
  __decorate([
    Cached_1.default
  ], Sets$1.prototype, "byName", null);
  Sets.default = new Sets$1();
  return Sets;
}
var BulkData = {};
var hasRequiredBulkData;
function requireBulkData() {
  if (hasRequiredBulkData) return BulkData;
  hasRequiredBulkData = 1;
  var __decorate = BulkData && BulkData.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __awaiter = BulkData && BulkData.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  Object.defineProperty(BulkData, "__esModule", { value: true });
  const Cached_1 = requireCached();
  const MagicQuerier_1 = requireMagicQuerier();
  let axios;
  if (typeof fetch === "undefined") {
    try {
      axios = require("axios").default;
    } catch (_a) {
    }
  }
  var BulkDataTypes;
  (function(BulkDataTypes2) {
    BulkDataTypes2[BulkDataTypes2["oracle_cards"] = 0] = "oracle_cards";
    BulkDataTypes2[BulkDataTypes2["unique_artwork"] = 1] = "unique_artwork";
    BulkDataTypes2[BulkDataTypes2["default_cards"] = 2] = "default_cards";
    BulkDataTypes2[BulkDataTypes2["all_cards"] = 3] = "all_cards";
    BulkDataTypes2[BulkDataTypes2["rulings"] = 4] = "rulings";
  })(BulkDataTypes || (BulkDataTypes = {}));
  let BulkData$1 = class BulkData extends MagicQuerier_1.default {
    /**
     * Returns a stream for the given bulk data if it has been updated since the last download time. If it hasn't, returns `undefined`
     * @param lastDownload The last time this bulk data was downloaded. If you want to re-download the data regardless of
     * the last time it was downloaded, set this to `0`.
     */
    downloadByType(type, lastDownload) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.download(type, lastDownload);
      });
    }
    /**
     * Returns a stream for the given bulk data if it has been updated since the last download time. If it hasn't, returns `undefined`
     * @param lastDownload The last time this bulk data was downloaded. If you want to re-download the data regardless of
     * the last time it was downloaded, set this to `0`.
     */
    downloadById(id, lastDownload) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.download(id, lastDownload);
      });
    }
    ////////////////////////////////////
    // Definitions
    //
    definitions() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("bulk-data")).data;
      });
    }
    definitionByType(type) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.definition(type);
      });
    }
    definitionById(id) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.definition(id);
      });
    }
    ////////////////////////////////////
    // Internals
    //
    download(idOrType, lastDownload) {
      return __awaiter(this, void 0, void 0, function* () {
        const definition = yield this.definition(idOrType);
        if (new Date(lastDownload).getTime() > new Date(definition.updated_at).getTime())
          return void 0;
        if (axios) {
          const result = yield axios.request({
            method: "GET",
            url: definition.download_uri,
            responseType: "stream"
          });
          return result.data;
        } else {
          const result = yield fetch(definition.download_uri, {
            method: "GET",
            headers: Object.assign(Object.assign({}, !MagicQuerier_1.default.agent ? void 0 : {
              "User-Agent": MagicQuerier_1.default.agent
            }), { Accept: "*/*" })
          });
          return result.body;
        }
      });
    }
    definition(idOrType) {
      return this.query(["bulk-data", idOrType]);
    }
  };
  __decorate([
    Cached_1.default
  ], BulkData$1.prototype, "definitions", null);
  __decorate([
    Cached_1.default
  ], BulkData$1.prototype, "definitionByType", null);
  __decorate([
    Cached_1.default
  ], BulkData$1.prototype, "definitionById", null);
  BulkData.default = new BulkData$1();
  return BulkData;
}
var Catalog = {};
var hasRequiredCatalog;
function requireCatalog() {
  if (hasRequiredCatalog) return Catalog;
  hasRequiredCatalog = 1;
  var __decorate = Catalog && Catalog.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __awaiter = Catalog && Catalog.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  Object.defineProperty(Catalog, "__esModule", { value: true });
  const Cached_1 = requireCached();
  const MagicQuerier_1 = requireMagicQuerier();
  let Catalog$1 = class Catalog extends MagicQuerier_1.default {
    cardNames() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/card-names")).data;
      });
    }
    artistNames() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/artist-names")).data;
      });
    }
    wordBank() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/word-bank")).data;
      });
    }
    creatureTypes() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/creature-types")).data;
      });
    }
    planeswalkerTypes() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/planeswalker-types")).data;
      });
    }
    landTypes() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/land-types")).data;
      });
    }
    artifactTypes() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/artifact-types")).data;
      });
    }
    enchantmentTypes() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/enchantment-types")).data;
      });
    }
    spellTypes() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/spell-types")).data;
      });
    }
    powers() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/powers")).data;
      });
    }
    toughnesses() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/toughnesses")).data;
      });
    }
    loyalties() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/loyalties")).data;
      });
    }
    watermarks() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/watermarks")).data;
      });
    }
    keywordAbilities() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/keyword-abilities")).data;
      });
    }
    keywordActions() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/keyword-actions")).data;
      });
    }
    abilityWords() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/ability-words")).data;
      });
    }
    supertypes() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("catalog/supertypes")).data;
      });
    }
  };
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "cardNames", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "artistNames", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "wordBank", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "creatureTypes", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "planeswalkerTypes", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "landTypes", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "artifactTypes", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "enchantmentTypes", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "spellTypes", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "powers", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "toughnesses", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "loyalties", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "watermarks", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "keywordAbilities", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "keywordActions", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "abilityWords", null);
  __decorate([
    Cached_1.default
  ], Catalog$1.prototype, "supertypes", null);
  Catalog.default = new Catalog$1();
  return Catalog;
}
var Migrations = {};
var hasRequiredMigrations;
function requireMigrations() {
  if (hasRequiredMigrations) return Migrations;
  hasRequiredMigrations = 1;
  (function(exports$1) {
    var __awaiter = Migrations && Migrations.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.MigrationStrategy = void 0;
    const MagicEmitter_1 = requireMagicEmitter();
    const MagicQuerier_1 = requireMagicQuerier();
    (function(MigrationStrategy) {
      MigrationStrategy["Merge"] = "merge";
      MigrationStrategy["Delete"] = "delete";
    })(exports$1.MigrationStrategy || (exports$1.MigrationStrategy = {}));
    let Migrations$1 = class Migrations extends MagicQuerier_1.default {
      all(page = 1) {
        const emitter = new MagicEmitter_1.default();
        this.queryPage(emitter, "migrations", {}, page).catch((err) => emitter.emit("error", err));
        return emitter;
      }
      byId(id) {
        return __awaiter(this, void 0, void 0, function* () {
          return this.query(["migrations", id]);
        });
      }
    };
    exports$1.default = new Migrations$1();
  })(Migrations);
  return Migrations;
}
var Rulings = {};
var hasRequiredRulings;
function requireRulings() {
  if (hasRequiredRulings) return Rulings;
  hasRequiredRulings = 1;
  var __decorate = Rulings && Rulings.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __awaiter = Rulings && Rulings.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  Object.defineProperty(Rulings, "__esModule", { value: true });
  const Cached_1 = requireCached();
  const MagicQuerier_1 = requireMagicQuerier();
  let Rulings$1 = class Rulings extends MagicQuerier_1.default {
    byId(id) {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query(["cards", id, "rulings"])).data;
      });
    }
    bySet(setCode, collectorNumber) {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query(["cards", setCode, `${collectorNumber}`, "rulings"])).data;
      });
    }
    byMultiverseId(id) {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query(["cards/multiverse", id, "rulings"])).data;
      });
    }
    byMtgoId(id) {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query(["cards/mtgo", id, "rulings"])).data;
      });
    }
    byArenaId(id) {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query(["cards/arena", id, "rulings"])).data;
      });
    }
  };
  __decorate([
    Cached_1.default
  ], Rulings$1.prototype, "byId", null);
  __decorate([
    Cached_1.default
  ], Rulings$1.prototype, "bySet", null);
  __decorate([
    Cached_1.default
  ], Rulings$1.prototype, "byMultiverseId", null);
  __decorate([
    Cached_1.default
  ], Rulings$1.prototype, "byMtgoId", null);
  __decorate([
    Cached_1.default
  ], Rulings$1.prototype, "byArenaId", null);
  Rulings.default = new Rulings$1();
  return Rulings;
}
var Symbology = {};
var hasRequiredSymbology;
function requireSymbology() {
  if (hasRequiredSymbology) return Symbology;
  hasRequiredSymbology = 1;
  var __decorate = Symbology && Symbology.__decorate || function(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
  var __awaiter = Symbology && Symbology.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  Object.defineProperty(Symbology, "__esModule", { value: true });
  const Cached_1 = requireCached();
  const MagicQuerier_1 = requireMagicQuerier();
  let Symbology$1 = class Symbology extends MagicQuerier_1.default {
    all() {
      return __awaiter(this, void 0, void 0, function* () {
        return (yield this.query("symbology")).data;
      });
    }
    parseMana(shorthand) {
      return __awaiter(this, void 0, void 0, function* () {
        return this.query("symbology/parse-mana", { cost: shorthand });
      });
    }
  };
  __decorate([
    Cached_1.default
  ], Symbology$1.prototype, "all", null);
  __decorate([
    Cached_1.default
  ], Symbology$1.prototype, "parseMana", null);
  Symbology.default = new Symbology$1();
  return Symbology;
}
var hasRequiredScry;
function requireScry() {
  if (hasRequiredScry) return Scry;
  hasRequiredScry = 1;
  (function(exports$1) {
    var __createBinding = Scry && Scry.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = Scry && Scry.__exportStar || function(m, exports$12) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$12, p)) __createBinding(exports$12, m, p);
    };
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.setFuzzySearch = exports$1.setCacheLimit = exports$1.setCacheDuration = exports$1.clearCache = exports$1.setTimeout = exports$1.setRetry = exports$1.setAgent = exports$1.Symbology = exports$1.Sets = exports$1.Rulings = exports$1.Migrations = exports$1.Catalog = exports$1.Cards = exports$1.BulkData = void 0;
    const Cards_1 = requireCards();
    const Sets_1 = requireSets();
    const IScry_1 = requireIScry();
    const Cached_1 = requireCached();
    const MagicQuerier_1 = requireMagicQuerier();
    __exportStar(requireBulkData(), exports$1);
    var BulkData_1 = requireBulkData();
    Object.defineProperty(exports$1, "BulkData", { enumerable: true, get: function() {
      return BulkData_1.default;
    } });
    __exportStar(requireCards(), exports$1);
    var Cards_2 = requireCards();
    Object.defineProperty(exports$1, "Cards", { enumerable: true, get: function() {
      return Cards_2.default;
    } });
    __exportStar(requireCatalog(), exports$1);
    var Catalog_1 = requireCatalog();
    Object.defineProperty(exports$1, "Catalog", { enumerable: true, get: function() {
      return Catalog_1.default;
    } });
    __exportStar(requireMigrations(), exports$1);
    var Migrations_1 = requireMigrations();
    Object.defineProperty(exports$1, "Migrations", { enumerable: true, get: function() {
      return Migrations_1.default;
    } });
    __exportStar(requireRulings(), exports$1);
    var Rulings_1 = requireRulings();
    Object.defineProperty(exports$1, "Rulings", { enumerable: true, get: function() {
      return Rulings_1.default;
    } });
    __exportStar(requireSets(), exports$1);
    var Sets_2 = requireSets();
    Object.defineProperty(exports$1, "Sets", { enumerable: true, get: function() {
      return Sets_2.default;
    } });
    __exportStar(requireSymbology(), exports$1);
    var Symbology_1 = requireSymbology();
    Object.defineProperty(exports$1, "Symbology", { enumerable: true, get: function() {
      return Symbology_1.default;
    } });
    __exportStar(requireIScry(), exports$1);
    Cards_1.default["Scry"] = exports$1;
    Sets_1.default["Scry"] = exports$1;
    function setAgent(agent, version) {
      MagicQuerier_1.default.agent = `${agent}/${version}`;
    }
    exports$1.setAgent = setAgent;
    function setRetry(attempts, timeout, canRetry) {
      MagicQuerier_1.default.retry = { attempts, timeout, canRetry };
    }
    exports$1.setRetry = setRetry;
    function setTimeout2(timeout) {
      MagicQuerier_1.default.timeout = Math.max(MagicQuerier_1.minimumRequestTimeout, timeout);
    }
    exports$1.setTimeout = setTimeout2;
    function clearCache() {
      Cached_1.default.clear();
    }
    exports$1.clearCache = clearCache;
    function setCacheDuration(ms) {
      Cached_1.default.setDuration(ms);
    }
    exports$1.setCacheDuration = setCacheDuration;
    function setCacheLimit(amount) {
      Cached_1.default.setLimit(amount);
    }
    exports$1.setCacheLimit = setCacheLimit;
    function setFuzzySearch(search) {
      IScry_1.IScry.fuzzySearch = search;
    }
    exports$1.setFuzzySearch = setFuzzySearch;
  })(Scry);
  return Scry;
}
var ScryExports = requireScry();
class MyDurableObject extends DurableObject {
  currentGameState = {
    guessedCards: new Array(0),
    activePlayer: 0,
    playerNames: [],
    lastGuessTimeStamp: null
  };
  sessions = /* @__PURE__ */ new Map();
  constructor(ctx, env) {
    super(ctx, env);
    const oldState = this.ctx.storage.kv.get("gamestate");
    if (oldState != null && oldState != void 0 && this.ctx.getWebSockets().length > 0) {
      this.currentGameState = oldState;
      for (const ws of this.ctx.getWebSockets()) {
        this.sessions.set(ws, ws.deserializeAttachment());
      }
    }
  }
  async fetch(request) {
    if (this.currentGameState.playerNames.length >= 2) {
      return new Response(null, {
        status: 409
      });
    }
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    const id = this.currentGameState.playerNames.length;
    const url = new URL(request.url);
    this.currentGameState.playerNames.push(url.searchParams.get("name") ?? "No Name Nelly");
    this.sessions.set(server, id);
    server.serializeAttachment(id);
    this.ctx.acceptWebSocket(server);
    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
  isLegalPlay(guess) {
    if (guess.type_line.includes("land")) {
      return false;
    }
    const guessedCards = this.currentGameState.guessedCards;
    if (guessedCards.length == 0) {
      return true;
    }
    const previousGuess = guessedCards[guessedCards.length - 1];
    if (guessedCards.includes(guess)) {
      return false;
    }
    if (previousGuess.cmc == guess.cmc) {
      return true;
    }
    if (previousGuess.power) {
      if (previousGuess.power == guess.power) {
        return true;
      } else if (previousGuess.toughness == guess.toughness) {
        return true;
      }
    }
    return false;
  }
  async webSocketMessage(ws, message) {
    ScryExports.setAgent("Collossal2Dreadmaw", "1.0.0");
    let messageObj = JSON.parse(message);
    console.log(this.currentGameState);
    if (messageObj.command === "guess" && this.sessions.get(ws) == this.currentGameState.activePlayer) {
      const guessedCard = await ScryExports.Cards.byName(messageObj.card);
      if (this.isLegalPlay(guessedCard)) {
        this.currentGameState.guessedCards.push(guessedCard);
        this.currentGameState.lastGuessTimeStamp = /* @__PURE__ */ new Date();
        this.currentGameState.activePlayer == 0 ? this.currentGameState.activePlayer = 1 : this.currentGameState.activePlayer = 0;
        this.updateClients();
      }
    } else if (messageObj.command === "poll") {
      this.updateClients();
    }
  }
  updateClients() {
    this.ctx.storage.kv.put("gamestate", this.currentGameState);
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(
        JSON.stringify({ ...this.currentGameState, playerIndex: this.sessions.get(ws) })
      );
    }
  }
  async webSocketClose(ws, code, reason, wasClean) {
    this.ctx.storage.kv.delete("gamestate");
    ws.close(code, "Durable Object is closing WebSocket");
  }
}
const index = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.headers.get("Upgrade") === "websocket") {
      const lobby = url.searchParams.get("lobby") ?? "default";
      const stub = env.MY_DURABLE_OBJECT.getByName(lobby);
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};
const workerEntry = index ?? {};
export {
  MyDurableObject,
  workerEntry as default
};
