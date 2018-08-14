"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {

    var haHttp = angular.module("ha.http", []);

    try {
        angular.module("ngFileUpload");
        haHttp.requires.push("ngFileUpload");
        haHttp.canUpload = true;
    } catch (e) {
        haHttp.canUpload = false;
    }
})();
(function () {

    angular.module("ha.http").provider("$eventGroup", $eventGroupService);

    function $eventGroupService() {
        this.get = function () {
            return new EventGroups();
        };
        this.$get = function () {
            return function () {
                return new EventGroups();
            };
        };
    }

    var EventGroups = function () {
        function EventGroups() {
            _classCallCheck(this, EventGroups);

            this.eventGroups = {};
        }

        /**
         * `.on(event, callback[, priority = 0])`
         * `.on(event, {priority: callback, ...})`
         * `.on(event, {priority: [callback, ...], ...})`
         * `.on(event, [callback, ...][, priority = 0])`
         */


        _createClass(EventGroups, [{
            key: "on",
            value: function on(event, callback, priority) {
                var _this = this;

                var callbacks = [];
                if ((typeof callback === "undefined" ? "undefined" : _typeof(callback)) === "object" && !Array.isArray(callback)) {
                    for (var _priority in callback) {
                        var realCallback = callback[_priority];
                        if (Array.isArray(realCallback)) {
                            for (var i = 0; i < realCallback.length; i++) {
                                callbacks.push([_priority, realCallback[i]]);
                            }
                        } else {
                            callbacks.push([_priority, realCallback]);
                        }
                    }
                } else if (Array.isArray(callback)) {
                    for (var _i = 0; _i < callback.length; _i++) {
                        callbacks.push([priority, callback[_i]]);
                    }
                } else {
                    callbacks.push([priority, callback]);
                }
                if (!this.eventGroups[event]) {
                    this.eventGroups[event] = [];
                }
                for (var _i2 = 0; _i2 < callbacks.length; _i2++) {
                    this.eventGroups[event].push({
                        priority: callbacks[_i2][0] || 0,
                        callback: callbacks[_i2][1]
                    });
                }
                return function () {
                    return _this.off(event, callbacks);
                };
            }

            /**
             * `.of("eventName")`
             * `.of("eventName", callback)`
             * `.of("eventName", [callback, ...])`
             */

        }, {
            key: "off",
            value: function off(event, callback) {
                if (typeof callback === "undefined") {
                    this.eventGroups[event] = [];
                    return;
                }

                if (!this.eventGroups[event]) {
                    return;
                }

                var group = this.eventGroups[event];
                var i = 0;
                while (i < group.length) {
                    if (Array.isArray(callback) && ~callback.indexOf(group[i]) || group[i] === callback) {
                        group.splice(i, 1);
                    } else {
                        i++;
                    }
                }
            }

            /**
             * `.emit("eventName", data?)`
             * `.emit(["event1", "event2", ...], data?)`
             */

        }, {
            key: "emit",
            value: function emit(events) {
                if (!Array.isArray(events)) {
                    events = [events];
                }

                var _preventGroup = false;
                var _preventAll = false;

                var preventer = {
                    preventGroup: function preventGroup() {
                        return _preventGroup = true;
                    },
                    preventAll: function preventAll() {
                        return _preventAll = true;
                    }
                };

                for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                    data[_key - 1] = arguments[_key];
                }

                for (var i = 0; i < events.length; i++) {
                    var group = this.eventGroups[events[i]];
                    if (!group) {
                        continue;
                    }
                    // start group
                    group.sort(function (a, b) {
                        return a.priority - b.priority;
                    });
                    for (var j = 0; j < group.length; j++) {
                        var _group$j$callback;

                        (_group$j$callback = group[j].callback).call.apply(_group$j$callback, [preventer].concat(data));

                        if (_preventGroup || _preventAll) {
                            _preventGroup = false;
                            break;
                        }
                    }

                    if (_preventAll) {
                        break;
                    }
                }
            }
        }, {
            key: "copy",
            value: function copy() {
                var copy = new EventGroups();
                angular.copy(this, copy);
                return copy;
            }
        }, {
            key: "clone",
            value: function clone() {
                return this.copy();
            }
        }]);

        return EventGroups;
    }();
})();

