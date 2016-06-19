/// <reference path="../bower_components/riot-ts/riot-ts.d.ts" />
/// <reference path="rtable.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
            this.perPage = o.perPage || 5; // how many items on one page
            // this.current = 1   // current page
            this.nblocks = o.nblocks; // how many to display
            this.pages = [];
            for (var i = 1; i <= this.total; i++)
                this.pages.push(i);
            this.setRange();
        };
        Paginator.prototype.setTable = function (table) {
            this.table = table;
            this.on('pageChange', function (e) {
                if (e.table.url) {
                    e.table.getFromServer(e.page, this.perPage);
                }
                else {
                    var r = this.getPaginatedItems(this.items, e.page);
                    e.table._data = r.data;
                    e.table.update();
                }
            });
        };
        Paginator.prototype.getPaginatedItems = function (items, p) {
            var page = (p || 1), perPage = 5, offset = (page - 1) * perPage, paginatedItems = _.rest(items, offset).slice(0, perPage);
            return {
                page: page,
                perPage: perPage,
                total: items.length,
                totalPages: Math.ceil(items.length / perPage),
                data: paginatedItems
            };
        };
        Paginator.prototype.updateRange = function (pager, r) {
            pager.pages = [];
            var count = r.totalPages - r.page;
            var ncount = count > pager.nblocks ? pager.nblocks : count;
            var max = ncount + r.page;
            this.current = r.page;
            this.total = r.totalPages;
            for (var i = r.page; i <= max; i++)
                pager.pages.push(i);
            pager.items = r.data;
            this.range = this.pages;
            this.update && this.update();
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
    }(Riot.Element));
    RiotTable.Paginator = Paginator;
})(RiotTable || (RiotTable = {}));
//# sourceMappingURL=paginator.js.map