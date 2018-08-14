(function () {

    let haHttp = angular.module("ha.http", []);

    try {
        angular.module("ngFileUpload");
        haHttp.requires.push("ngFileUpload");
        haHttp.canUpload = true;
    } catch (e) {
        haHttp.canUpload = false;
    }

})();