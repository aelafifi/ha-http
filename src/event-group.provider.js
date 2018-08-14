(function () {

    angular.module("ha.http").provider("$eventGroup", $eventGroupService);

    function $eventGroupService() {
        this.get = () => new EventGroups();
        this.$get = () => () => new EventGroups();
    }

    class EventGroups {
        constructor() {
            this.eventGroups = {};
        }

        /**
         * `.on(event, callback[, priority = 0])`
         * `.on(event, {priority: callback, ...})`
         * `.on(event, {priority: [callback, ...], ...})`
         * `.on(event, [callback, ...][, priority = 0])`
         */
        on(event, callback, priority) {
            let callbacks = [];
            if (typeof callback === "object" && !Array.isArray(callback)) {
                for (let priority in callback) {
                    let realCallback = callback[priority];
                    if (Array.isArray(realCallback)) {
                        for (let i = 0; i < realCallback.length; i++) {
                            callbacks.push([priority, realCallback[i]]);
                        }
                    } else {
                        callbacks.push([priority, realCallback]);
                    }
                }
            } else if (Array.isArray(callback)) {
                for (let i = 0; i < callback.length; i++) {
                    callbacks.push([priority, callback[i]]);
                }
            } else {
                callbacks.push([priority, callback]);
            }
            if (!this.eventGroups[event]) {
                this.eventGroups[event] = [];
            }
            for (let i = 0; i < callbacks.length; i++) {
                this.eventGroups[event].push({
                    priority: callbacks[i][0] || 0,
                    callback: callbacks[i][1],
                });
            }
            return () => this.off(event, callbacks);
        }

        /**
         * `.of("eventName")`
         * `.of("eventName", callback)`
         * `.of("eventName", [callback, ...])`
         */
        off(event, callback) {
            if (typeof callback === "undefined") {
                this.eventGroups[event] = [];
                return;
            }

            if (!this.eventGroups[event]) {
                return;
            }

            let group = this.eventGroups[event];
            let i = 0;
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
        emit(events, ...data) {
            if (!Array.isArray(events)) {
                events = [events];
            }

            let preventGroup = false;
            let preventAll = false;

            let preventer = {
                preventGroup: () => preventGroup = true,
                preventAll: () => preventAll = true,
            };

            for (let i = 0; i < events.length; i++) {
                let group = this.eventGroups[events[i]];
                if (!group) {
                    continue;

                }
                // start group
                group.sort((a, b) => a.priority - b.priority);
                for (let j = 0; j < group.length; j++) {
                    group[j].callback.call(preventer, ...data);

                    if (preventGroup || preventAll) {
                        preventGroup = false;
                        break;
                    }
                }

                if (preventAll) {
                    break;
                }
            }
        }

        copy() {
            let copy = new EventGroups();
            angular.copy(this, copy);
            return copy;
        }

        clone() {
            return this.copy();
        }
    }

})();
