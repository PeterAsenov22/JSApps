$(() => {
    const app = Sammy('#container', function () {
        this.use('Handlebars','hbs');

        this.get('index.html', (ctx) => {
            ctx.loadPartials({
                footer: './templates/common/footer.hbs',
                content: './templates/index/content.hbs',
                loginForm: './templates/index/loginForm.hbs',
                registerForm: './templates/index/registerForm.hbs',
            }).then(function () {
                this.partial('./templates/index/indexPage.hbs');
            })
        });

        this.post('#/register', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;
            let confirmPassword = ctx.params.confirm;

            if(username.length < 5){
                notify.showError('Username should be at least 5 characters long!');
                ctx.redirect('#');
                return;
            }

            if(password === ''){
                notify.showError('Password field should not be empty!');
                return;
            }

            if(confirmPassword === ''){
                notify.showError('Password check field should not be empty!');
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
                    ctx.redirect('#/editor');
                })
                .catch(notify.handleError);

        });

        this.post('#/login', (ctx) => {
            let username = ctx.params.username;
            let password = ctx.params.password;

            if(username.length < 5){
                notify.showError('Username should be at least 5 characters long!');
                return;
            }

            if(password === ''){
                notify.showError('Password field should not be empty!');
                return;
            }

            auth.login(username,password)
                .then(function (data) {
                    auth.saveSession(data);
                    ctx.redirect('#/editor');
                    notify.showInfo('Login successful.');
                })
                .catch(notify.handleError);
        });

        this.get('#/logout', (ctx) => {
            auth.logout()
                .then(function () {
                    sessionStorage.clear();
                    ctx.redirect('#');
                    notify.showInfo('Logout successful.');
                })
                .catch(notify.handleError)
        });

        this.get('#/editor', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#');
                return;
            }

            try {
                let userId = sessionStorage.getItem('userId');
                let currentActiveReceipts = await service.getActiveReceipt(userId);

                let activeReceipt;
                if(currentActiveReceipts.length === 0){
                    activeReceipt = await service.createReceipt();
                }
                else {
                    activeReceipt = currentActiveReceipts[0]
                }

                let entries = await service.getEntriesByReceiptId(activeReceipt._id);

                let total = 0;
                for (let entry of entries) {
                    let sum = Number(entry.qty) * Number(entry.price);
                    entry.subTotal = sum.toFixed(2);
                    entry.price = Number(entry.price).toFixed(2);
                    total += sum;
                }

                ctx.username = sessionStorage.getItem('username');
                ctx.receiptId = activeReceipt._id;
                ctx.products = entries;
                ctx.productsCount = entries.length;
                ctx.total = total.toFixed(2);

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    product: './templates/home/product.hbs',
                    productsList: './templates/productsList.hbs',
                    footer: './templates/common/footer.hbs',
                }).then(function () {
                    this.partial('./templates/home/homePage.hbs');
                })
            }
            catch (error){
                notify.handleError(error);
            }

        });

        this.post('#/add/:receiptId', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#');
                return;
            }

            if(ctx.params.type ==='' || ctx.params.qty ==='' || ctx.params.price ===''){
                notify.showError('There should be no empty fields!');
                return;
            }

            let receiptId = ctx.params.receiptId;
            let type = ctx.params.type;
            let quantity = Number(ctx.params.qty);
            let price = Number(ctx.params.price);

            function isFloat(n){
                return Number(n) === n && n % 1 !== 0;
            }

            if(type.length === 0){
                notify.showError('Product name should not be empty!');
                return;
            }

            if(isNaN(quantity) || quantity <= 0){
                notify.showError('Quantity should be a valid positive number!');
                return;
            }

            if(isFloat(quantity)){
                notify.showError('Quantity should be a whole number!');
                return;
            }

            if(isNaN(price) || price<=0){
                notify.showError('Price should be a valid positive number!');
                return;
            }

            let entryObj = {
                type: type,
                qty: quantity,
                price: price,
                receiptId: receiptId
            };

            service.addEntry(entryObj)
                .then(function () {
                    notify.showInfo('Entry added.');
                    ctx.redirect('#/editor');
                })
                .catch(notify.handleError);
        });

        this.post('#/checkout', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#');
                return;
            }

            let receiptId = ctx.params.receiptId;
            let total = Number(ctx.params.total);
            let productsCount = Number(ctx.params.productsCount);

            if(productsCount === 0){
                notify.showError('You are not able to checkout an empty receipt!');
                return;
            }

            let receiptObj = {
                active: false,
                productCount: productsCount,
                total: total
            };

            service.commitReceipt(receiptId, receiptObj)
                .then(function () {
                    notify.showInfo('Receipt checked out.');
                    ctx.redirect('#/editor');
                })
                .catch(notify.handleError);
        });

        this.get('#/delete/:productId', (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#');
                return;
            }

            service.deleteEntry(ctx.params.productId)
                .then(function () {
                    notify.showInfo(`Entry removed.`);
                    ctx.redirect('#/editor');
                })
                .catch(notify.handleError);
        });

        this.get('#/overview', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#');
                return;
            }

            try {
                let receipts = await service.loadMyReceipts(sessionStorage.getItem('userId'));
                let total = 0;
                for (let receipt of receipts) {
                    receipt.creationDate = receipt._kmd.ect;
                    let receiptTotal = Number(receipt.total);
                    receipt.total = receiptTotal.toFixed(2);
                    total += receiptTotal;
                }

                ctx.username = sessionStorage.getItem('username');
                ctx.receipts = receipts;
                ctx.total = total.toFixed(2);

                ctx.loadPartials({
                    header: './templates/common/header.hbs',
                    footer: './templates/common/footer.hbs',
                    receipt: './templates/overview/receipt.hbs',
                    listReceipts: './templates/overview/listReceipts.hbs',
                }).then(function () {
                    this.partial('./templates/overview/overviewPage.hbs');
                })
            }
            catch (error){
                notify.handleError(error);
            }
        });

        this.get('#/receipt/details/:receiptId', async (ctx) => {
            if(!auth.isAuth()){
                ctx.redirect('#');
                return;
            }

            let receipt = await service.loadReceipt(ctx.params.receiptId);
            if(receipt.active === 'false') {
                try {
                    let entries = await service.getEntriesByReceiptId(ctx.params.receiptId);
                    for (let entry of entries) {
                        let sum = Number(entry.qty) * Number(entry.price);
                        entry.subTotal = sum.toFixed(2);
                        entry.price = Number(entry.price).toFixed(2);
                    }

                    ctx.username = sessionStorage.getItem('username');
                    ctx.products = entries;

                    ctx.loadPartials({
                        header: './templates/common/header.hbs',
                        footer: './templates/common/footer.hbs',
                        product: './templates/details/product.hbs',
                        productsList: './templates/productsList.hbs',
                    }).then(function () {
                        this.partial('./templates/details/detailsPage.hbs');
                    })
                }
                catch (error) {
                    notify.handleError(error);
                }
            }
            else{
                console.log('tuka');
                notify.showError('You can not view details for active or non-existing receipt!');
                ctx.redirect('#/overview');
            }
        });
    });

    app.run();
});