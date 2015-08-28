﻿/// <reference path="../typings/underscore.d.ts" />
/// <reference path="../bower_components/riot-ts/riot-ts.d.ts" />

module RiotTable {
    @template("<raw><span></span></raw>")
    class Raw extends Riot.Element {
        mounted() {
            this.root.innerHTML = this.opts.r;
        }
    }

    Raw.register();

    interface Styles {
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

    //function deepCopy1(obj) {
    //    if (Object.prototype.toString.call(obj) === '[object Array]') {
    //        var out = [], i = 0, len = obj.length;
    //        for (; i < len; i++) {
    //            out[i] = arguments.callee(obj[i]);
    //        }
    //        return out;
    //    }
    //    if (typeof obj === 'object') {
    //        var out1 = {}, j;
    //        for (j in obj) {
    //            out1[j] = arguments.callee(obj[j]);
    //        }
    //        return out1;
    //    }
    //    return obj;
    //}

    function deepCopy(obj) {
        return _.map(obj, _.clone);
    }

    @template("elements/rtable.html")
    export class Rtable extends Riot.Element {
        private _data = [];
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
        private _styles: Styles;

        pager: Paginator;

        mounted() {
            this._self = this;
            // this.init(this.opts);
        }

        init() {
            var opts = this.opts;
            var styles =  convertOpts(opts.styles, true);
            this._styles = <Styles>mergeOptions(this._styles, styles);

            this._filter = opts.filter || this._filter;
            this._filter = convertOpts(this._filter, false);

            this._sort = opts.sort || { 'column': '', 'order': '' };
            this._sort = convertOpts(this._sort, false);

            this._colTitle = opts.coltitle || this._colTitle;
            this._colTitle = convertOpts(this._colTitle, false);

            if (opts['colexcluded']) {
                this._colExcluded = opts['colexcluded'].replace(/ /g, '').split(',');
            }

            if (this._styles.activeLineClass === '') {
                this._activeLine = null;
                this._lineOver = null;
            }

            if ((opts.autoload || 'yes') === 'yes') {
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
                    this._data = this._data_bak;
                } else {
                    var pos = valueFilter.indexOf("*");
                    var dataTofilter = (append === 'yes' ? this._data : this._data_bak);

                    if (pos > -1 && pos === valueFilter.length - 1) {
                        this._data = _.filter(dataTofilter, (elem) => {
                            var filval = valueFilter.replace('*', '');
                            return (elem[colFilter].startsWith(filval));
                        });
                    } else {
                        this._data = _.filter(dataTofilter, (elem) => {
                            return (elem[colFilter] == valueFilter);
                        });
                    }
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
            var data = this.pager.items;
            this.pager.items = data.sort((elem1, elem2) => {
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

            if (this._sort.order === "Down") {
                this._sort.order = 'Up';
            } else {
                this._sort.order = "Down";
            };

            for (var i = 0, l = this._colHeader.length; i < l; i++) {
                if (this._colHeader[i].colName === col) {
                    this._colHeader[i].sort = this._sort.order;
                } else {
                    this._colHeader[i].sort = '';
                }
            }
            this.pager.setRange();
            return this;
        }

        private _isActiveSort(colName) {
            if (colName === this._activeColSort) {
                return this._styles.activeSortClass || '';
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
            return (i === this._lineFocus ? this._styles.activeLineClass : '');
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
            var colExist = false;
            var keys: string[];
            if (this._colList.length > 0) {
                keys = this._colList;
                colExist = true;
            } else {
                keys = Object.keys(this._data[0]);
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
