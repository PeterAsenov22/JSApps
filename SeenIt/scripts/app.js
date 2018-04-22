$(() => {
    const app = Sammy('#container', function () {
        this.use('Handlebars','hbs');

        function prepareHeader(ctx) {
            let username = auth.isLoggedIn();
            if(username){
                ctx.loggedIn = true;
                ctx.username = username;
            }
        }

        function loadHomeView(ctx) {
            prepareHeader(ctx);

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                loginForm: './templates/welcome/loginForm.hbs',
                registerForm: './templates/welcome/registerForm.hbs',
                menu: './templates/common/menu.hbs',
                about: './templates/welcome/about.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('./templates/welcome/welcome.hbs');
            })
        }

        this.get('index.html', (ctx) => {
            loadHomeView(ctx);
        });

        this.get('#/home', (ctx) => {
            loadHomeView(ctx);
        });

        this.post('#/register', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let confirmPassword = ctx.params.repeatPass;

            if(username.length < 3){
                auth.showError('Username should be at least 3 characters long!');
                return;
            }

            let usernameRegex = new RegExp('^[A-Za-z]+$','g');
            if(!username.match(usernameRegex)){
                auth.showError('Username should contain only english alphabet letters!');
                return;
            }

            if(password.length < 6){
                auth.showError('Password should be at least 6 characters long!');
                return;
            }

            let passwordRegex = new RegExp('^[A-Za-z0-9]+$','g');
            if(!password.match(passwordRegex)){
                auth.showError('Password should contain only english alphabet letters and digits!');
                return;
            }

            if(password !== confirmPassword){
                auth.showError('Passwords do not match!');
                return;
            }

            auth.register(username,password)
                .then(async function (data) {
                    await auth.saveSession(data);
                    auth.showInfo('User registration successful.');
                    ctx.redirect('#/home');
                })
                .catch(auth.handleError);

        });

        this.post('#/login', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;

            if(username.length < 3){
                auth.showError('Username should be at least 3 characters long!');
                return;
            }

            let usernameRegex = new RegExp('^[A-Za-z]+$','g');
            if(!username.match(usernameRegex)){
                auth.showError('Username should contain only english alphabet letters!');
                return;
            }

            if(password.length < 6){
                auth.showError('Password should be at least 6 characters long!');
                return;
            }

            let passwordRegex = new RegExp('^[A-Za-z0-9]+$','g');
            if(!password.match(passwordRegex)){
                auth.showError('Password should contain only english alphabet letters and digits!');
                return;
            }

            auth.login(username,password)
                .then(async function (data) {
                    await auth.saveSession(data);
                    auth.showInfo('Login successful.');
                    ctx.redirect('#/home');
                })
                .catch(auth.handleError);
        });

        this.get('#/catalog', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            prepareHeader(ctx);

            try {
                let posts = await postsService.loadPosts();
                let rank = 1;
                for (let post of posts) {
                    if(post._acl.creator === sessionStorage.getItem('userId')){
                        post.isAuthor = true;
                    }

                    post.postId = post._id;
                    post.interval = helpers.calcTime(post._kmd.ect);
                    post.rank = rank;
                    rank++;
                }

                ctx.posts = posts;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    menu: './templates/common/menu.hbs',
                    post: './templates/catalog/post.hbs',
                }).then(function () {
                    this.partial('./templates/catalog/catalogPage.hbs');
                })
            }
            catch (error){
                auth.handleError(error);
            }
        });

        this.get('#/logout', (ctx) => {
            auth.logout()
                .then(function () {
                    sessionStorage.clear();
                    auth.showInfo('Logout successful.');
                    ctx.redirect('#/home');
                })
                .catch(auth.handleError)
        });

        this.get('#/submit', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            prepareHeader(ctx);

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                createForm: './templates/create/createForm.hbs',
                menu: './templates/common/menu.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('./templates/create/createPage.hbs');
            })
        });

        this.post('#/submit', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            let url = ctx.params.url;
            let title = ctx.params.title;
            let imageUrl = ctx.params.image;
            let comment = ctx.params.comment;

            if(url.length === 0){
                auth.showError('URL field should not be empty!');
                return;
            }

            if(!url.startsWith('http')){
                auth.showError('URL field should start with "http"!');
                return;
            }

            if(url.title === 0){
                auth.showError('Title field should not be empty!');
                return;
            }

            postsService.createPost(url, title, imageUrl, comment)
                .then(function () {
                    auth.showInfo('Post created.');
                    ctx.redirect('#/catalog');
                })
                .catch(auth.handleError);
        });

        this.get('#/edit/:postId', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            prepareHeader(ctx);

            try {
                let postInfo = await postsService.loadPostDetails(ctx.params.postId);
                ctx.url = postInfo.url;
                ctx.title = postInfo.title;
                ctx.imageUrl = postInfo.imageUrl;
                ctx.comment = postInfo.description;
                ctx.postId = postInfo._id;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    menu: './templates/common/menu.hbs',
                    editForm: './templates/edit/editForm.hbs',
                }).then(function () {
                    this.partial('./templates/edit/editPage.hbs');
                })
            }
            catch (error){
                auth.handleError(error);
            }
        });

        this.post('#/edit/:postId', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            let postId = ctx.params.postId;
            let url = ctx.params.url;
            let title = ctx.params.title;
            let image = ctx.params.image;
            let description = ctx.params.description;

            if(url.length === 0){
                auth.showError('URL field should not be empty!');
                return;
            }

            if(!url.startsWith('http')){
                auth.showError('URL field should start with "http"!');
                return;
            }

            if(url.title === 0){
                auth.showError('Title field should not be empty!');
                return;
            }

            postsService.edit(postId,url,title,image,description)
                .then(function (data) {
                    auth.showInfo(`Post ${title} updated.`);
                    ctx.redirect('#/catalog');
                })
                .catch(auth.handleError);
        });

        this.get('#/delete/:postId', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            postsService.deletePost(ctx.params.postId)
                .then(function () {
                    auth.showInfo(`Post deleted.`);
                    ctx.redirect('#/catalog');
                })
                .catch(auth.handleError);
        });

        this.get('#/myPosts', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            prepareHeader(ctx);

            try {
                let posts = await postsService.loadMyPosts();
                let rank = 1;
                for (let post of posts) {
                    post.isAuthor = true;
                    post.postId = post._id;
                    post.interval = helpers.calcTime(post._kmd.ect);
                    post.rank = rank;
                    rank++;
                }

                ctx.posts = posts;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    menu: './templates/common/menu.hbs',
                    post: './templates/catalog/post.hbs',
                }).then(function () {
                    this.partial('./templates/myPosts/myPostsPage.hbs');
                })
            }
            catch (error){
                auth.handleError(error);
            }
        });

        this.get('#/comments/:postId', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            prepareHeader(ctx);

            try {
                let [comments, postInfo] = await Promise.all([commentsService.loadPostComments(ctx.params.postId), postsService.loadPostDetails(ctx.params.postId)]);

                for (let comment of comments) {
                    if(comment._acl.creator === sessionStorage.getItem('userId')){
                        comment.isAuthor = true;
                    }

                    comment.interval = helpers.calcTime(comment._kmd.ect);
                }

                ctx.url = postInfo.url;
                ctx.title = postInfo.title;
                ctx.imageUrl = postInfo.imageUrl;
                ctx.description = postInfo.description;
                ctx.postId = postInfo._id;
                ctx.interval = helpers.calcTime(postInfo._kmd.ect);
                ctx.comments = comments;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    menu: './templates/common/menu.hbs',
                    commentForm: './templates/details/commentForm.hbs',
                    postDetails: './templates/details/postDetails.hbs',
                    comment: './templates/details/comment.hbs',
                }).then(function () {
                    this.partial('./templates/details/detailsPage.hbs');
                })
            }
            catch (error){
                auth.handleError(error);
            }
        });

        this.post('#/comments/create', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            let content = ctx.params.content;
            if(content === ''){
                auth.showError('Content should not be empty!');
                return;
            }

            let postId = ctx.target.attributes[3].nodeValue;

            commentsService.createComment(content, postId)
                .then(function () {
                    auth.showInfo('Comment created.');
                    ctx.redirect(`#/comments/${postId}`);
                })
                .catch(auth.handleError)
        });

        this.get('#/comments/:postId/delete/:commentId', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/home');
                return;
            }

            let commentId = ctx.params.commentId;
            let postId = ctx.params.postId;

            commentsService.deleteComment(commentId)
                .then(function () {
                    auth.showInfo(`Comment deleted.`);
                    ctx.redirect(`#/comments/${postId}`);
                })
                .catch(auth.handleError);
        });
    });

    app.run();
});