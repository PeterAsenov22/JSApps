function attachEvents() {
    const baseUrl = 'https://baas.kinvey.com/appdata/kid_HyWFl27qG/';
    const username = 'pesho';
    const password = 'pesho';
    const select = $('#posts');
    const commentsList = $('#post-comments');

    $('#btnLoadPosts').on('click',loadPosts);
    $('#btnViewPost').on('click',viewPost);

    function request(endpoint) {
        let req = {
            url: baseUrl + endpoint,
            headers: {
                'Authorization':'Basic ' + btoa(username + ':' + password)
            }
        };

        return $.ajax(req);
    }

    function loadPosts() {
        request('posts')
            .then(fillOptions)
            .catch(handleError);

        function fillOptions(data) {
            select.empty();
            for (let obj of data) {
                select.append($('<option>').text(obj.title).val(obj._id));
            }
        }
    }
    
    async function viewPost() {
        let postId = select.find('option:selected').val();

        let postPromise = request('posts/' + postId);
        let commentsPromise = request(`comments/?query={"postId":"${postId}"}`);

        try{
            let [post,comments] = await Promise.all([postPromise,commentsPromise]);

            $('#post-title').text(post.title);
            $('#post-body').text(post.body);

            commentsList.empty();
            for (let comment of comments) {
                commentsList.append($('<li>').text(comment.text));
            }
        }
        catch(error){
            handleError(error);
        }
    }

    function handleError(reason) {
        console.log(reason);
    }
}