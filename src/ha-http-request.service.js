(function () {

    angular.module("ha.http").service("HttpApiRequest", HttpApiRequestService);

    function HttpApiRequestService() {
        class HttpApiRequest {
            constructor(holder, httpFunction, options) {
                this.state = "loading";
                this.response = null;
                this.progress = null;
                this.holder = holder;
                this.inBg = false;
                this.simulateAbort = false;

                options.url = new URL(options.url, options.baseUrl || location.href).href;
                this.httpRequest = httpFunction(options);

                this.httpRequest.then(resp => {
                    this.progress = null;
                    this.response = resp;
                    this.state = "done";
                    this.callCallbacks(options, resp, [resp.status, parseInt(resp.status / 100), "resolve", "after"]);
                }, err => {
                    this.progress = null;
                    this.response = err;
                    if (err.xhrStatus === "abort") {
                        this.state = "aborted";
                        return this.callCallbacks(options, err, [err.status, parseInt(err.status / 100), "abort", "after"]);
                    }
                    this.state = "failed";
                    return this.callCallbacks(options, err, [err.status, parseInt(err.status / 100), "reject", "after"]);
                }, evt => {
                    this.progress = parseInt(evt.loaded * 1e4 / evt.total) / 100;
                });
            }

            abort(silent = false) {
                // this.simulateAbort = true; // TODO
                if (typeof this.httpRequest.abort !== "function") {
                    return silent || console.error("This request can't be aborted");
                }
                return this.httpRequest.abort();
            }

            callCallbacks(options, resp, events) {
                if (this.inBg && !options.listenBg || this.simulateAbort) {
                    return;
                }
                let _events = this.holder.events;
                for (let i = 0; i < events.length; i++) {
                    this.holder.options[events[i]] && _events.on(events[i], this.holder.options[events[i]], 50);
                    options[events[i]] && _events.on(events[i], options[events[i]], 50);
                }
                _events.emit(events, resp.data, resp.status, resp.statusText);
            }

            registerInBg() {
                this.inBg = true;
            }
        }

        return (holder, httpFunction, options) =>
            new HttpApiRequest(holder, httpFunction, options);
    }

})();