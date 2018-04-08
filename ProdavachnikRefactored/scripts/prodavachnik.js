async function startApp() {
    const main = $('main');
    const templates = {};

    await loadTemplates();
    attachNotifications();
    showHideLinks();
    showView('home');

    async function loadTemplates() {
        const [
            homeViewTemplate,
            loginViewTemplate,
            registerViewTemplate,
            listAdsViewTemplate,
            createViewTemplate,
            editViewTemplate,
            detailsViewTemplate,
            headerTemplate,
            adsCatalogTemplate,
            adBoxTemplate
        ] = await Promise.all([
            $.get('./templates/home-view-template.html'),
            $.get('./templates/login-view-template.html'),
            $.get('./templates/register-view-template.html'),
            $.get('./templates/listAds-view-template.html'),
            $.get('./templates/createAd-view-template.html'),
            $.get('./templates/editAd-view-template.html'),
            $.get('./templates/details-view-template.html'),
            $.get('./templates/header-template.html'),
            $.get('./templates/ads-catalog.html'),
            $.get('./templates/ad-box-partial.html'),
        ]);

        Handlebars.registerPartial('adBox', adBoxTemplate);
        templates.catalog = Handlebars.compile(adsCatalogTemplate);
        templates.header = Handlebars.compile(headerTemplate);
        templates.views = {
            homeView: Handlebars.compile(homeViewTemplate),
            loginView: Handlebars.compile(loginViewTemplate),
            registerView: Handlebars.compile(registerViewTemplate),
            listAdsView: Handlebars.compile(listAdsViewTemplate),
            createView: Handlebars.compile(createViewTemplate),
            editView: Handlebars.compile(editViewTemplate),
            detailsView: Handlebars.compile(detailsViewTemplate),
        }
    }
    
    function showHideLinks() {
        let greeting = '';
        let pageHeaders = window.pageHeaders.mainPageHeaders;
        let authToken = localStorage.getItem('authtoken');

        if(authToken){
            pageHeaders = window.pageHeaders.authPageHeaders;
            greeting = 'Welcome, ' + localStorage.getItem('username') + '!';
        }

        let html = templates.header({headers: pageHeaders, greeting: greeting});

        let appContainer = $('#app');
        appContainer.empty();
        appContainer.append(html);

        attachEventListenersToLinks();
    }

    function showView(view) {
        main.empty();
        switch (view) {
            case 'home':
                main.append(templates.views.homeView());
                break;
            case 'login':
                main.append(templates.views.loginView());
                $('#buttonLoginUser').click(login);
                break;
            case 'register':
                main.append(templates.views.registerView());
                $('#buttonRegisterUser').click(register);
                break;
            case 'ads':
                main.append(templates.views.listAdsView());
                loadAds();
                break;
            case 'create':
                main.append(templates.views.createView());
                $('#buttonCreateAd').click(createAd);
                break;
            case 'edit':
                main.append(templates.views.editView());
                $('#buttonEditAd').click(editAd);
                break;
            case 'details':
                main.append(templates.views.detailsView());
                break;
        }
    }

    function attachEventListenersToLinks() {
        $('#linkHome').click(() => showView('home'));
        $('#linkLogin').click(() => showView('login'));
        $('#linkRegister').click(() => showView('register'));
        $('#linkListAds').click(() => showView('ads'));
        $('#linkCreateAd').click(() => showView('create'));
        $('#linkLogout').click(logout);
    }

    function attachNotifications() {
        $(document).on({
            ajaxStart: () => $('#loadingBox').show(),
            ajaxStop: () => $('#loadingBox').fadeOut()
        });

        $('#infoBox').click((event) => $(event.target).hide());
        $('#errorBox').click((event) => $(event.target).hide());
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(() => $('#infoBox').fadeOut(), 3000);
    }

    function showError(message) {
        $('#errorBox').text(message);
        $('#errorBox').show();
    }

    function handleError(reason) {
        showError(reason.responseJSON.description);
    }

    let requester = (() => {
        const baseUrl = 'https://baas.kinvey.com/';
        const appKey = 'kid_Hy-wNpePZ';
        const appSecret = '82945baf3467420a9f9888b3360a9270';

        function makeAuth(type) {
            if (type === 'basic') return 'Basic ' + btoa(appKey + ':' + appSecret);
            else return 'Kinvey ' + localStorage.getItem('authtoken');
        }

        function makeRequest(method, module, url, auth) {
            return req = {
                url: baseUrl + module + '/' + appKey + '/' + url,
                method,
                headers: {
                    'Authorization': makeAuth(auth)
                }
            };
        }

        function get(module, url, auth) {
            return $.ajax(makeRequest('GET', module, url, auth));
        }

        function post(module, url, data, auth) {
            let req = makeRequest('POST', module, url, auth);
            req.data = JSON.stringify(data);
            req.headers['Content-Type'] = 'application/json';
            return $.ajax(req);
        }

        function update(module, url, data, auth) {
            let req = makeRequest('PUT', module, url, auth);
            req.data = JSON.stringify(data);
            req.headers['Content-Type'] = 'application/json';
            return $.ajax(req);
        }

        function remove(module, url, auth) {
            return $.ajax(makeRequest('DELETE', module, url, auth));
        }

        return {
            get, post, update, remove
        }
    })();

    function saveSession(data) {
        localStorage.setItem('username', data.username);
        localStorage.setItem('id', data._id);
        localStorage.setItem('authtoken', data._kmd.authtoken);
    }

    async function login() {
        let form = $('#formLogin');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        try {
            let data = await requester.post('user', 'login', {username, password}, 'basic');
            saveSession(data);
            showHideLinks();
            showView('ads');
            showInfo('Logged in');
        } catch (err) {
            handleError(err);
        }
    }

    async function register() {
        let form = $('#formRegister');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        try {
            let data = await requester.post('user', '', {username, password}, 'basic');
            showInfo('Registered');
            saveSession(data);
            showView('ads');
        } catch (err) {
            handleError(err);
        }
    }

    async function logout() {
        try {
            await requester.post('user', '_logout', {authtoken: localStorage.getItem('authtoken')});
            localStorage.clear();
            showHideLinks();
            showView('home');
            showInfo('Logged out');
        } catch (err) {
            handleError(err);
        }
    }

    async function loadAds() {
        let content = $('#content');
        content.empty();

        let ads = await requester.get('appdata', 'posts');
        ads.forEach(a => {
            if(a._acl.creator === localStorage.getItem('id')){
                a.isAuthor = true;
            }
        });

        let context = {
            ads
        };

        let html = templates.catalog(context);
        content.html(html);

        let editButtons = content.find('.ad-box').find('.edit');
        editButtons.on('click', openEditAd);

        let deleteButtons = content.find('.ad-box').find('.delete');
        deleteButtons.on('click', deleteAd);
    }

    async function deleteAd() {
        let adId = $(this).parent().attr('data-id');
        await requester.remove('appdata', 'posts/' + adId);
        showInfo('Ad deleted');
        showView('ads');
    }

    async function openEditAd() {
        showView('edit');
        let adId = $(this).parent().attr('data-id');
        let ad = await requester.get('appdata',`posts/${adId}`);

        let form = $('#formEditAd');
        form.find('input[name="title"]').val(ad.title);
        form.find('textarea[name="description"]').val(ad.description);
        form.find('input[name="price"]').val(Number(ad.price));
        form.find('input[name="image"]').val(ad.imageUrl);

        form.find('input[name="id"]').val(ad._id);
        form.find('input[name="publisher"]').val(ad.publisher);
        form.find('input[name="date"]').val(ad.date);
    }

    async function editAd() {
        let form = $('#formEditAd');
        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price = form.find('input[name="price"]').val();
        let imageUrl = form.find('input[name="image"]').val();
        let id = form.find('input[name="id"]').val();
        let publisher = form.find('input[name="publisher"]').val();
        let date = form.find('input[name="date"]').val();

        if (title.length === 0) {
            showError('Title cannot be empty');
            return;
        }
        if (Number.isNaN(price)) {
            showError('Price cannot be empty');
            return;
        }

        let editedAd = {
            title, description, price, imageUrl, date, publisher
        };

        try {
            await requester.update('appdata', 'posts/' + id, editedAd);
            showInfo('Ad editted');
            showView('ads');
        } catch (err) {
            handleError(err);
        }
    }

    async function createAd() {
        let form = $('#formCreateAd');
        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price = Number(form.find('input[name="price"]').val());
        let imageUrl = form.find('input[name="image"]').val();
        let date = (new Date()).toString('yyyy-MM-dd');
        let publisher = localStorage.getItem('username');

        if (title.length === 0) {
            showError('Title cannot be empty');
            return;
        }
        if (Number.isNaN(price)) {
            showError('Price cannot be empty');
            return;
        }

        let newAd = {
            title, description, price, imageUrl, date, publisher
        };

        try {
            await requester.post('appdata', 'posts', newAd);
            showInfo('Ad created');
            showView('ads');
        } catch (err) {
            handleError(err);
        }
    }
}