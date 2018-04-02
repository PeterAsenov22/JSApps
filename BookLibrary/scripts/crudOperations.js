const BASE_URL = 'https://baas.kinvey.com/';
const APP_KEY = 'kid_BJeVwPqqM';
const APP_SECRET = '9af859ab58164c18aca0b7bd814d622d';
const AUTH_HEADERS = {
    'Authorization': "Basic " + btoa(APP_KEY + ":" + APP_SECRET),
    'Content-Type': 'application/json'};
const BOOKS_PER_PAGE = 10;

function loginUser() {
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

    let req = {
        url: BASE_URL + 'user/' + APP_KEY + '/login',
        method: 'POST',
        headers: AUTH_HEADERS,
        data: JSON.stringify({
            username: username,
            password: password
        })
    };

    $.ajax(req)
        .then(function (res) {
            signInUser(res, 'Login successful.');
        })
        .catch(handleAjaxError);
}

function registerUser() {
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

    let req = {
        url: BASE_URL + 'user/' + APP_KEY + '/',
        method: 'POST',
        headers: AUTH_HEADERS,
        data: JSON.stringify({
            username: username,
            password: password
        })
    };

    $.ajax(req)
        .then(function (res) {
            signInUser(res, 'Registration successful.');
        })
        .catch(handleAjaxError);
}

function listBooks() {
    let req = {
        url: BASE_URL + 'appdata/' + APP_KEY + '/books',
        headers: {
            'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken')}
    };

    $.ajax(req)
        .then(function (res) {
            displayPaginationAndBooks(res.reverse());
            showView('viewBooks');
        })
        .catch(handleAjaxError);
}


function createBook() {
    let createBookForm = $('#formCreateBook');
    let title = createBookForm.find('input[name=title]').val();
    let author = createBookForm.find('input[name=author]').val();
    let description = createBookForm.find('textarea[name=description]').val();

    if(title.length === 0){
        showError('Title cannot be empty!');
        return;
    }

    if(author.length === 0){
        showError('Author cannot be empty!');
        return;
    }

    let req = {
        url: BASE_URL + 'appdata/' + APP_KEY + '/books',
        method: 'POST',
        headers: {
            'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken'),
            'Content-Type': 'application/json'},
        data: JSON.stringify({
            title: title,
            author: author,
            description: description
        })
    };

    $.ajax(req)
        .then(function () {
            listBooks();
            showInfo('Book created.');
        })
        .catch(handleAjaxError);
}

function deleteBook(bookId) {
    let req = {
        url: BASE_URL + 'appdata/' + APP_KEY + '/books/' + bookId,
        method: 'DELETE',
        headers: {
            'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken')}
    };

    $.ajax(req)
        .then(function () {
            listBooks();
            showInfo('Book deleted.');
        })
        .catch(handleAjaxError);
}

function loadBookForEdit(book) {
    let editBookForm = $('#formEditBook');
    editBookForm.find('input[name=id]').val(book._id);
    editBookForm.find('input[name=title]').val(book.title);
    editBookForm.find('input[name=author]').val(book.author);
    editBookForm.find('textarea[name=description]').val(book.description);
    showView('viewEditBook');
}

function editBook(book) {
    let editBookForm = $('#formEditBook');
    let bookId = editBookForm.find('input[name=id]').val();

    let editedBook = {
        title: editBookForm.find('input[name=title]').val(),
        author: editBookForm.find('input[name=author]').val(),
        description: editBookForm.find('textarea[name=description]').val()
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
        url: BASE_URL + 'appdata/' + APP_KEY + '/books/' + bookId,
        method: 'PUT',
        headers: {
            'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken'),
            'Content-Type': 'application/json'},
        data: JSON.stringify(editedBook)
    };

    $.ajax(req)
        .then(function () {
            listBooks();
            showInfo('Book edited.');
        })
        .catch(handleAjaxError);
}

function saveAuthInSession(userInfo) {
    sessionStorage.setItem('username',userInfo.username);
    sessionStorage.setItem('userId', userInfo._id);
    sessionStorage.setItem('authToken', userInfo._kmd.authtoken);
}

function logoutUser() {
    let req = {
        url: BASE_URL + 'user/' + APP_KEY + '/_logout',
        method: 'POST',
        headers : {
            'Authorization': 'Kinvey ' + sessionStorage.getItem('authToken')}
    };

    $.ajax(req)
        .then(function () {
            sessionStorage.clear();
            showHideMenuLinks();
            showHomeView();
            showInfo('Logout successful.');
        })
        .catch(handleAjaxError);
}

function signInUser(user, message) {
    saveAuthInSession(user);
    showHideMenuLinks();
    showHomeView();
    showInfo(message);
}

function displayPaginationAndBooks(books) {
    let pagination = $('#pagination-demo');
    if(pagination.data("twbs-pagination")){
        pagination.twbsPagination('destroy')
    }
    pagination.twbsPagination({
        totalPages: Math.ceil(books.length / BOOKS_PER_PAGE),
        visiblePages: 5,
        next: 'Next',
        prev: 'Prev',
        onPageClick: function (event, page) {
            let table = $('#books').find('table');
            table.find('tr').each((i,e) => {
                if(i>0){
                    $(e).remove();
                }
            });
            let startBook = (page - 1) * BOOKS_PER_PAGE;
            let endBook = Math.min(startBook + BOOKS_PER_PAGE, books.length);
            $(`a:contains(${page})`).addClass('active');
            for (let i = startBook; i < endBook; i++) {
                let book = books[i];
                let actions = [];
                if(book._acl.creator === sessionStorage.getItem('userId')){
                    actions.push($('<button>&#9998;</button>').on('click',() => loadBookForEdit(book)));
                    actions.push($('<button>&#10006;</button>').on('click',() => deleteBook(book._id)));
                }

                let tr = $('<tr>');
                tr.append(`<td>${book.title}</td>\n`+
                    `<td>${book.author}</td>\n` +
                    `<td>${book.description}</td>\n`);
                tr.append(actions);
                table.append(tr);
            }
        }
    })
}

function handleAjaxError(response) {
    let errorMsg = JSON.stringify(response);
    if (response.readyState === 0)
        errorMsg = "Cannot connect due to network error.";
    if (response.responseJSON && response.responseJSON.description)
        errorMsg = response.responseJSON.description;
    showError(errorMsg)
}