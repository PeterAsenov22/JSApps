function attachEvents() {
    const baseUrl = 'https://baas.kinvey.com/appdata/kid_SJg8fK85G/';
    const username = 'pesho';
    const password = 'pesho';

    const addFormContainer = $('#addForm');
    const catchesContainer = $('#catches');

    //InputFields
    const anglerField = addFormContainer.find('.angler');
    const weightField = addFormContainer.find('.weight');
    const speciesField = addFormContainer.find('.species');
    const locationField = addFormContainer.find('.location');
    const baitField = addFormContainer.find('.bait');
    const timeField = addFormContainer.find('.captureTime');

    //Attach events
    $('.load').on('click',loadCatches);
    $('.add').on('click',addCatch);

    function request(method,endpoint,data) {
        let req = {
            url: baseUrl + endpoint,
            method: method,
            headers:{
                'Authorization':'Basic ' + btoa(username + ':' + password)
            }
        };

        if(method !== 'GET'){
            req.headers['Content-Type'] = 'application/json'
        }

        if(data !== undefined){
            req.data = data;
        }

        return $.ajax(req);
    }

    async function loadCatches() {
        displayLoading();
        try{
            let allCatches = await request('GET','biggestCatches');
            catchesContainer.empty();
            for (let catched of allCatches) {
                let div = $(`<div class="catch" data-id="${catched._id}">\n` +
                    `            <label>Angler</label>\n` +
                    `            <input type="text" class="angler" value="${catched.angler}"/>\n` +
                    `            <label>Weight</label>\n` +
                    `            <input type="number" class="weight" value="${catched.weight}"/>\n` +
                    `            <label>Species</label>\n` +
                    `            <input type="text" class="species" value="${catched.species}"/>\n` +
                    `            <label>Location</label>\n` +
                    `            <input type="text" class="location" value="${catched.location}"/>\n` +
                    `            <label>Bait</label>\n` +
                    `            <input type="text" class="bait" value="${catched.bait}"/>\n` +
                    `            <label>Capture Time</label>\n` +
                    `            <input type="number" class="captureTime" value="${catched.captureTime}"/>\n` +
                    `        </div>\n`);

                let updateBtn = $('<button class="update">Update</button>').on('click',updateCatch);
                let deleteBtn = $('<button class="delete">Delete</button>').on('click', deleteCatch);

                div.append(updateBtn);
                div.append(deleteBtn);

                catchesContainer.append(div);
            }
        }
        catch(error){
            handleError(error)
        }
    }
    
    async function addCatch() {
        if(anglerField.val() !== '' && weightField.val() !== ''
            && speciesField.val() !== '' && locationField.val() !== ''
            && baitField.val() !== '' && timeField.val() !== ''){

            let catchObj = {
                angler: anglerField.val(),
                weight: Number(weightField.val()),
                species: speciesField.val(),
                location: locationField.val(),
                bait: baitField.val(),
                captureTime: Number(timeField.val())
            };

            clearInputFields();

            try{
                displayLoading();
                await request('POST','biggestCatches',JSON.stringify(catchObj));
                await loadCatches();
            }
            catch(error){
                handleError(error)
            }
        }
    }

    async function updateCatch() {
        let div = $(this).parent();
        let id = div.attr('data-id');

        let updatedObj = {
            angler: div.find('.angler').val(),
            weight: div.find('.weight').val(),
            species: Number(div.find('.species').val()),
            location: div.find('.location').val(),
            bait: div.find('.bait').val(),
            captureTime: Number(div.find('.captureTime').val())
        };

        try{
            displayLoading();
            await request('PUT',`biggestCatches/${id}`,JSON.stringify(updatedObj));
            await loadCatches();
        }
        catch(error) {
            handleError(error)
        }
    }

    async function deleteCatch() {
        let div = $(this).parent();
        let id = div.attr('data-id');

        try{
            displayLoading();
            await request('DELETE',`biggestCatches/${id}`);
            await loadCatches();
        }
        catch(error) {
            handleError(error)
        }
    }

    function handleError(error) {
        console.log('Error: ' + error)
    }

    function clearInputFields() {
        anglerField.val('');
        weightField.val('');
        speciesField.val('');
        locationField.val('');
        baitField.val('');
        timeField.val('');
    }

    function displayLoading() {
        catchesContainer.empty();
        catchesContainer.append($('<div>Loading...</div>'));
    }
}