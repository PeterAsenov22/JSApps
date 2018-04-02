function attachEvents() {
    const username = 'guest';
    const password = 'pass';
    const venueContainer = $('#venue-info');

    $('#getVenues').on('click',getVenues);

    function request(method,endpoint,type,data) {
        let req = {
            url: `https://baas.kinvey.com/${type}/kid_BJ_Ke8hZg/${endpoint}`,
            method: method,
            headers:{
                'Authorization':'Basic ' + btoa(username + ':' + password),
                'Content-Type':'application/json'},
            data:data
        };

        return $.ajax(req);
    }

    async function getVenues() {
        try {
            venueContainer.empty();
            venueContainer.append($(`<p>Loading...</p>`));

            let date = $('#venueDate').val();
            let availableVenuesIds = await request('POST', `custom/calendar?query=${date}`, 'rpc');
            let venuesList = [];

            for (let venueId of availableVenuesIds) {
                let data = await request('GET', `venues/${venueId}`, 'appdata');
                venuesList.push(data);
            }

            venueContainer.empty();
            for (let venue of venuesList) {
                let venueDetailsDiv = $(`<div class="venue-details" style="display: none;"></div>`);
                let table = $('<table>');
                table.append($('<tr><th>Ticket Price</th><th>Quantity</th><th></th></tr>'));
                let secondRow = $('<tr>');
                secondRow.append($(`<td class="venue-price">${venue.price} lv</td>`));
                secondRow.append($('<td><select class="quantity">\n' +
                    '          <option value="1">1</option>\n' +
                    '          <option value="2">2</option>\n' +
                    '          <option value="3">3</option>\n' +
                    '          <option value="4">4</option>\n' +
                    '          <option value="5">5</option>\n' +
                    '        </select></td>\n'));

                let purchaseBtn = $('<td><input class="purchase" type="button" value="Purchase"></td>').on('click', (event) => {
                    purchase(venue.name, venue.price, event.target, venue._id)
                });
                secondRow.append(purchaseBtn);
                table.append(secondRow);
                venueDetailsDiv.append(table);
                venueDetailsDiv.append($('<span class="head">Venue description:</span>'));
                venueDetailsDiv.append($(`<p class="description">${venue.description}</p>`));
                venueDetailsDiv.append($(`<p class="description">Starting time: ${venue.startingHour}</p>`));

                let venueDiv = $(`<div class="venue" id="{venue._id}">`);
                let venueSpan = $(`<span class="venue-name"></span>`);
                let infoBtn = $(`<input class="info" type="button" value="More info">`).on('click', () => {
                    venueDetailsDiv.toggle()
                });

                //appending
                venueSpan.append(infoBtn);
                venueSpan.append(`${venue.name}`);
                venueDiv.append(venueSpan);
                venueDiv.append(venueDetailsDiv);
                venueContainer.append(venueDiv);
            }

            function purchase(name, price, that, id) {
                let row = $(that).parent().parent();
                let select = row.find('.quantity');
                let quantity = $(select).find('option:selected').text();

                let total = Number(quantity) * Number(price);

                venueContainer.empty();
                venueContainer.append($(`<span class="head">Confirm purchase</span>`));
                let div = $('<div class="purchase-info">\n' +
                    `  <span>${name}</span>\n` +
                    `  <span>${quantity} x ${price}</span>\n` +
                    `  <span>Total: ${total} lv</span>\n` +
                    '</div>');

                let confirmBtn = $('<input type="button" value="Confirm">').on('click', () => {
                    confirm(quantity, id)
                });
                div.append(confirmBtn);
                venueContainer.append(div);
            }

            async function confirm(quantity, id) {
                try {
                    let result = await request('POST', `custom/purchase?venue=${id}&qty=${quantity}`, 'rpc');
                    venueContainer.empty();
                    venueContainer.append('You may print this page as your ticket');
                    venueContainer.append(result.html);
                }
                catch (error) {
                    handleError(error);
                }
            }
        }
        catch (error) {
            handleError(error);
        }
    }

    function handleError(error) {
        venueContainer.empty();
        venueContainer.append($('<p>').text(error.statusText));
    }
}