(function () {

    angular.module("ha.http").service("HttpApiRequest", HttpApiRequestService);

    function HttpApiRequestService() {
        var HttpApiRequest = function () {
            function HttpApiRequest(holder, httpFunction, options) {
                var _this2 = this;

                _classCallCheck(this, HttpApiRequest);

                this.state = "loading";
                this.response = null;
                this.progress = null;
                this.holder = holder;
                this.inBg = false;
                this.simulateAbort = false;

                options.url = new URL(options.url, options.baseUrl || location.href).href;
                this.httpRequest = httpFunction(options);

                this.httpRequest.then(function (resp) {
                    _this2.progress = null;
                    _this2.response = resp;
                    _this2.state = "done";
                    _this2.callCallbacks(options, resp, [resp.status, parseInt(resp.status / 100), "resolve", "after"]);
                }, function (err) {
                    _this2.progress = null;
                    _this2.response = err;
                    if (err.xhrStatus === "abort") {
                        _this2.state = "aborted";
                        return _this2.callCallbacks(options, err, [err.status, parseInt(err.status / 100), "abort", "after"]);
                    }
                    _this2.state = "failed";
                    return _this2.callCallbacks(options, err, [err.status, parseInt(err.status / 100), "reject", "after"]);
                }, function (evt) {
                    _this2.progress = parseInt(evt.loaded * 1e4 / evt.total) / 100;
                });
            }

            _createClass(HttpApiRequest, [{
                key: "abort",
                value: function abort() {
                    var silent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

                    // this.simulateAbort = true; // TODO
                    if (typeof this.httpRequest.abort !== "function") {
                        return silent || console.error("This request can't be aborted");
                    }
                    return this.httpRequest.abort();
                }
            }, {
                key: "callCallbacks",
                value: function callCallbacks(options, resp, events) {
                    if (this.inBg && !options.listenBg || this.simulateAbort) {
                        return;
                    }
                    var _events = this.holder.events;
                    for (var i = 0; i < events.length; i++) {
                        this.holder.options[events[i]] && _events.on(events[i], this.holder.options[events[i]], 50);
                        options[events[i]] && _events.on(events[i], options[events[i]], 50);
                    }
                    _events.emit(events, resp.data, resp.status, resp.statusText);
                }
            }, {
                key: "registerInBg",
                value: function registerInBg() {
                    this.inBg = true;
                }
            }]);

            return HttpApiRequest;
        }();

        return function (holder, httpFunction, options) {
            return new HttpApiRequest(holder, httpFunction, options);
        };
    }
})();
(function () {

    angular.module("ha.http").provider("$httpApi", $httpApiProvider);

    $httpApiProvider.$inject = ["$injector", "$eventGroupProvider"];

    function $httpApiProvider($injector, $eventGroupProvider) {
        var config = {
            consurrent: false,
            baseUrl: location.href,
            data: {},
            listenBg: true
        };
        var events = $eventGroupProvider.get();

        this.on = events.on;
        this.off = events.off;

        this.$get = $httpApiService;

        $httpApiService.$inject = ["$http", "HttpApiRequest"];

        function $httpApiService($http, HttpApiRequest) {
            var HttpApi = function () {
                function HttpApi(options) {
                    _classCallCheck(this, HttpApi);

                    if (typeof options === 'string') {
                        options = { url: options };
                    }
                    this.options = options;
                    this.$$request = null;
                }

                _createClass(HttpApi, [{
                    key: "getOptions",
                    value: function getOptions() {
                        var _angular;

                        for (var _len2 = arguments.length, holderOptions = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                            holderOptions[_key2] = arguments[_key2];
                        }

                        return (_angular = angular).extend.apply(_angular, [{}, config, this.options].concat(holderOptions));
                    }
                }, {
                    key: "get",
                    value: function get(options) {
                        return this.$$httpRequest({}, options, "GET");
                    }
                }, {
                    key: "post",
                    value: function post(data, options) {
                        return this.$$httpRequest(data, options, "POST");
                    }
                }, {
                    key: "put",
                    value: function put(data, options) {
                        return this.$$httpRequest(data, options, "PUT");
                    }
                }, {
                    key: "delete",
                    value: function _delete(options) {
                        return this.$$httpRequest({}, options, "DELETE");
                    }
                }, {
                    key: "upload",
                    value: function upload(data, options) {
                        if (typeof data === "function") {
                            data = data();
                        }
                        options = this.getOptions(options, { data: data });
                        if (!$injector.has("Upload")) {
                            throw new Error("`ng-file-upload` dependency required!");
                        }
                        return this.realSend($injector.get("Upload").upload, options);
                    }
                }, {
                    key: "$$httpRequest",
                    value: function $$httpRequest(data, options, method) {
                        if (typeof data === "function") {
                            data = data();
                        }
                        options = this.getOptions(options, { data: data, method: method });
                        return this.realSend($http, options);
                    }
                }, {
                    key: "realSend",
                    value: function realSend(httpFunction, options) {
                        if (this.loading) {
                            if (options.concurrent === false) {
                                console.error("Can't send another request while there is another one pending");
                                return this;
                            }
                            if (options.concurrent === "abort") {
                                this.abort();
                            }
                        }
                        if (typeof options.url === "function") {
                            options.url = options.url();
                        }
                        if (this.$$request) {
                            this.$$request.registerInBg();
                        }
                        this.$$request = HttpApiRequest(this, httpFunction, options);
                        return this;
                    }
                }, {
                    key: "abort",
                    value: function abort() {
                        if (!this.$$request || this.$$request.state != "loading") {
                            return console.error("No pending request to abort");
                        }
                        return this.$$request.abort();
                    }
                }, {
                    key: "copy",
                    value: function copy() {
                        var copy = new HttpApi({});
                        angular.copy(this, copy);
                        return copy;
                    }
                }, {
                    key: "clone",
                    value: function clone() {
                        return this.copy();
                    }
                }, {
                    key: "events",
                    get: function get() {
                        return events.copy();
                    }
                }, {
                    key: "state",
                    get: function get() {
                        return this.$$request && this.$$request.state;
                    }
                }, {
                    key: "loading",
                    get: function get() {
                        return this.state == "loading";
                    }
                }, {
                    key: "done",
                    get: function get() {
                        return this.state == "done";
                    }
                }, {
                    key: "failed",
                    get: function get() {
                        return this.state == "failed";
                    }
                }, {
                    key: "aborted",
                    get: function get() {
                        return this.state == "aborted";
                    }
                }, {
                    key: "sent",
                    get: function get() {
                        return !!this.$$request;
                    }
                }, {
                    key: "response",
                    get: function get() {
                        return this.$$request && this.$$request.response;
                    }
                }, {
                    key: "data",
                    get: function get() {
                        return this.response && this.response.data;
                    }
                }, {
                    key: "status",
                    get: function get() {
                        return this.response && this.response.status;
                    }
                }, {
                    key: "statusText",
                    get: function get() {
                        return this.response && this.response.statusText;
                    }
                }, {
                    key: "progress",
                    get: function get() {
                        return this.$$request && this.$$request.progress;
                    }
                }]);

                return HttpApi;
            }();

            return function (options) {
                return new HttpApi(options);
            };
        }
    }
})();