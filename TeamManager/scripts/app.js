$(() => {
    const app = Sammy('#main', function () {
        this.use('Handlebars','hbs');

        function prepareHeader(ctx) {
            let username = teamsService.isLoggedIn();
            if(username){
                ctx.loggedIn = true;
                ctx.username = username;
            }
        }

        function loadHomeView(ctx) {
            prepareHeader(ctx);

            if(teamsService.hasTeam() === null) {
                ctx.hasTeam = false;
            }
            else if(teamsService.hasTeam().toString() !== 'undefined' && teamsService.hasTeam().toString() !== ''){
                ctx.hasTeam = true;
                ctx.teamId = teamsService.hasTeam();
            }

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('./templates/home/home.hbs');
            })
        }

        this.get('index.html', (ctx) => {
            loadHomeView(ctx);
        });

        this.get('#/home', (ctx) => {
            loadHomeView(ctx);
        });

        this.get('#/login', (ctx) => {
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                loginForm: './templates/login/loginForm.hbs',
            }).then(function () {
                this.partial('./templates/login/loginPage.hbs');
            })
        });

        this.post('#/login', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;

            auth.login(username,password)
                .then(async function (data) {
                    await auth.saveSession(data);
                    auth.showInfo('Successfully logged in!');
                    ctx.redirect('#/home');
                })
                .catch(auth.handleError);
        });

        this.get('#/register', (ctx) => {
            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                registerForm: './templates/register/registerForm.hbs',
            }).then(function () {
                this.partial('./templates/register/registerPage.hbs');
            })
        });

        this.post('#/register', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let confirmPassword = ctx.params.repeatPassword;

            if(password !== confirmPassword){
                auth.showError('Passwords do not match!');
                return;
            }

            auth.register(username,password)
                .then(async function (data) {
                    await auth.saveSession(data);
                    auth.showInfo('Registration successful!');
                    ctx.redirect('#/home');
                })
                .catch(auth.handleError);
        });

        this.get('#/about', (ctx) => {
            prepareHeader(ctx);

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
            }).then(function () {
                this.partial('./templates/about/about.hbs');
            })
        });

        this.get('#/logout', (ctx) => {
            auth.logout()
                .then(function () {
                    sessionStorage.clear();
                    auth.showInfo('Logged out successfully!');
                    ctx.redirect('#/home');
                })
                .catch(auth.handleError)
        });

        this.get('#/catalog', async (ctx) => {
            prepareHeader(ctx);

            ctx.hasNoTeam = true;

            if(teamsService.hasTeam().toString() !== 'undefined' && teamsService.hasTeam().toString() !== ''){
                ctx.hasNoTeam = false;
            }

            try {
                ctx.teams = await teamsService.loadTeams();

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    team: './templates/catalog/team.hbs',
                }).then(function () {
                    this.partial('./templates/catalog/teamCatalog.hbs');
                })
            }
            catch (error){
                auth.handleError(error);
            }
        });

        this.get('#/catalog/:teamId', async (ctx) => {
            prepareHeader(ctx);

            try {
                let teamInfo = await teamsService.loadTeamDetails(ctx.params.teamId);
                ctx.name = teamInfo.name;
                ctx.comment = teamInfo.comment;
                ctx.teamId = teamInfo._id;

                if(teamInfo._acl.creator === sessionStorage.getItem('userId')){
                    ctx.isAuthor = true;
                }

                if(sessionStorage.getItem('teamId') === teamInfo._id){
                    ctx.isOnTeam = true;
                }

                ctx.hasNoTeam = true;

                if(teamsService.hasTeam().toString() !== 'undefined' && teamsService.hasTeam().toString() !== ''){
                    ctx.hasNoTeam = false;
                }

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    teamControls: './templates/catalog/teamControls.hbs',
                    teamMember: './templates/catalog/teamMember.hbs',
                }).then(function () {
                    this.partial('./templates/catalog/details.hbs');
                })
            }
            catch (error){
                auth.handleError(error);
            }
        });

        this.get('#/create', async (ctx) => {
            prepareHeader(ctx);

            ctx.loadPartials({
                header: './templates/common/header.hbs',
                footer: './templates/common/footer.hbs',
                createForm: './templates/create/createForm.hbs',
            }).then(function () {
                this.partial('./templates/create/createPage.hbs');
            })
        });

        this.post('#/create', (ctx) => {
            let name = ctx.params.name;
            let comment = ctx.params.comment;

            teamsService.createTeam(name,comment)
                .then(function (teamInfo) {
                    teamsService.joinTeam(teamInfo._id)
                        .then(async function () {
                            await ctx.redirect('#/catalog');
                            auth.showInfo(`Team ${name} created successfully!`);
                        })
                        .catch(auth.handleError);
                })
                .catch(auth.handleError);
        });

        this.get('#/edit/:teamId', async (ctx) => {
            prepareHeader(ctx);

            try {
                let teamInfo = await teamsService.loadTeamDetails(ctx.params.teamId);
                ctx.name = teamInfo.name;
                ctx.comment = teamInfo.comment;
                ctx.teamId = teamInfo._id;

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    editForm: './templates/edit/editForm.hbs',
                }).then(function () {
                    this.partial('./templates/edit/editPage.hbs');
                })
            }
            catch (error){
                auth.handleError(error);
            }
        });

        this.post('#/edit/:teamId', (ctx) => {
            let teamId = ctx.params.teamId;
            let name = ctx.params.name;
            let comment = ctx.params.comment;

            teamsService.edit(teamId,name,comment)
                .then(async function (data) {
                    await ctx.redirect('#/catalog');
                    auth.showInfo(`Team ${data.name} edited successfully!`);
                })
                .catch(auth.handleError);
        });

        this.get('#/leave', (ctx) => {
            teamsService.leaveTeam()
                .then(async function () {
                    await ctx.redirect('#/catalog');
                    auth.showInfo(`Team left successfully!`);
                })
                .catch(auth.handleError);
        });

        this.get('#/join/:teamId', (ctx) => {
            teamsService.joinTeam(ctx.params.teamId)
                .then(async function () {
                    await ctx.redirect('#/catalog');
                    auth.showInfo(`You joined the team successfully!`);
                })
                .catch(auth.handleError);
        });

        this.get('#/delete/:teamId', (ctx) => {
            teamsService.deleteTeam(ctx.params.teamId)
                .then(async function () {
                    await ctx.redirect('#/catalog');
                    auth.showInfo(`You deleted the team successfully!`);
                })
                .catch(auth.handleError);
        });
    });

    app.run();
});