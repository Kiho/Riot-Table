/// <reference path="../typings/underscore/underscore.d.ts" />
/// <reference path="../bower_components/riot-ts/riot-ts.d.ts" />

module RiotTable {

    @template("<raw><span></span></raw>")
    class Raw extends Riot.Element {
        mounted() {
            this.root.innerHTML = this.opts.r;
        }
    }

    Raw.register();

    export interface Styles {
        tableClass: string;
        colHeaderClass: string;
        activeLineClass: string;
        sortUpClass: string;
        sortDownClass: string;
        activeSortClass: string;
    }

    interface Filter {
        column: string;
        value: string;
        append?: string;
    }

    interface Sort {
        column: string;
        order: string;
    }

    interface ColHeader {
        colName: string;
        sort: string;
        title: string;
    }

    function convertOpts(opt, noStripBlank) {
        if (!opt) {
            return;
        };
        if (typeof (opt) === 'object') {
            return opt;
        } else {
            var r: string = opt;
            if (!noStripBlank) {
                r = r.replace(/ /g, '');
            } else {
                r = r.replace(/, /, ',');
            }
            var r1 = r.split(',');
            var o = {};
            for (var i = 0, l = r1.length; i < l; i++) {
                var t = (r1[i].split(':'));
                o[t[0].replace(/ /g, '')] = t[1].trim();
            }
            return o;
        }
    }

    function copyTo(obj1, obj2) {
        for (var attrname in obj1) {
            if (obj1.hasOwnProperty(attrname)) {
                obj2[attrname] = obj1[attrname];
            }
        }
    }

    function mergeOptions(obj1, obj2) {
        var obj3 = {};
        copyTo(obj1, obj3);
        copyTo(obj2, obj3);
        return obj3;
    }

    function deepCopy(obj) {
        return _.map(obj, _.clone);
    }
   
    @template("elements/rtable.html")
    export class Rtable extends Riot.Element {
        private _data = [];
        private _dataAll = [];
        private _data_bak = [];
        private _filter: Filter;
        private _sort: Sort;
        private _colExcluded: string[] = [];
        private _colList: string[] = [];
        private _colHeader: ColHeader[] = [];
        private _colTitle = {};
        private _lineFocus = -1;
        private _activeColSort = '';
        private _self: Rtable;

        url: string;
        styles: Styles;
        pager: Paginator;
        initialized = false;

        mounted() {
            this._self = this;
            this.url = this.opts.url;
            if (this.opts.pager) {
                this.pager = this.opts.pager;
                this.opts.pager.setTable(this);
                if (this.url) {
                    this.getFromServer(1, this.opts.pager.opts.perPage);
                    return;
                }
            }
            this.init();
        }

        getData() {
            if (this.pager) {
                return this.pager.items;
            }
            return this._data;
        }
        
        setData(data: any[]) {
            if (this.pager) {
                this.pager.items = data;
                this.pager.setRange();
            } else {
                this._data = data;
            }
        }

        getFromServer(p: number, s: number) {
            var req = new XMLHttpRequest();
            var url = this.url + "/?p=" + p + "&s=" + s;
            if (this._filter)
                url += "&sc=" + this._filter.column + "&st=" + this._filter.value;
            if (this._sort) {
                url += "&sortby=" + this._sort.column;
                if (this._sort.order === "Down")
                    url += " desc";
            }
            req.open("GET", url, false);
            req.send();

            if (req.status === 200) {
                var r = JSON.parse(req.responseText);
                this.pager.updateRange(this.pager, r);
                this._data = r.data;
                if (!this.initialized) {
                    this.initialized = true;
                    this.init();
                } else {
                    this.update();
                } 
            }
        }

        init() {
            var opts = this.opts;
            var styles = convertOpts(opts.styles, true);
            this.styles = <Styles>mergeOptions(this.styles, styles);

            this._filter = opts.filter || this._filter;
            this._filter = convertOpts(this._filter, false);

            this._sort = opts.sort || { 'column': '', 'order': '' };
            this._sort = convertOpts(this._sort, false);

            this._colTitle = opts.coltitle || this._colTitle;
            this._colTitle = convertOpts(this._colTitle, false);

            if (opts['colexcluded']) {
                this._colExcluded = opts['colexcluded'].replace(/ /g, '').split(',');
            }

            if (this.styles.activeLineClass === '') {
                this._activeLine = null;
                this._lineOver = null;
            }

            if ((opts.autoload || 'yes') === 'yes') {
                if (this.pager)
                    this.start(this.pager.items, null);
                else
                    this.start(null, null);
            }
            return this;
        }

        start(data, cloneData) {
            if (!data) {
                this.loadData(this.opts.data, (this.opts.clonedata || 'no'));
            } else {
                this.loadData(data, cloneData || 'no');
            }

            this.filterTable();
            this.rebuildTable(this.opts['collist']);
            this.sortTable({ column: this._sort.column, order: this._sort.order });
            this.update();
            return this;
        }

        loadData(data, cloneData) {
            if ((cloneData || 'no') === 'no') {
                this._data = data;
            } else {
                this._data = deepCopy(data);
            }
            this._data_bak = this._data;
            this._dataAll = this._data;
            this.setData(this._dataAll);
            return this;
        }

