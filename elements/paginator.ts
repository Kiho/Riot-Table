/// <reference path="../bower_components/riot-ts/riot-ts.d.ts" />
/// <reference path="rtable.ts" />

module RiotTable {

    @template("elements/paginator.html")
    export class Paginator extends Riot.Element {
        total: number;
        current: number = 1;
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
            // this.current = 1          // current page
            this.nblocks = o.nblocks; // how many to display
            this.pages = [];
            for (var i = 1; i <= this.total; i++) this.pages.push(i);

            this.setRange();
        }

        setTable(table: Rtable) {
            table.pager = this;
            this.table = table;

            //var r = this.getPaginatedItems(this.items, 1);
            //table.opts.data = r.data;

            this.on('pageChange', function(e) {
                var r = this.getPaginatedItems(this.items, e.page);
                this.table._data = r.data;
                this.table.update();
            });
        }

        getPaginatedItems(items: any[], p) {
            var page = p || 1,
                perPage = 5,
                offset = (page - 1) * perPage,
                paginatedItems = _.rest(items, offset).slice(0, perPage);
            return {
                page: page,
                per_page: perPage,
                total: items.length,
                total_pages: Math.ceil(items.length / perPage),
                data: paginatedItems
            };
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