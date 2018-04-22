$(() => {
    const app = Sammy('#main', function () {
        this.use('Handlebars','hbs');

        this.get('index.html', (ctx) => {
            ctx.redirect('#/login');
        });

        this.get('#/register', (ctx) => {
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('./templates/register/registerPage.hbs');
            })
        });

        this.post('#/register', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let confirmPassword = ctx.params.repeatPass;

            if(username.length < 5){
                notify.showError('Username should be at least 5 characters long!');
                return;
            }

            if(password === '' || confirmPassword === ''){
                notify.showError('There should not be empty fields left!');
                return;
            }

            if(password !== confirmPassword){
                notify.showError('Passwords do not match!');
                return;
            }

            auth.register(username,password)
                .then(function (data) {
                    auth.saveSession(data);
                    notify.showInfo('User registration successful.');
                    ctx.redirect('#/home');
                })
                .catch(notify.handleError);

        });

        this.get('#/login', (ctx) => {
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('./templates/login/loginPage.hbs');
            })
        });

        this.post('#/login', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;

            if(username.length < 5){
                notify.showError('Username should be at least 5 characters long!');
                return;
            }

            if(password === ''){
                notify.showError('Password should not be empty!');
                return;
            }

            auth.login(username,password)
                .then(function (data) {
                    auth.saveSession(data);
                    notify.showInfo('Login successful.');
                    ctx.redirect('#/home');
                })
                .catch(notify.handleError);
        });

        this.get('#/logout', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            auth.logout()
                .then(function () {
                    sessionStorage.clear();
                    notify.showInfo('Logout successful.');
                    ctx.redirect('#/login');
                })
                .catch(notify.handleError)
        });

        this.get('#/home', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            try {
                let subscriptions = sessionStorage.getItem('subscriptions');
                let username = sessionStorage.getItem('username');

                let [chirps, followers, userChirps] = await Promise.all([
                    chirpService.loadChirpsFromSubscriptions(subscriptions),
                    auth.loadFollowersByUsername(username),
                    chirpService.loadChirpsByUsername(username)
                ]);

                for (let chirp of chirps) {
                    chirp.time = helpers.calcTime(chirp._kmd.ect);
                }

                ctx.username = username;
                ctx.chirpsCount = userChirps.length;
                ctx.following = JSON.parse(subscriptions).length;
                ctx.followers = followers.length;
                ctx.chirps = chirps;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    navigation: './templates/common/navigation.hbs',
                    submitChirpForm: './templates/home/submitChirpForm.hbs',
                    chirp: './templates/home/chirp.hbs',
                    chirpsList: './templates/home/chirpsList.hbs',
                }).then(function () {
                    this.partial('./templates/home/homePage.hbs');
                })
            }
            catch (error){
                notify.handleError(error);
            }
        });

        this.post('#/chirp/submit', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            let text = ctx.params.text;
            let author = sessionStorage.getItem('username');

            if(text === ''){
                notify.showError('Chirp should not be empty!');
                return;
            }

            if(text.length > 150){
                notify.showError('Chirp should not contain more than 150 symbols!');
                return;
            }

            chirpService.createChirp(author, text)
                .then(function () {
                    notify.showInfo('Chirp published.');
                    ctx.redirect('#/my-feed');
                })
                .catch(notify.handleError);
        });

        this.get('#/my-feed', async(ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            try {
                let subscriptions = sessionStorage.getItem('subscriptions');
                let username = sessionStorage.getItem('username');

                let [followers, userChirps] = await Promise.all([
                    auth.loadFollowersByUsername(username),
                    chirpService.loadChirpsByUsername(username)
                ]);

                for (let chirp of userChirps) {
                    chirp.time = helpers.calcTime(chirp._kmd.ect);
                }

                ctx.username = username;
                ctx.chirpsCount = userChirps.length;
                ctx.following = JSON.parse(subscriptions).length;
                ctx.followers = followers.length;
                ctx.myChirps = userChirps;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    navigation: './templates/common/navigation.hbs',
                    submitChirpForm: './templates/home/submitChirpForm.hbs',
                    chirp: './templates/myFeed/chirp.hbs',
                }).then(function () {
                    this.partial('./templates/myFeed/myFeedPage.hbs');
                })
            }
            catch (error){
                notify.handleError(error);
            }
        });

        this.get('#/user/profile/:username', async(ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            try {
                let subscriptions = sessionStorage.getItem('subscriptions');
                let username = ctx.params.username;

                let [user, followers, userChirps] = await Promise.all([
                    auth.loadUserByUsername(username),
                    auth.loadFollowersByUsername(username),
                    chirpService.loadChirpsByUsername(username)
                ]);

                for (let chirp of userChirps) {
                    chirp.time = helpers.calcTime(chirp._kmd.ect);
                }

                ctx.username = username;
                ctx.chirpsCount = userChirps.length;
                ctx.following = user[0].subscriptions.length;
                ctx.followers = followers.length;
                ctx.chirps = userChirps;
                ctx.option = 'Follow';
                ctx.href = `#/follow/${username}`;

                if(JSON.parse(subscriptions).includes(username)){
                    ctx.option = 'Unfollow';
                    ctx.href = `#/unfollow/${username}`;
                }

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    navigation: './templates/common/navigation.hbs',
                    chirp: './templates/userProfile/chirp.hbs',
                }).then(function () {
                    this.partial('./templates/userProfile/userProfilePage.hbs');
                })
            }
            catch (error){
                notify.handleError(error);
            }
        });

        this.get('#/discover', async(ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            try {
                let users = await auth.loadAllUsers();
                users = users.filter(u => u.username !== sessionStorage.getItem('username'));

                for (let user of users) {
                    let followers = await auth.loadFollowersByUsername(user.username);
                    user.followers = followers.length;
                }

                ctx.users = users;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    navigation: './templates/common/navigation.hbs',
                    user: './templates/discover/user.hbs',
                }).then(function () {
                    this.partial('./templates/discover/discoverPage.hbs');
                })
            }
            catch (error){
                notify.handleError(error);
            }
        });

        this.get('#/follow/:username', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            let username = ctx.params.username;
            let subscriptions = JSON.parse(sessionStorage.getItem('subscriptions'));

            if(subscriptions.includes(username)){
                notify.showError(`You already follow ${username}.`);
                ctx.redirect(`#/user/profile/${username}`);
                return;
            }

            subscriptions.push(username);

            auth.updateSubscriptions(sessionStorage.getItem('userId'), subscriptions)
                .then(function () {
                    sessionStorage.setItem('subscriptions', JSON.stringify(subscriptions));
                    notify.showInfo(`Subscribed to ${username}.`);
                    ctx.redirect(`#/user/profile/${username}`);
                })
                .catch(notify.handleError)
        });

        this.get('#/unfollow/:username', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            let username = ctx.params.username;
            let subscriptions = JSON.parse(sessionStorage.getItem('subscriptions'));

            if(!subscriptions.includes(username)){
                notify.showError(`You are not following ${username}.`);
                ctx.redirect(`#/user/profile/${username}`);
                return;
            }

            subscriptions = subscriptions.filter(s => s !== username);

            auth.updateSubscriptions(sessionStorage.getItem('userId'), subscriptions)
                .then(function () {
                    sessionStorage.setItem('subscriptions', JSON.stringify(subscriptions));
                    notify.showInfo(`Unsubscribed from ${username}.`);
                    ctx.redirect(`#/user/profile/${username}`);
                })
                .catch(notify.handleError)
        });

        this.get('#/chirp/delete/:chirpId', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#/login');
                return;
            }

            chirpService.deleteChirp(ctx.params.chirpId)
                .then(function () {
                    notify.showInfo(`Chirp deleted.`);
                    ctx.redirect('#/my-feed');
                })
                .catch(notify.handleError);
        });
    });

    app.run();
});