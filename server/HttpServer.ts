/// <reference path='node.d.ts'/>
/// <reference path="../typings/underscore/underscore.d.ts" />

import http = require("http");
import _ = require("underscore");

interface Filter {
    column: string;
    value: string;
}

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

function sortBy(items: any[], sort): any[]{
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

function applyFilter(items: any[], column: string, text: string): any[] {
    if (column && text) {
        text = text.toLowerCase();
        return _.filter(items, x => (x[column].toLowerCase() === text));
    }
    return items;
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
        fs.readFile('./data/liste1.json', 'utf8', (err, data) => {
            if (err) throw err;
            items = JSON.parse(data);    
            console.log("page : " + query.page);
            console.log("size : " + query.size);
            console.log('filter: ' + query.filter + '  text: ' + query.text); 

            items = applyFilter(items, query.filter, query.text);    
            items = sortBy(items, query.sortby);   
            var r = getPaginatedItems(items, parseInt(query.page), parseInt(query.size));
            var json = JSON.stringify(r);
            res.writeHead(200, crossDomainHeaders);
            res.end(json);
        });
    }    
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');