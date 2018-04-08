let teamsService = (() => {
    function isLoggedIn() {
        return sessionStorage.getItem('username');
    }

    function hasTeam() {
        return sessionStorage.getItem('teamId');
    }

    function loadTeams() {
        // Request teams from db
        return requester.get('appdata', 'teams', 'kinvey');
    }

    function loadTeamDetails(teamId) {
        return requester.get('appdata', 'teams/' + teamId, 'kinvey');
    }

    function edit(teamId, name, description) {
        let teamData = {
            name: name,
            comment: description,
            author: sessionStorage.getItem('username')
        };

        return requester.update('appdata', 'teams/' + teamId, 'kinvey', teamData);
    }

    function createTeam(name, comment) {
        let teamData = {
            name: name,
            comment: comment
        };

        return requester.post('appdata', 'teams', 'kinvey', teamData);
    }


    function joinTeam(teamId) {
        let userData = {
            username: sessionStorage.getItem('username'),
            teamId: teamId
        };

        sessionStorage.setItem('teamId', teamId);

        return requester.update('user', sessionStorage.getItem('userId'), 'kinvey', userData);
    }

    function leaveTeam() {
        let userData = {
            username: sessionStorage.getItem('username'),
            teamId: ''
        };

        sessionStorage.setItem('teamId', '');

       return requester.update('user', sessionStorage.getItem('userId'), userData, 'kinvey');
    }

    function deleteTeam(teamId) {
        if(sessionStorage.getItem('teamId') === teamId){
            sessionStorage.setItem('teamId','');
        }

        return requester.remove('appdata',`teams/${teamId}`,'kinvey');
    }


    return {
        isLoggedIn,
        hasTeam,
        loadTeams,
        loadTeamDetails,
        edit,
        createTeam,
        joinTeam,
        leaveTeam,
        deleteTeam
    }
})();