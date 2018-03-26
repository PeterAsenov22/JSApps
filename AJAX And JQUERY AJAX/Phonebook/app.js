$(()=>{
    const baseUrl = "https://phonebook-eee08.firebaseio.com/phonebook";
    const list = $('#list');
    const nameInputField = $('#crtName');
    const phoneInputField = $('#crtPhone');
    const notification = $('#notification');
    const button = $('#btnCreate');

    button.on('click',create);
    loadContacts();

    function loadContacts() {
        let req = {
            url: baseUrl + ".json",
            success: displayContacts
        };

        $.ajax(req);
    }

    function displayContacts(data) {
        list.empty();
        for (let key in data) {
            let html = $(`<li><span>${data[key].name}: ${data[key].phone}</span> </li>`);
            html.append($('<button>Delete</button>').on('click',()=>deleteContact(key)));
            list.append(html);
        }
    }
    
    function create() {
        button.prop('disabled',true);
        if (nameInputField.val() === ''){
            notify('Name cannot be empty!','error');
            clearFields();
        }
        else if(phoneInputField.val() === ''){
            notify('Phone cannot be empty!','error');
            clearFields();
        }
        else{
            let contact = {
                name: nameInputField.val(),
                phone: phoneInputField.val()
            };

            clearFields();

            let req = {
                url: baseUrl + ".json",
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(contact),
                success: () => {
                    notify('Created', 'success');
                    loadContacts()
                },
                error: displayError
            };

            $.ajax(req);
        }

        button.prop('disabled',false);
    }
    
    function deleteContact(key) {
        let req = {
            url: baseUrl + `/${key}.json`,
            method: "DELETE",
            success: ()=>{notify('Deleted','info'); loadContacts();},
            error: displayError
        };

        $.ajax(req);
    }

    function displayError(err) {
       notify('Error: ' + err.statusText);
    }

    function notify(message, type) {
        notification.text(message);
        notification.css('display','block');

        switch (type){
            case "error": notification.css('background','#991111'); break;
            case "info": notification.css('background', '#111199'); break;
            case "success": notification.css('background', '#119911'); break;
        }

        setTimeout(()=>{
            notification.css('display','none');
        },2000);
    }

    function clearFields() {
        nameInputField.val('');
        phoneInputField.val('');
    }
});

