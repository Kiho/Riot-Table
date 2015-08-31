/// <reference path='node.d.ts'/>
/// <reference path="../typings/underscore/underscore.d.ts" />
var http = require("http");
var _ = require("underscore");

function getPaginatedItems(items, p, s) {
    var page = p || 1, perPage = s || 10, offset = (page - 1) * perPage, paginatedItems = _.rest(items, offset).slice(0, perPage);
    return {
        page: page,
        perPage: perPage,
        total: items.length,
        totalPages: Math.ceil(items.length / perPage),
        data: paginatedItems
    };
}

function sortBy(items, sort) {
    if (sort) {
        var list = items;
        sort = sort.toLowerCase();
        if (sort.indexOf(" desc") === sort.length - 5) {
            sort = sort.substring(0, sort.length - 5);

            // console.log("sortby : desc " + sort);
            return _.sortBy(items, sort).reverse();
        } else {
            if (sort.indexOf(" asc") > 0)
                sort = sort.substring(0, sort.length - 4);

            // console.log("sortby : " + sort);
            return _.sortBy(list, sort);
        }
    }
    return items;
}

function applyFilter(items, sc, st) {
    if (sc && st) {
        st = st.toLowerCase();
        return _.filter(items, function (x) {
            return (x[sc] === st);
        });
    }
    return items;
}

var crossDomainHeaders = {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type'
};

http.createServer(function (req, res) {
    var query = require('url').parse(req.url, true).query;
    var fs = require('fs');
    var items;
    if (req.url === '/favicon.ico') {
        // console.log('Favicon was requested');
        res.end("");
    } else {
        fs.readFile('../data/liste1.json', 'utf8', function (err, data) {
            if (err)
                throw err;
            items = JSON.parse(data);
            console.log("p : " + query.p);
            console.log("s : " + query.s);

            //console.log('items length: ' + items.length);
            items = applyFilter(items, query.sc, query.st);
            items = sortBy(items, query.sortby);
            var r = getPaginatedItems(items, parseInt(query.p), parseInt(query.s));
            var json = JSON.stringify(r);
            res.writeHead(200, crossDomainHeaders);
            res.end(json);
        });
    }
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
//# sourceMappingURL=HttpServer.js.map
