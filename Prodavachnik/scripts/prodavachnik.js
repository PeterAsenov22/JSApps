function startApp() {
    const BASE_URL = 'https://baas.kinvey.com';
    const APP_KEY = 'kid_SkIofa1jz';
    const APP_SECRET = '8bf6729dffd44048aee6dd3f5e853334';

    showHideMenuLinks();
    showView('viewHome');
    attachEvents();

    function request(module,method,endpoint,data) {
        let req = {
            url: `${BASE_URL}/${module}/${APP_KEY}/${endpoint}`,
            method: method
        };

        if(module === 'user'){
            req.headers = {
                'Authorization' : 'Basic ' + btoa(APP_KEY + ':' + APP_SECRET)
            }
        }
        else if(module === 'appdata'){
            req.headers = {
                'Authorization' : 'Kinvey ' + sessionStorage.getItem('authToken')
            }
        }

        if(data !== undefined){
            req.headers['Content-Type'] = 'application/json';
            req.data = JSON.stringify(data);
        }

        return $.ajax(req);
    }

    function attachEvents() {
        // Bind the navigation menu links
        $('#linkHome').on('click',showHomeView);
        $('#linkLogin').on('click',showLoginView);
        $('#linkRegister').on('click',showRegisterView);
        $('#linkCreateAd').on('click',showCreateAdView);
        $('#linkListAds').on('click',listAds);
        $('#linkLogout').on('click',logoutUser);

        // Bind the form submit buttons
        $("form").on('submit', function(event) { event.preventDefault() });
        $('#buttonRegisterUser').on('click', registerUser);
        $('#buttonLoginUser').on('click', loginUser);
        $('#buttonCreateAd').on('click', createAd);
        $('#buttonEditAd').on('click', editAdvert);

        // Bind the info / error boxes
        $("#infoBox, #errorBox").on('click', function() {
            $(this).fadeOut()
        });

        // Attach AJAX "loading" event listener
        $(document).on({
            ajaxStart: function() { $("#loadingBox").show() },
            ajaxStop: function() { $("#loadingBox").fadeOut() }
        })
    }

    function showHideMenuLinks() {
        $('#linkHome').show();
        if(!sessionStorage.getItem('authToken')){
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkLogout').hide();
            $('#linkCreateAd').hide();
            $('#linkListAds').hide();
            $('#loggedInUser').text('');
        }
        else {
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkLogout').show();
            $('#linkCreateAd').show();
            $('#linkListAds').show();
            $('#loggedInUser').text(`Welcome, ${sessionStorage.getItem('username')}!`);
        }
    }

    function showView(viewId) {
        $('main > section').hide();
        $(`#${viewId}`).show();
    }

    function showInfo(message) {
        let infoBox = $('#infoBox');
        infoBox.text(message);
        infoBox.show();
        setTimeout(function() {
            $('#infoBox').fadeOut()
        }, 3000)
    }

    function showError(errorMsg) {
        let errorBox = $('#errorBox');
        errorBox.text("Error: " + errorMsg);
        errorBox.show()
    }

    function showHomeView() {
        showView('viewHome');
    }

    function showLoginView() {
        $('#formLogin').trigger('reset');
        showView('viewLogin');
    }

    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function showCreateAdView() {
        $('#formCreateAd').trigger('reset');
        showView('viewCreateAd');
    }

    async function registerUser() {
        let registerForm = $('#formRegister');
        let username = registerForm.find('input[name=username]').val();
        let password = registerForm.find('input[name=passwd]').val();

        if(username.length === 0){
            showError('Username cannot be empty!');
            return;
        }

        if(password.length === 0){
            showError('Password cannot be empty!');
            return;
        }

        let dataObj = {
            username: username,
            password: password
        };

        try{
            let response = await request('user','POST','',dataObj);
            signInUser(response, 'Registration successful.');
        }
        catch (error){
            handleAjaxError(error);
        }
    }

    async function loginUser() {
        let loginForm = $('#formLogin');
        let username = loginForm.find('input[name=username]').val();
        let password = loginForm.find('input[name=passwd]').val();

        if(username.length === 0){
            showError('Username cannot be empty!');
            return;
        }

        if(password.length === 0){
            showError('Password cannot be empty!');
            return;
        }

        let dataObj = {
            username: username,
            password: password
        };

        try{
            let response = await request('user','POST','login',dataObj);
            signInUser(response, 'Login successful.');
        }
        catch (error){
            handleAjaxError(error);
        }
    }

    function signInUser(user, message) {
        saveAuthInSession(user);
        showHideMenuLinks();
        showHomeView();
        showInfo(message);
    }

    async function createAd() {
        let createForm = $('#formCreateAd');
        let title = createForm.find('input[name=title]').val();
        let description = createForm.find('textarea[name=description]').val();
        let price = createForm.find('input[name=price]').val();
        let datePublished = createForm.find('input[name=datePublished]').val();
        let image = createForm.find('input[name=image]').val();

        if(title === 0 || description === 0 || price === 0 || datePublished === 0){
            showError('All input fields are required.');
            return;
        }

        let dataObj = {
            title: title,
            publisher: sessionStorage.getItem('username'),
            description: description,
            price: price,
            datePublished: datePublished,
            image: image
        };

        try{
            await request('appdata','POST','adverts',dataObj);
            await listAds();
            showInfo('Advert created successfully.');
        }
        catch (error){
            handleAjaxError(error);
        }
    }

    async function logoutUser() {
        try{
            let req = {
                url: `${BASE_URL}/user/${APP_KEY}/_logout`,
                method: 'POST',
                headers : {
                    'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken')}
            };

            await $.ajax(req);
            sessionStorage.clear();
            showHideMenuLinks();
            showHomeView();
            showInfo('Logout successful.');
        }
        catch (error){
            handleAjaxError(error);
        }
    }

    async function listAds() {
        let adsView = $('#viewAds');
        adsView.empty();
        showView('viewAds');

        try {
            let adverts = await request('appdata', 'get', 'adverts');

            if (adverts.length === 0) {
                adsView.append('<h1 class="titleForm">Advertisements</h1>');
                adsView.append('<p>No advertisements available.</p>');
            }
            else {
                let table = $('<table>');
                table.append('<tr>\n' +
                    '                    <th>Title</th>\n' +
                    '                    <th>Publisher</th>\n' +
                    '                    <th>Description</th>\n' +
                    '                    <th>Price</th>\n' +
                    '                    <th>Date Published</th>\n' +
                    '                    <th>Actions</th>\n' +
                    '                </tr>');

                for (let advert of adverts) {
                    let tr = $('<tr>');
                    tr.append(`<td>${advert.title}</td>\n` +
                        `      <td>${advert.publisher}</td>\n` +
                        `      <td>${advert.description}</td>\n` +
                        `      <td>${advert.price}</td>\n` +
                        `      <td>${advert.datePublished}</td>`);

                    let actions = $('<td>');
                    actions.append($('<a href="#">[Read More]</a>').on('click', () => readMoreInfo(advert)));

                    if (advert._acl.creator === sessionStorage.getItem('userId')) {
                        actions.append($('<a href="#">[Delete]</a>').on('click', () => deleteAdvert(advert._id)));
                        actions.append($('<a href="#">[Edit]</a>').on('click', () => loadAdvertForEdit(advert)));
                    }

                    tr.append(actions);
                    table.append(tr);
                }

                adsView.append(table);
            }
        }
        catch (error){
            handleAjaxError(error);
        }
    }

    async function deleteAdvert(advertId) {
        await request('appdata','DELETE',`adverts/${advertId}`);
        await listAds();
        showInfo('Advert deleted successfully.');
    }

    function loadAdvertForEdit(advert) {
        let editForm = $('#formEditAd');
        editForm.find('input[name=id]').val(advert._id);
        editForm.find('input[name=publisher]').val(advert.publisher);
        editForm.find('input[name=title]').val(advert.title);
        editForm.find('textarea[name=description]').val(advert.description);
        editForm.find('input[name=price]').val(advert.price);
        editForm.find('input[name=datePublished]').val(advert.datePublished);
        editForm.find('input[name=image]').val(advert.image);
        showView('viewEditAd');
    }

    async function editAdvert() {
        let editForm = $('#formEditAd');
        let id = editForm.find('input[name=id]').val();
        let title = editForm.find('input[name=title]').val();
        let description = editForm.find('textarea[name=description]').val();
        let price = editForm.find('input[name=price]').val();
        let datePublished = editForm.find('input[name=datePublished]').val();
        let image = editForm.find('input[name=image]').val();

        if(title === 0 || description === 0 || price === 0 || datePublished === 0){
            showError('All input fields are required.');
            return;
        }

        let dataObj = {
            title: title,
            publisher: sessionStorage.getItem('username'),
            description: description,
            price: price,
            datePublished: datePublished,
            image: image
        };

        try{
            await request('appdata','PUT',`adverts/${id}`,dataObj);
            await listAds();
            showInfo('Advert edited successfully.');
        }
        catch (error){
            handleAjaxError(error);
        }
    }

    function readMoreInfo(advert) {
        let imgInfo = $('#imgInfo');
        imgInfo.empty();

        imgInfo.append(`<img src="${advert.image}"/>`);
        $('#titleInfo').text(advert.title);
        $('#descriptionInfo').text(advert.description);
        $('#publisherInfo').text(advert.publisher);
        $('#dateInfo').text(advert.datePublished);

        showView('viewMore');
    }

    function saveAuthInSession(user) {
        sessionStorage.setItem('userId', user._id);
        sessionStorage.setItem('username', user.username);
        sessionStorage.setItem('authToken', user._kmd.authtoken);
    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg)
    }
}