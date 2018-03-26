function attachEvents() {
    const url = 'https://messenger-f309e.firebaseio.com/messenger.json';
    const sendBtn = $('#submit');
    const refreshBtn = $('#refresh');
    const textArea = $('#messages');
    const authorField = $('#author');
    const contentField = $('#content');

    sendBtn.on('click',sendMessage);
    refreshBtn.on('click',refresh);
    showConversation();

    function sendMessage() {
        let author = authorField.val();
        let content = contentField.val();

        if(author !== '' && content != ''){
            authorField.val('');
            contentField.val('');

            let message = {
                author: author,
                content: content,
                timestamp: Date.now()
            };

            let req = {
                url: url,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(message),
                error: displayError
            };

            $.ajax(req);
        }
    }

    function refresh() {
        showConversation();
    }

    function showConversation() {
        let req = {
            url: url,
            success: displayLog,
            error: displayError
        };

        $.ajax(req);
    }

    function displayLog(data) {
        textArea.empty();

        for (let key in data) {
            textArea.append(`${data[key].author}: ${data[key].content}\n`);
        }
    }

    function displayError() {
        textArea.empty();
        textArea.append('Error\n');
    }
}

