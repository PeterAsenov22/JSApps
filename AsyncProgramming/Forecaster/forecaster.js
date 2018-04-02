function attachEvents() {
    const Symbols = {
      Sunny: '&#x2600;',
      'Partly sunny': '&#x26C5;',
       Overcast: '&#x2601;',
       Rain: '&#x2614;',
       Degrees: '&#176;'
    };
    const baseUrl = 'https://judgetests.firebaseio.com/';

    const forecastDiv = $('#forecast');
    const currentContainer = $('#current');
    const upcomingContainer = $('#upcoming');

    $('#submit').on('click',getWeather);

    function request(endpoint) {
        return $.get(baseUrl + endpoint + '.json');
    }
    
    async function getWeather() {
        let requestedLocation = $('#location').val();
        let data = await request('locations');
        data = data.filter(e=>e.name === requestedLocation);

        console.log(data);

        let currForcPromise = request(`forecast/today/${data[0].code}`);
        let futureForcPromise = request(`forecast/upcoming/${data[0].code}`);

        try{
            let [currentForecast, upcomingForecast] = await Promise.all([currForcPromise,futureForcPromise]);

            currentContainer.empty();
            upcomingContainer.empty();

            //Display Current Forecast
            currentContainer.append($('<div class="label">Current conditions</div>'));
            currentContainer.append($(`<span class="condition symbol">${Symbols[currentForecast.forecast.condition]}</span>`));

            let conditionSpan = $('<span>').addClass('condition');
            conditionSpan.append($(`<span class="forecast-data">${currentForecast.name}</span>`));
            conditionSpan.append($(`<span class="forecast-data">${currentForecast.forecast.low}${Symbols.Degrees}/${currentForecast.forecast.high}${Symbols.Degrees}</span>`));
            conditionSpan.append($(`<span class="forecast-data">${currentForecast.forecast.condition}</span>`));

            currentContainer.append(conditionSpan);

            //Display Upcoming Forecast
            upcomingContainer.append($('<div class="label">Current conditions</div>'));
            let upcomingForecasts = upcomingForecast.forecast;
            for (let forc of upcomingForecasts) {
                let upcomingSpan = $('<span>').addClass('upcoming');
                upcomingSpan.append($(`<span class="symbol">${Symbols[forc.condition]}</span>`));
                upcomingSpan.append($(`<span class="forecast-data">${forc.low}${Symbols.Degrees}/${forc.high}${Symbols.Degrees}</span>`));
                upcomingSpan.append($(`<span class="forecast-data">${forc.condition}</span>`));

                upcomingContainer.append(upcomingSpan);
            }

            //Display div
            forecastDiv.css('display','block');
        }
        catch(error){
            forecastDiv.empty();
            forecastDiv.append('Error');
            forecastDiv.css('display','block');
        }
    }
}