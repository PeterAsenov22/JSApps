let commentsService = (() => {
    function loadPostComments(postId) {
        return requester.get('appdata', `comments?query={"postId":"${postId}"}&sort={"_kmd.ect": -1}`, 'kinvey');
    }

    function createComment(content, postId) {
        let commentObj = {
            author: sessionStorage.getItem('username'),
            content: content,
            postId: postId
        };

        return requester.post('appdata','comments','kinvey',commentObj);
    }

    function deleteComment(commentId) {
        return requester.remove('appdata',`comments/${commentId}`,'kinvey');
    }

    return {
        loadPostComments,
        createComment,
        deleteComment
    }
})();