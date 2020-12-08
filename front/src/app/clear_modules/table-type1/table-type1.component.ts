import { Component, OnInit, Input, AfterViewInit, ContentChild, TemplateRef, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { cf } from '../../utils/cf'
@Component({
    selector: 'app-table-type1',
    templateUrl: './table-type1.component.html',
    styleUrls: ['./table-type1.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableType1Component implements OnInit, AfterViewInit {
    @Input('columns') columns;
    // Columns format:
    //    [{
    //        key: 'date',
    //        header: 'Date',
    //        sortable: true,
    //    }, {
    //        key: 'message',
    //        header: 'Message'
    //    }]
    @Input('data') data;
    // Data format:
    // [{
    //     date: ..,
    //     message: ...
    // }, {}, {}]

    @Input('isLoading') isLoading;
    @ContentChild('cell') cellTemplate: TemplateRef < any > ;

    constructor() {}

    lastCellSizes = [];
    lastHeadersScrollLeft = 0;
    fitHeadersIntrval = null;
    dataLoaded;

    fitHeaders(e) {
        let tableHeaders = cf.qsAll('.tableWrapper .headers td')
        let row = cf.qs('table.mainTable tr')
        if (e && this.lastHeadersScrollLeft != e.target.scrollLeft) {
            this.lastHeadersScrollLeft = e.target.scrollLeft;
            let headers = cf.qs('.headersTableWrapper  .headers')['style'].transform = `translateX(-${this.lastHeadersScrollLeft}px)`;
        }
        if (!row || !row['cells']) { return }
        let cells = row['cells'];
        let cellSizes = [];

        let tableVirtualViewport = cf.qs('.tableVirtualViewport')
        let scrollWidth = tableVirtualViewport.offsetWidth - tableVirtualViewport.clientWidth

        for (let i = 0; i < cells.length; i++) {
            cellSizes[i] = getComputedStyle(cells[i]).width;
        }
        cellSizes[cells.length - 1] = parseInt(cellSizes[cells.length - 1]) + scrollWidth + 'px';

        if (cellSizes.every((el, i) => { return el == this.lastCellSizes[i] })) {
            return
        }
        this.lastCellSizes = [...cellSizes];
        for (let i = 0; i < cells.length; i++) {
            tableHeaders[i]['style']['min-width'] = cellSizes[i];
            tableHeaders[i]['style']['max-width'] = cellSizes[i];
        }

        let lastWidth = tableHeaders[cells.length - 1]['style']['min-width']
        tableHeaders[cells.length - 1]['style']['min-width'] = +lastWidth.replace('px', '') + 1 + 'px'

    }

    ngOnInit() {
        this.fitHeadersIntrval = setInterval(() => { this.fitHeaders(null) }, 200);
    }
    ngAfterViewInit() {
        setTimeout(() => {
            this.fitHeaders(null)
        }, 20)
    }
    ngOnDestroy() {
        clearInterval(this.fitHeadersIntrval)
    }

    createCtx(row, column, index) {
        return { row, column, index }
    }

    sortData() {
        let columnForSort = this.columns.find(el => el.sortable && (el.sortState == 1 || el.sortState == -1))
        if (!columnForSort) {
            this.data = this.dataLoaded
            return
        }
        let dataCopy = [...this.data]
        let key = columnForSort.key
        if (columnForSort.keyForSort) {
            key = columnForSort.keyForSort
        }
        let sortState = columnForSort.sortState
        dataCopy = dataCopy.sort((a, b) => {
            if (a[key] == null || b[key] == null) {
                return -1
            }
            if (typeof a[key] == 'string') {
                return sortState * a[key].localeCompare(b[key])
            }
            if (typeof a[key] == 'number') {
                return sortState * (a[key] - b[key])
            }
            return 0

        })

        this.data = dataCopy
    }
    toggleSorting(column) {
        if (!column.sortable) {
            return
        }
        for (let el of this.columns) {
            if (el != column && el.sortState != undefined) {
                el.sortState = 0
            }
        }
        switch (column.sortState) {
            case 1:
                column.sortState = -1;
                break;
            case -1:
                column.sortState = 0;
                break;
            default:
                column.sortState = 1;
                break;
        }
        this.sortData()

    }

    ngOnChanges(changes) {
        if (changes.data) {
            this.dataLoaded = changes.data.currentValue
        }

    }
}
