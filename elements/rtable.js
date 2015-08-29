/// <reference path="../typings/underscore.d.ts" />
/// <reference path="../bower_components/riot-ts/riot-ts.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var RiotTable;
(function (RiotTable) {
    var Raw = (function (_super) {
        __extends(Raw, _super);
        function Raw() {
            _super.apply(this, arguments);
        }
        Raw.prototype.mounted = function () {
            this.root.innerHTML = this.opts.r;
        };
        Raw = __decorate([
            template("<raw><span></span></raw>")
        ], Raw);
        return Raw;
    })(Riot.Element);
    Raw.register();
    function convertOpts(opt, noStripBlank) {
        if (!opt) {
            return;
        }
        ;
        if (typeof (opt) === 'object') {
            return opt;
        }
        else {
            var r = opt;
            if (!noStripBlank) {
                r = r.replace(/ /g, '');
            }
            else {
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
    var Rtable = (function (_super) {
        __extends(Rtable, _super);
        function Rtable() {
            _super.apply(this, arguments);
            this._data = [];
            this._dataAll = [];
            this._data_bak = [];
            this._colExcluded = [];
            this._colList = [];
            this._colHeader = [];
            this._colTitle = {};
            this._lineFocus = -1;
            this._activeColSort = '';
        }
        Rtable.prototype.mounted = function () {
            this._self = this;
            if (this.opts.pager) {
                this.opts.pager.setTable(this);
            }
            this.init();
        };
        Rtable.prototype.getData = function () {
            if (this.pager) {
                return this.pager.items;
            }
            return this._data;
        };
        Rtable.prototype.setData = function (data) {
            if (this.pager) {
                this.pager.items = data;
                this.pager.setRange();
            }
            else {
                this._data = data;
            }
        };
        Rtable.prototype.init = function () {
            var opts = this.opts;
            var styles = convertOpts(opts.styles, true);
            this.styles = mergeOptions(this.styles, styles);
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
                this.start(null, null);
            }
            return this;
        };
        Rtable.prototype.start = function (data, cloneData) {
            if (!data) {
                this.loadData(this.opts.data, (this.opts.clonedata || 'no'));
            }
            else {
                this.loadData(data, cloneData || 'no');
            }
            this.filterTable();
            this.rebuildTable(this.opts['collist']);
            this.sortTable({ column: this._sort.column, order: this._sort.order });
            this.update();
            return this;
        };
        Rtable.prototype.loadData = function (data, cloneData) {
            if ((cloneData || 'no') === 'no') {
                this._data = data;
            }
            else {
                this._data = deepCopy(data);
            }
            this._data_bak = this._data;
            this._dataAll = this._data;
            this.setData(this._dataAll);
            return this;
        };
        Rtable.prototype.rebuildTable = function (colList) {
            if (colList) {
                if (typeof (colList) === 'string') {
                    this._colList = colList.replace(/ /g, '').split(',');
                }
                else {
                    this._colList = colList;
                }
            }
            this._formatTable();
            return this;
        };
        Rtable.prototype.filterTable = function (filterObject) {
            if (filterObject && filterObject.column && filterObject.value) {
                this._filter.column = filterObject.column;
                this._filter.value = filterObject.value;
                this._filter.append = filterObject.append;
            }
            if (this._filter) {
                var colFilter = this._filter.column, valueFilter = this._filter.value, append = this._filter.append || 'no';
                if (colFilter === '') {
                    this.setData(this._dataAll);
                }
                else {
                    var pos = valueFilter.indexOf("*");
                    var dataTofilter = this._dataAll; // (append === 'yes' ? this._data : this._data_bak);
                    var filtered;
                    if (pos > -1 && pos === valueFilter.length - 1) {
                        filtered = _.filter(dataTofilter, function (elem) {
                            var filval = valueFilter.replace('*', '');
                            return (elem[colFilter].startsWith(filval));
                        });
                    }
                    else {
                        filtered = _.filter(dataTofilter, function (elem) {
                            return (elem[colFilter] == valueFilter);
                        });
                    }
                    this.setData(filtered);
                }
            }
            this._cleanData();
            return this;
        };
        Rtable.prototype.clearFilter = function () {
            this._filter.column = '';
            this.filterTable();
            return this;
        };
        Rtable.prototype.sortTable = function (sortObject) {
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
            var data = this.getData();
            data = data.sort(function (elem1, elem2) {
                var e1 = elem1[colonne];
                var e2 = elem2[colonne];
                if (!isNaN(Number(e1)) && !isNaN(Number(e2))) {
                    e1 = Number(e1);
                    e2 = Number(e2);
                }
                if (e1 < e2) {
                    return (ordre === 'Down' ? 1 : -1);
                }
                else {
                    return (ordre === 'Up' ? 1 : -1);
                }
            });
            if (this._sort.order === "Down") {
                this._sort.order = 'Up';
            }
            else {
                this._sort.order = "Down";
            }
            ;
            for (var i = 0, l = this._colHeader.length; i < l; i++) {
                if (this._colHeader[i].colName === col) {
                    this._colHeader[i].sort = this._sort.order;
                }
                else {
                    this._colHeader[i].sort = '';
                }
            }
            this.setData(data);
            return this;
        };
        Rtable.prototype._isActiveSort = function (colName) {
            if (colName === this._activeColSort) {
                return this.styles.activeSortClass || '';
            }
            else {
                return '';
            }
        };
        Rtable.prototype._cleanData = function () {
            var colexclude = this._colExcluded;
            _.each(this._data, function (elem) {
                for (var i = 0, l = colexclude.length; i < l; i++) {
                    delete elem[colexclude[i]];
                }
            });
        };
        Rtable.prototype._lineOver = function (e) {
            this._self._lineFocus = e.item.i;
        };
        Rtable.prototype._activeLine = function (i) {
            return (i === this._lineFocus ? this.styles.activeLineClass : '');
        };
        Rtable.prototype._click_sort = function (e) {
            var col = e.target.parentElement.getAttribute('data-column');
            if (!col) {
                return;
            }
            var sortOrder = _.where(this._colHeader, { colName: col });
            if (sortOrder) {
                this._self.sortTable({ column: col, order: sortOrder[0].sort || 'Up' });
            }
        };
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
        Rtable.prototype._formatTable = function () {
            var colExist = false;
            var keys;
            if (this._colList.length > 0) {
                keys = this._colList;
                colExist = true;
            }
            else {
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
            this._colHeader = _.filter(this._colHeader, function (elem) {
                return !_.contains(colexcluded, elem.colName);
            });
            this.update();
        };
        Rtable = __decorate([
            template("elements/rtable.html")
        ], Rtable);
        return Rtable;
    })(Riot.Element);
    RiotTable.Rtable = Rtable;
    Rtable.register();
})(RiotTable || (RiotTable = {}));
//# sourceMappingURL=rtable.js.map