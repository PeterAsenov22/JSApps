let notify = (() => {

    let loading = 0;
    $(document).on({
        ajaxStart: () => {
            if(loading === 0){
                $("#loadingBox").show()
            }
            loading++;
        },
        ajaxStop: () => {
            loading--;
            setTimeout(() => {if (loading===0) $('#loadingBox').fadeOut()}, 400);
        }
    });

    function showInfo(message) {
        let infoBox = $('#infoBox');
        infoBox.find('span').text(message);
        infoBox.fadeIn();
        setTimeout(() => infoBox.fadeOut(), 3000);
    }

    function showError(message) {
        let errorBox = $('#errorBox');
        errorBox.find('span').text(message);
        errorBox.fadeIn();
        setTimeout(() => errorBox.fadeOut(), 3000);
    }

    function handleError(reason) {
        showError(reason.responseJSON.description);
    }

    return {
        showInfo,
        showError,
        handleError
    }
})();