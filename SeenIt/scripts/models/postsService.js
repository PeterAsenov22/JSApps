let postsService = (() => {
    function loadPosts() {
        // Request posts from db
        return requester.get('appdata', 'posts', 'kinvey');
    }

    function loadMyPosts() {
        // Request my posts from db
        return requester.get('appdata', `posts?query={"author":"${sessionStorage.getItem('username')}"}&sort={"_kmd.ect": -1}`, 'kinvey');
    }

    function loadPostDetails(postId) {
        return requester.get('appdata', 'posts/' + postId, 'kinvey');
    }

    function edit(postId, url, title, image, description) {
        let postObj = {
            url: url,
            title: title,
            imageUrl: image,
            description: description,
            author: sessionStorage.getItem('username')
        };

        return requester.update('appdata', 'posts/' + postId, 'kinvey', postObj);
    }

    function createPost(url, title, imageUrl, description) {
        let postObj = {
            url: url,
            title: title,
            imageUrl: imageUrl,
            description: description,
            author: sessionStorage.getItem('username')
        };

        return requester.post('appdata', 'posts', 'kinvey', postObj);
    }

    function deletePost(postId) {
        return requester.remove('appdata',`posts/${postId}`,'kinvey');
    }


    return {
        isLoggedIn,
        loadPosts,
        createPost,
        loadPostDetails,
        edit,
        deletePost,
        loadMyPosts
    }
})();