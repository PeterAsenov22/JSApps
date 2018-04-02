function displayTable() {
    const username = 'guest';
    const password = 'guest';

    const table = $('#results');
    table.append('<tr>\n' +
        '        <th>Loading...</th>\n' +
        '    </tr>');

    let req = {
        url: 'https://baas.kinvey.com/appdata/kid_BJXTsSi-e/students',
        headers:{
            'Authorization':'Basic ' + btoa(username + ':' + password)
        }
    };

    $.ajax(req)
        .then(fillTable)
        .catch(handleError);

    function fillTable(data) {
        table.empty();
        table.append('<tr>\n' +
            '        <th>ID</th>\n' +
            '        <th>First Name</th>\n' +
            '        <th>Last Name</th>\n' +
            '        <th>Faculty Number</th>\n' +
            '        <th>Grade</th>\n' +
            '    </tr>');

        for (let elem of data) {
            let tr = $('<tr>\n' +
                `        <th>${elem.ID}</th>\n` +
                `        <th>${elem.FirstName}</th>\n` +
                `        <th>${elem.LastName}</th>\n` +
                `        <th>${elem.FacultyNumber}</th>\n` +
                `        <th>${elem.Grade}</th>\n`+
                '       </tr>');

            table.append(tr);
        }
    }

    function handleError() {
        table.empty();
        table.append('<tr>\n' +
            '        <th>Error</th>\n' +
            '    </tr>');
    }
}