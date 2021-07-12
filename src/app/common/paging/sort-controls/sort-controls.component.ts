import { Component, EventEmitter, Input, Output } from '@angular/core';

import { SortDir, SortDirection, SortDisplayOption } from '../sorting.model';

export interface TableSortOptions {
	[name: string]: SortDisplayOption;
}

@Component({
	selector: 'sort-controls',
	templateUrl: 'sort-controls.component.html'
})
export class SortControlsComponent {
	@Input() showHeader = true;

	@Input() showDirectionControl = false;

	@Input()
	set selectedSort(sort: any) {
		this.selectedKey = sort.sortField;
		this.selectedDir = sort.sortDir;
	}

	@Input() sortOptions: TableSortOptions;

	@Output() readonly sortChange = new EventEmitter<SortDisplayOption>();

	selectedKey: string;

	selectedDir: SortDir;

	updateSort(key: string) {
		// If the sort type changed, update
		if (this.selectedKey !== this.sortOptions[key].sortField) {
			this.selectedKey = this.sortOptions[key].sortField as string;
			this.selectedDir = this.sortOptions[key].sortDir ?? SortDirection.asc;
			this.sortChange.emit(this.sortOptions[key]);

			// Otherwise, toggle the sort direction (if direction controls are enabled)
		} else if (this.showDirectionControl) {
			this.selectedDir =
				this.selectedDir === SortDirection.desc ? SortDirection.asc : SortDirection.desc;
			this.sortOptions[key].sortDir = this.selectedDir;
			this.sortChange.emit(this.sortOptions[key]);
		}
	}
}
