$(() => {
    //Application constants
    const baseUrl = 'https://baas.kinvey.com/appdata/kid_HyWFl27qG/';
    const username = 'pesho';
    const password = 'pesho';

    //DOM Elements
    const select = $('#selected');
    const content = $('#content');

    //Add Event Listeners
    select.on('change',viewPost);

    loadPosts();

    function request(endpoint) {
        let req = {
            url: baseUrl + endpoint,
            headers:{
                'Authorization':'Basic ' + btoa(username + ':' + password)
            }
        };

        return $.ajax(req);
    }

    async function loadPosts() {
        select.empty();
        select.append($('<option>').text('Loading...'));
        select.prop('disabled',true);

        try{
            let data = await request('posts');
            select.empty();
            for (let post of data) {
                select.append($('<option>').text(post.title).val(post._id));
            }

            if(data.length !== 0){
                viewPost();
            }
        }
        catch(error){
            handleError(error);
        }
        finally {
            select.prop('disabled',false);
        }
    }

    async function viewPost() {
        $('#selected').prop('disabled',true);
        content.empty();
        content.append($('<span><i>Loading...</i></span>'));

        let postId = select.find('option:selected').val();

        let postPromise = request('posts/' + postId);
        let commentsPromise = request(`comments/?query={"postId":"${postId}"}`);

        try{
            let [data,comments] = await Promise.all([postPromise,commentsPromise]);

            content.empty();
            content.append($(`<h1>${data.title}</h1>`));
            content.append($(`<p>${data.body}</p>`));
            content.append($(`<h2>Comments</h2>`));

            let ul = $('<ul>');
            if(comments.length === 0){
                ul.append($('<li>').text('No comments yet!'));
            }
            else {
                for (let comment of comments) {
                    ul.append($('<li>').text(comment.text));
                }
            }

            content.append(ul);
        }
        catch(error) {
           handleError(error)
        }
        finally {
           select.prop('disabled',false);
        }
    }

    function handleError(reason) {
        content.html(`<p>Error: ${reason.statusText}</p>`);
    }
});