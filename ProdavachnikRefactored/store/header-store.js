(function () {
    class Header {
        constructor(id, label) {
            this.id = id;
            this.label = label;
        }
    }

    let mainPageHeaders = [
        new Header('linkHome','Home'),
        new Header('linkLogin','Login'),
        new Header('linkRegister','Register'),
    ];

    let authPageHeaders = [
        new Header('linkHome','Home'),
        new Header('linkListAds','List Advertisements'),
        new Header('linkCreateAd','Create Advertisement'),
        new Header('linkLogout','Logout'),
    ];

    window.pageHeaders = {
        mainPageHeaders,
        authPageHeaders
    }
})();