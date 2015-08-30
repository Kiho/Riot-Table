/// <reference path='node.d.ts'/>
/// <reference path="../typings/underscore/underscore.d.ts" />

import http = require("http");
import _ = require("underscore");

function getPaginatedItems(items: any[], p: number, s: number) {
    var page = p || 1,
        perPage = s || 10,
        offset = (page - 1) * perPage,
        paginatedItems = _.rest(items, offset).slice(0, perPage);
    return {
        page: page,
        perPage: perPage,
        total: items.length,
        totalPages: Math.ceil(items.length / perPage),
        data: paginatedItems
    };
}

var crossDomainHeaders = {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type'
}

http.createServer((req, res) => {
    var query = require('url').parse(req.url, true).query;
    var fs = require('fs');
    var items: any[];
    if (req.url === '/favicon.ico') {
        // console.log('Favicon was requested');
        res.end("");
    } else {
        fs.readFile('../data/liste1.json', 'utf8', (err, data) => {
            if (err) throw err;
            items = JSON.parse(data);    
            console.log("p : " + query.p);
            console.log("s : " + query.s);
            //console.log('items length: ' + items.length);        
            var r = getPaginatedItems(items, parseInt(query.p), parseInt(query.s));
            var json = JSON.stringify(r);
            res.writeHead(200, crossDomainHeaders);
            res.end(json);
        });
    }    
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');