/// <reference path="../bower_components/riot-ts/riot-ts.d.ts" />
/// <reference path="rtable.ts" />

module RiotTable {

    export interface PagedData {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
        data: any[];
    }

    @template("elements/paginator.html")
    export class Paginator extends Riot.Element {
        total: number;
        current: number = 1;
        perPage: number;
        nblocks: number;
        pages: number[];
        range: number[];

        table: Rtable;
        self: Paginator;
        items: any[];

        mounted() {
            this.self = this;
            this.init(this.opts);
        }

        init(o) {
            this.items = o.items;
            this.total = o.total; // total pages
            this.perPage = o.perPage || 5; // how many items on one page
            // this.current = 1   // current page
            this.nblocks = o.nblocks; // how many to display
            this.pages = [];
            for (var i = 1; i <= this.total; i++) this.pages.push(i);

            this.setRange();
        }

        setTable(table: Rtable) {
            this.table = table;
            this.on('pageChange', function (e) {
                if (e.table.url) {
                    e.table.getFromServer(e.page, this.perPage);
                } else {
                    var r = this.getPaginatedItems(this.items, e.page);
                    e.table._data = r.data;
                    e.table.update();
                }
            });
        }

        getPaginatedItems(items: any[], p): PagedData {
            var page = (p || 1),
                perPage = 5,
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

        updateRange(pager: Paginator, r: PagedData) {
            pager.pages = [];
            var count = r.totalPages - r.page;
            var ncount = count > pager.nblocks ? pager.nblocks : count;
            var max = ncount + r.page;
            this.current = r.page;
            this.total = r.totalPages;
            for (var i = r.page; i <= max; i++) pager.pages.push(i);
            pager.items = r.data;

            this.range = this.pages;
            this.update && this.update();
        }

        setRange() {
            var start = this.current <= this.nblocks ?
                1 : (this.total - this.current) >= this.nblocks ?
                this.current : this.total - this.nblocks + 1;

            this.range = this.pages.slice(start - 1, start + this.nblocks - 1);
            this.update && this.update();
            this.self.trigger('pageChange', {
                'table': this.table,
                'page': this.self.current
            });
        }

        page(e) {
            this.self.current = parseInt(e.target.innerHTML); // self because called from loop
            this.setRange();
        }

        next() {
            if (this.current === this.total) return;
            this.current = Math.min(this.total, this.current + 1);
            this.setRange();
        }

        prev() {
            if (this.current === 1) return;
            this.current = Math.max(1, this.current - 1);
            this.setRange();
        }

        setPage(p) {
            if (p.page === this.current)
                return;
            this.current = p.page;
            this.setRange();
        }
    }

    Paginator.register();
}