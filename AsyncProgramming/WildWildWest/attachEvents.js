function attachEvents() {
    const baseUrl = 'https://baas.kinvey.com/appdata/kid_BJDOS6ocG/';
    const username = 'pesho';
    const password = 'pesho';

    const canvasContainer = $('body').find('canvas');
    const playersContainer = $('#players');
    const saveBtn = $('#save');
    const reloadBtn = $('#reload');
    const addPlayerBtn = $('#addPlayer');

    let currentPlayer = undefined;

    addPlayerBtn.on('click',addPlayer);
    saveBtn.on('click', savePlayerProgress);
    reloadBtn.on('click', reloadPlayer);

    loadPlayers();

    function request(endpoint, method, data) {
        let req = {
            url: baseUrl + endpoint,
            method: method,
            headers: {
                'Authorization': `Basic ` + btoa(username + ':' + password),
                'Content-Type':'application/json'
            }
        };

        if(data !== undefined){
            req.data = JSON.stringify(data);
        }

        return $.ajax(req);
    }

    async function loadPlayers() {
        try {
            playersContainer.empty();
            playersContainer.append($('<p>Loading...</p>'));
            let players = await request('players', 'GET');

            playersContainer.empty();
            for (let player of players) {
                let div = $(`<div class="player" data-id="${player._id}"></div>`);
                div.append('<div class="row">\n' +
                    '                <label>Name:</label>\n' +
                    `                <label class="name">${player.name}</label>\n` +
                    '            </div>\n' +
                    '            <div class="row">\n' +
                    '                <label>Money:</label>\n' +
                    `               <label class="money">${player.money}</label>\n` +
                    '            </div>\n' +
                    '            <div class="row">\n' +
                    '                <label>Bullets:</label>\n' +
                    `                <label class="bullets">${player.bullets}</label>\n` +
                    '            </div>');

                let playBtn = $('<button class="play">Play</button>').on('click', async () => {
                    try{
                        //saving current player progress
                        await savePlayerProgress();

                        //loading new player game
                        currentPlayer = player;
                        loadCanvas(player);
                        $('#buttons').find('button').css('display', 'inline');
                        canvasContainer.css('display', 'block');
                    }
                    catch(error){
                        handleError(error);
                    }
                });

                let deleteBtn = $('<button class="delete">Delete</button>').on('click', async (event) => {
                    //loading
                    playersContainer.empty();
                    playersContainer.append($('<p>Loading...</p>'));

                    let div = $(event.target).parent();
                    let id = div.attr('data-id');

                    try{
                        await request(`players/${id}`, 'DELETE');
                        await loadPlayers();
                    }
                    catch (error){
                        handleError(error);
                    }
                });

                div.append(playBtn);
                div.append(deleteBtn);
                playersContainer.append(div);
            }
        }
        catch (error){
            handleError(error)
        }
    }
    
    async function savePlayerProgress() {
        if(currentPlayer !== undefined){
            try {
                //loading
                playersContainer.empty();
                playersContainer.append($('<p>Loading...</p>'));

                //hide game
                $('#buttons').find('button').css('display', 'none');
                canvasContainer.css('display', 'none');

                //stop game
                let canvas = document.getElementById("canvas");
                clearInterval(canvas.intervalId);
                //save current player result
                await request(`players/${currentPlayer._id}`, 'PUT', currentPlayer);
                await loadPlayers();
                currentPlayer = undefined;
            }
            catch (error){
                handleError(error);
            }
        }
    }

    function reloadPlayer() {
        if(currentPlayer !== undefined){
            currentPlayer.money -= 60;
            currentPlayer.bullets += 6;
        }
    }

    async function addPlayer() {
        playersContainer.empty();
        playersContainer.append($('<p>Loading...</p>'));
        let nameField = $('#addName');

        let player = {
            name: nameField.val(),
            money: 500,
            bullets: 6
        };

        nameField.val('');

        try{
           await request('players','POST',player);
           await loadPlayers();
        }
        catch (error){
            handleError(error);
        }
    }

    function handleError(error) {
        $('#buttons').find('button').css('display','none');
        canvasContainer.css('display','none');
        playersContainer.empty();
        playersContainer.append($('<p>Error</p>'));
        console.log(error);
    }
}