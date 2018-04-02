(function () {
    let message = 'Knock Knock.';
    const baseUrl = 'https://baas.kinvey.com/appdata/kid_BJXTsSi-e/knock';
    const username = 'guest';
    const password = 'guest';
    const base64auth = btoa(username+':'+password);
    const headers = {
        'Authorization':'Basic ' + base64auth,
        'Content-Type':'application/json'
    };

    const messagesContainer = $('#messages');

    $('#btnLoad').on('click',display);

    function display() {
        let req ={
            url: baseUrl + `?query=${message}`,
            headers : headers
        };

        $.ajax(req)
            .then(showMessage)
            .catch(handleError)
    }

    function showMessage(data) {
        message = data.message;
        if(data.answer !== undefined){
            messagesContainer.append($('<li>').text(`Message: ${message} Answer: ${data.answer}`))
        }
    }

    function handleError(error) {
        console.log(error);
    }
})();