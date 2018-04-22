let auth = (() => {
    function saveSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authtoken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
    }

    function isLoggedIn() {
        return sessionStorage.getItem('username');
    }

    function isAuth() {
        return sessionStorage.getItem('authtoken');
    }

    // user/login
    function login(username, password) {
        let userData = {
            username,
            password
        };

        return requester.post('user', 'login', 'basic', userData);
    }

    // user/register
    function register(username, password) {
        let userData = {
            username,
            password
        };

        return requester.post('user', '', 'basic', userData);
    }

    // user/logout
    function logout() {
        let logoutData = {
            authtoken: sessionStorage.getItem('authtoken')
        };

        return requester.post('user', '_logout', 'kinvey', logoutData);
    }

    function handleError(reason) {
        showError(reason.responseJSON.description);
    }

    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    function showInfo(message) {
        $('.notification').css('display','none');
        let infoBox = $('#infoBox');
        infoBox.find('span').text(message);
        infoBox.css('display','block');

        infoBox.on('click', function() {
            $(this).css('display','none');
        });
        setTimeout(() => infoBox.fadeOut(), 3000);
    }

    function showError(message) {
        $('.notification').css('display','none');
        let errorBox = $('#errorBox');
        errorBox.find('span').text(message);

        errorBox.css('display','block');
        errorBox.on('click', function() {
            $(this).css('display','none');
        });
    }

    return {
        login,
        register,
        logout,
        saveSession,
        showInfo,
        showError,
        handleError,
        isLoggedIn,
        isAuth
    }
})();