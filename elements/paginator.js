/// <reference path="../bower_components/riot-ts/riot-ts.d.ts" />
/// <reference path="rtable.ts" />
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
    var Paginator = (function (_super) {
        __extends(Paginator, _super);
        function Paginator() {
            _super.apply(this, arguments);
            this.current = 1;
        }
        Paginator.prototype.mounted = function () {
            this.self = this;
            this.init(this.opts);
        };
        Paginator.prototype.init = function (o) {
            this.items = o.items;
            this.total = o.total; // total pages
            // this.current = 1          // current page
            this.nblocks = o.nblocks; // how many to display
            this.pages = [];
            for (var i = 1; i <= this.total; i++)
                this.pages.push(i);
            this.setRange();
        };
        Paginator.prototype.setTable = function (table) {
            table.pager = this;
            this.table = table;
            //var r = this.getPaginatedItems(this.items, 1);
            //table.opts.data = r.data;
            this.on('pageChange', function (e) {
                var r = this.getPaginatedItems(this.items, e.page);
                this.table._data = r.data;
                this.table.update();
            });
        };
        Paginator.prototype.getPaginatedItems = function (items, p) {
            var page = p || 1, perPage = 5, offset = (page - 1) * perPage, paginatedItems = _.rest(items, offset).slice(0, perPage);
            return {
                page: page,
                per_page: perPage,
                total: items.length,
                total_pages: Math.ceil(items.length / perPage),
                data: paginatedItems
            };
        };
        Paginator.prototype.setRange = function () {
            var start = this.current <= this.nblocks ?
                1 : (this.total - this.current) >= this.nblocks ?
                this.current : this.total - this.nblocks + 1;
            this.range = this.pages.slice(start - 1, start + this.nblocks - 1);
            this.update && this.update();
            this.self.trigger('pageChange', {
                'table': this.table,
                'page': this.self.current
            });
        };
        Paginator.prototype.page = function (e) {
            this.self.current = parseInt(e.target.innerHTML); // self because called from loop
            this.setRange();
        };
        Paginator.prototype.next = function () {
            if (this.current === this.total)
                return;
            this.current = Math.min(this.total, this.current + 1);
            this.setRange();
        };
        Paginator.prototype.prev = function () {
            if (this.current === 1)
                return;
            this.current = Math.max(1, this.current - 1);
            this.setRange();
        };
        Paginator.prototype.setPage = function (p) {
            if (p.page === this.current)
                return;
            this.current = p.page;
            this.setRange();
        };
        Paginator = __decorate([
            template("elements/paginator.html")
        ], Paginator);
        return Paginator;
    })(Riot.Element);
    RiotTable.Paginator = Paginator;
    Paginator.register();
})(RiotTable || (RiotTable = {}));
//# sourceMappingURL=paginator.js.map