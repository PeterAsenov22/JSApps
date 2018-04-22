let chirpService = (() => {
    function loadChirpsFromSubscriptions(subs) {
        return requester.get('appdata', `chirps?query={"author":{"$in": ${subs}}}&sort={"_kmd.ect": 1}`, 'kinvey');
    }

    function loadChirpsByUsername(username) {
        return requester.get('appdata', `chirps?query={"author":"${username}"}`, 'kinvey');
    }

    function createChirp(author, text) {
        let chirpObj = {
            author,
            text
        };

        return requester.post('appdata', 'chirps', 'kinvey', chirpObj);
    }


    function deleteChirp(chirpId) {
        return requester.remove('appdata',`chirps/${chirpId}`,'kinvey');
    }


    return {
        loadChirpsFromSubscriptions,
        loadChirpsByUsername,
        createChirp,
        deleteChirp
    }
})();