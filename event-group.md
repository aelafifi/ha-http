```javascript
function SomeController($eventGroup) {
    let group = $eventGroup();

    group.on("event1", {
        30: function () { console.log("Event 1 - Priority 30"); },
        10: function () { console.log("Event 1 - Priority 10"); },
        20: function () { console.log("Event 1 - Priority 20"); this.preventGroup(); },
    });

    group.on("event2", {
        30: function () { console.log("Event 2 - Priority 30"); },
        10: function () { console.log("Event 2 - Priority 10"); },
        20: function () { console.log("Event 2 - Priority 20"); this.preventAll(); },
    });

    group.on("event3", {
        10: function () { console.log("Event 3 - Priority 10"); },
        30: function () { console.log("Event 3 - Priority 30"); },
        20: function () { console.log("Event 3 - Priority 20"); },
    });

    group.emit(["event1", "event2", "event3"]);
    /** Output:
     * Event 1 - Priority 10
     * Event 1 - Priority 20 // break group
     * Event 2 - Priority 10
     * Event 2 - Priority 20 // break all
     */
}
```