let auth = (() => {
    function saveSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authtoken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        let subscriptions = userInfo.subscriptions;
        sessionStorage.setItem('subscriptions', JSON.stringify(subscriptions));
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
            password,
            subscriptions: [ ]
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

    function loadAllUsers() {
        return requester.get('user', ``, 'kinvey');
    }

    function loadUserByUsername(username) {
        return requester.get('user', `?query={"username":"${username}"}`, 'kinvey');
    }

    function loadFollowersByUsername(username) {
        return requester.get('user', `?query={"subscriptions":"${username}"}`, 'kinvey');
    }
    
    function updateSubscriptions(userId, subs) {
        return requester.update('user',`${userId}`,'kinvey',{subscriptions: subs})
    }

    return {
        login,
        register,
        logout,
        saveSession,
        isAuth,
        loadUserByUsername,
        loadFollowersByUsername,
        loadAllUsers,
        updateSubscriptions
    }
})();