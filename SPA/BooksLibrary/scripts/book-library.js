$(()=>{
    //App constants
    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_BJeVwPqqM';
    const appSecret = '9af859ab58164c18aca0b7bd814d622d';
    const loadingBox = $('#loadingBox');
    const infoBox = $('#infoBox');
    const errorBox = $('#errorBox');

    // Bind the navigation menu links
    $('#linkHome').on('click', ()=>showView('home'));
    $('#linkRegister').on('click', ()=>showView('register'));
    $('#linkLogin').on('click', ()=>showView('login'));
    $('#linkBooks').on('click', ()=>showView('books'));
    $('#linkCreate').on('click', ()=>showView('create'));
    $('#linkLogout').on('click', logout);

    // Bind the form submit buttons
    $('form').submit(function(event) { event.preventDefault() });
    $('#viewLogin').find('form').submit(login);
    $('#viewRegister').find('form').submit(register);
    $('#viewCreate').find('form').submit(createBook);

    infoBox.on('click', (event) => $(event.target).hide());
    errorBox.on('click', (event) => $(event.target).hide());

    $(document).on({
        ajaxStart: () => loadingBox.show(),
        ajaxStop: () => loadingBox.hide()
    });

    start();

    function start() {
        setGreeting();
        showView('home');
    }

    function showView(name) {
        $('section').hide();

        switch (name){
            case 'home': $('#viewHome').show();break;
            case 'register': $('#viewRegister').show();break;
            case 'login': $('#viewLogin').show();break;
            case 'books':
                getBooks();
                $('#viewBooks').show();
                break;
            case 'create': $('#viewCreate').show();break;
            case 'logout': $('#viewLogout').show();break;
            case 'edit': $('#viewEdit').show();break;
        }
    }

    function makeHeader(type) {
        if(type === 'basic'){
            return {
                'Authorization':'Basic ' + btoa(appKey + ':' + appSecret),
                'Content-Type':'application/json'
            }
        }
        else{
            return {
                'Authorization':'Kinvey ' + sessionStorage.getItem('authtoken'),
                'Content-Type':'application/json'
            }
        }
    }
    
    function login() {
        let username = $('#inputUsername').val();
        let password = $('#inputPassword').val();

        let req = {
            url: `${baseUrl}user/${appKey}/login`,
            method: 'POST',
            headers: makeHeader('basic'),
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: loginSuccess,
            error: handleError
        };

        $.ajax(req);
        
        function loginSuccess(data) {
            $('#viewLogin').find('form').trigger('reset');
            showInfo('Login successful');
            saveAuthInSession(data);
            setGreeting();
            showView('books');
        }
    }

    function logout() {
        let req = {
            url: `${baseUrl}user/${appKey}/_logout`,
            method: 'POST',
            headers: makeHeader('kinvey'),
            success: logoutSuccess,
            error: handleError
        };

        $.ajax(req);

        function logoutSuccess(data) {
            showInfo('Logout successful');
            sessionStorage.clear();
            setGreeting();
            showView('home');
        }
    }

    function register() {
        let username = $('#inputNewUsername').val();
        let password = $('#inputNewPassword').val();
        let confirmPassword = $('#inputNewPasswordRepeat').val();

        if(username.length === 0){
            showError('Username cannot be empty!');
            return;
        }

        if(password.length === 0){
            showError('Password cannot be empty!');
            return;
        }

        if(password !== confirmPassword){
            showError('Passwords do not match!');
            return;
        }

        let req = {
            url: `${baseUrl}user/${appKey}/`,
            method: 'POST',
            headers: makeHeader('basic'),
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: registerSuccess,
            error: handleError
        };

        $.ajax(req);

        function registerSuccess(data) {
            $('#viewRegister').find('form').trigger('reset');
            showInfo('Registration successful');
            saveAuthInSession(data);
            setGreeting();
            showView('books');
        }
    }
    
    function getBooks() {
        let tbody = $('#viewBooks').find('tbody');
        tbody.empty();

        let req = {
            url: `${baseUrl}appdata/${appKey}/books`,
            headers: makeHeader('kinvey'),
            success: displayBooks,
            error: handleError
        };

        $.ajax(req);

        function displayBooks(books) {
            for (let book of books) {
                let actions = [];
                if(book._acl.creator === sessionStorage.getItem('userId')){
                    actions.push($('<button>&#9998;</button>').on('click',() => editBook(book)));
                    actions.push($('<button>&#10006;</button>').on('click',() => deleteBook(book._id)));
                }

                let tr = $('<tr>');
                tr.append(`<td>${book.title}</td>\n`+
                    `<td>${book.author}</td>\n` +
                    `<td>${book.description}</td>\n`);
                tr.append(actions);
                tbody.append(tr);
            }
        }
    }

    function editBook(book) {
        showView('edit');
        $('#inputTitle').val(book.title);
        $('#inputAuthor').val(book.author);
        $('#inputDescr').val(book.description);

        $('#viewEdit').find('form').submit(edit);
        
        function edit() {
            let editedBook ={
                title: $('#inputTitle').val(),
                author: $('#inputAuthor').val(),
                description: $('#inputDescr').val()
            };

            if(editedBook.title.length === 0){
                showError('Title cannot be empty!');
                return;
            }

            if(editedBook.author.length === 0){
                showError('Author cannot be empty!');
                return;
            }

            let req = {
                url: `${baseUrl}appdata/${appKey}/books/${book._id}`,
                method: 'PUT',
                headers: makeHeader('kinvey'),
                data: JSON.stringify(editedBook),
                success: updateSuccess,
                error: handleError
            };

            $.ajax(req);

            function updateSuccess() {
                showInfo(`Book updated!`);
                showView('books');
            }
        }
    }

    function deleteBook(id) {
        let req = {
            url: `${baseUrl}appdata/${appKey}/books/${id}`,
            method: 'DELETE',
            headers: makeHeader('kinvey'),
            success: deleteSuccess,
            error: handleError
        };

        $.ajax(req);

        function deleteSuccess() {
            showInfo(`Book deleted!`);
            showView('books');
        }
    }
    
    function createBook() {
        let title = $('#inputNewTitle').val();
        let author = $('#inputNewAuthor').val();
        let description = $('#inputNewDescr').val();

        if(title.length === 0){
            showError('Title cannot be empty!');
            return;
        }

        if(author.length === 0){
            showError('Author cannot be empty!');
            return;
        }

        let req = {
            url: `${baseUrl}appdata/${appKey}/books`,
            method: 'POST',
            headers: makeHeader('kinvey'),
            data: JSON.stringify({
                title: title,
                author: author,
                description: description
            }),
            success: createSuccess,
            error: handleError
        };

        $.ajax(req);

        function createSuccess() {
            $('#viewCreate').find('form').trigger('reset');
            showInfo('Book created!');
            showView('books');
        }
    }
    
    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authtoken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
    }

    function setGreeting() {
        let username = sessionStorage.getItem('username');
        if(username !== null){
            $('#loggedInUser').text(`Welcome, ${username}!`);
            showHideMenuLinks(true);
        }
        else{
            $('#loggedInUser').text('');
            showHideMenuLinks(false);
        }
    }

    function showHideMenuLinks(isLoggedIn) {
        $('#linkHome').show();
        if(isLoggedIn){
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkCreate').show();
            $('#linkBooks').show();
            $('#linkLogout').show();
        }
        else{
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkCreate').hide();
            $('#linkBooks').hide();
            $('#linkLogout').hide();
        }
    }
    
    function showInfo(message) {
        infoBox.text(message);
        infoBox.show();
        setTimeout(() => infoBox.fadeOut(), 3000);
    }

    function showError(message) {
        errorBox.text(message);
        errorBox.show();
    }

    function handleError(error) {
        showError(error.responseJSON.description);
    }
});