        rebuildTable(colList) {
            if (colList) {
                if (typeof (colList) === 'string') {
                    this._colList = colList.replace(/ /g, '').split(',');
                } else {
                    this._colList = colList;
                }
            }
            this._formatTable();
            return this;
        }

        filterTable(filterObject?) {
            if (filterObject && filterObject.column && filterObject.value) {
                this._filter.column = filterObject.column;
                this._filter.value = filterObject.value;
                this._filter.append = filterObject.append;
            }
            if (this._filter) {
                var colFilter = this._filter.column,
                    valueFilter = this._filter.value,
                    append = this._filter.append || 'no';

                if (colFilter === '') {
                    this.setData(this._dataAll);
                }
                else if (this.url) {
                    this.getFromServer(this.pager.current, this.pager.perPage);
                }
                else {
                    var pos = valueFilter.indexOf("*");
                    var dataTofilter = this._dataAll; // (append === 'yes' ? this._data : this._data_bak);
                    var filtered: any[];

                    if (pos > -1 && pos === valueFilter.length - 1) {
                        filtered = _.filter(dataTofilter, (elem) => {
                            var filval = valueFilter.replace('*', '');
                            return (elem[colFilter].startsWith(filval));
                        });
                    } else {
                        filtered = _.filter(dataTofilter, (elem) => {
                            return (elem[colFilter] == valueFilter);
                        });
                    }
                    this.setData(filtered);
                }
            }
            this._cleanData();
            return this;
        }

        clearFilter() {
            this._filter.column = '';
            this.filterTable();
            return this;
        }

        sortTable(sortObject) {
            var col = '';

            if (sortObject && sortObject.column) {
                col = sortObject.column;
                if (sortObject.order) {
                    this._sort.order = sortObject.order;
                }
            }

            if (col === '') {
                return;
            }

            if (this._sort.column !== col) {
                this._sort.column = col;
            }

            var ordre = this._sort.order;
            var colonne = this._sort.column;
            this._activeColSort = colonne;

            if (!this.url) {
                var data = this.getData();
                data = data.sort((elem1, elem2) => {
                    var e1 = elem1[colonne];
                    var e2 = elem2[colonne];
                    if (!isNaN(Number(e1)) && !isNaN(Number(e2))) {
                        e1 = Number(e1);
                        e2 = Number(e2);
                    }

                    if (e1 < e2) {
                        return (ordre === 'Down' ? 1 : -1);
                    } else {
                        return (ordre === 'Up' ? 1 : -1);
                    }
                });
                this.setData(data);
                if (this._sort.order === "Down") {
                    this._sort.order = 'Up';
                } else {
                    this._sort.order = "Down";
                };
            } else {
                if (this._sort.order === "Down") {
                    this._sort.order = 'Up';
                } else {
                    this._sort.order = "Down";
                };
                this.getFromServer(this.pager.current, this.pager.perPage);
            }

            for (var i = 0, l = this._colHeader.length; i < l; i++) {
                if (this._colHeader[i].colName === col) {
                    this._colHeader[i].sort = this._sort.order;
                } else {
                    this._colHeader[i].sort = '';
                }
            }

            return this;
        }

        private _isActiveSort(colName) {
            if (colName === this._activeColSort) {
                return this.styles.activeSortClass || '';
            } else {
                return '';
            }
        }

        private _cleanData() {
            var colexclude = this._colExcluded;
            _.each(this._data, (elem) => {
                for (var i = 0, l = colexclude.length; i < l; i++) {
                    delete elem[colexclude[i]];
                }
            });
        }

        private _lineOver(e) {
            this._self._lineFocus = e.item.i;
        }

        private _activeLine(i) {
            return (i === this._lineFocus ? this.styles.activeLineClass : '');
        }

        private _click_sort(e) {
            var col = e.target.parentElement.getAttribute('data-column');
            if (!col) {
                return;
            }

            var sortOrder = _.where(this._colHeader, { colName: col });
            if (sortOrder) {
                this._self.sortTable({ column: col, order: sortOrder[0].sort || 'Up' });
            }
        }

        //_tableau = function() {
        //    var indice = -1;
        //    var colExcluded = this._colExcluded;
        //    var $lignes = $('#' + this.opts['data-id']).children('tbody').children('tr');

        //    $lignes.children('th').each(function() {
        //        var c = $(this).attr('data-column');
        //        if (c === '' || _.contains(colExcluded, c)) {
        //            indice = $(this).index();
        //            $(this).remove();
        //        }
        //    });
        //};

        private _formatTable() {
            var data = this.getData();
            var colExist = false;
            var keys: string[] = [];
            if (this._colList.length > 0) {
                keys = this._colList;
                colExist = true;
            } else if (data.length > 0) {
                keys = Object.keys(data[0]);
            }

            this._colHeader = [];
            for (var i = 0, l = keys.length; i < l; i++) {
                this._colHeader.push({ colName: keys[i], title: (this._colTitle[keys[i]] || keys[i]), sort: '' });
                if (!colExist) {
                    this._colList.push(keys[i]);
                }
            }
            this._cleanData();
            var colexcluded = this._colExcluded;
            this._colHeader = _.filter(this._colHeader, elem => {
                return !_.contains(colexcluded, elem.colName);
            });

            this.update();
        }
    }

    Rtable.register();
}
