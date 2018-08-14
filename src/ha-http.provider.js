(function () {

    angular.module("ha.http").provider("$httpApi", $httpApiProvider);

    $httpApiProvider.$inject = [
        "$injector",
        "$eventGroupProvider",
    ];

    function $httpApiProvider($injector, $eventGroupProvider) {
        let config = {
            consurrent: false,
            baseUrl: location.href,
            data: {},
            listenBg: true,
        };

        this.setDefaults = defaults => angular.extend(config, defaults);

        let events = $eventGroupProvider.get();

        this.on = events.on.bind(events);
        this.off = events.off.bind(events);

        this.$get = $httpApiService;

        $httpApiService.$inject = [
            "$http",
            "HttpApiRequest",
        ];

        function $httpApiService($http, HttpApiRequest) {
            class HttpApi {
                constructor(options) {
                    if (typeof options === 'string') {
                        options = {url: options};
                    }
                    this.options = options;
                    this.$$request = null;
                }

                getOptions(...holderOptions) {
                    return angular.extend({}, config, this.options, ...holderOptions);
                }

                get(options) {
                    return this.$$httpRequest({}, options, "GET");
                }

                post(data, options) {
                    return this.$$httpRequest(data, options, "POST");
                }

                put(data, options) {
                    return this.$$httpRequest(data, options, "PUT");
                }

                delete(options) {
                    return this.$$httpRequest({}, options, "DELETE");
                }

                upload(data, options) {
                    if (typeof data === "function") {
                        data = data();
                    }
                    options = this.getOptions(options, {data});
                    if (!$injector.has("Upload")) {
                        throw new Error("`ng-file-upload` dependency required!");
                    }
                    return this.realSend($injector.get("Upload").upload, options);
                }

                $$httpRequest(data, options, method) {
                    if (typeof data === "function") {
                        data = data();
                    }
                    options = this.getOptions(options, {data, method});
                    return this.realSend($http, options);
                }

                realSend(httpFunction, options) {
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

                abort() {
                    if (!this.$$request || this.$$request.state != "loading") {
                        return console.error("No pending request to abort");
                    }
                    return this.$$request.abort();
                }

                get events() {
                    return events.copy();
                }

                get state() {
                    return this.$$request && this.$$request.state;
                }

                get loading() {
                    return this.state == "loading";
                }

                get done() {
                    return this.state == "done";
                }

                get failed() {
                    return this.state == "failed";
                }

                get aborted() {
                    return this.state == "aborted";
                }

                get sent() {
                    return !!this.$$request;
                }

                get response() {
                    return this.$$request && this.$$request.response;
                }

                get data() {
                    return this.response && this.response.data;
                }

                get status() {
                    return this.response && this.response.status;
                }

                get statusText() {
                    return this.response && this.response.statusText;
                }

                get progress() {
                    return this.$$request && this.$$request.progress;
                }

                copy() {
                    let copy = new HttpApi({});
                    angular.copy(this, copy);
                    return copy;
                }

                clone() {
                    return this.copy();
                }
            }

            return (options) => new HttpApi(options);
        }
    }

})();