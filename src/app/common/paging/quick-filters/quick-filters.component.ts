import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output
} from '@angular/core';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@UntilDestroy()
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'quick-filters',
	templateUrl: 'quick-filters.component.html',
	styleUrls: ['quick-filters.component.scss']
})
export class QuickFiltersComponent implements OnInit {
	@Input() title = 'Quick Filters';

	@Input() filters: any = {};

	@Input() defaultFilters: any;

	@Output() readonly filtersChange: EventEmitter<any> = new EventEmitter();

	columnMode?: string;

	shown = true;

	filterKeys: string[] = [];

	toggleFilter$: Subject<string> = new Subject();

	constructor() {
		this.toggleFilter$
			.pipe(debounceTime(100), untilDestroyed(this))
			.subscribe((key: string) => this.toggleQuickFilter(key));
	}

	ngOnInit() {
		this.filterKeys = Object.keys(this.filters);
	}

	toggleQuickFilter(key: string) {
		if (this.filters.hasOwnProperty(key)) {
			this.filters[key].show = !this.filters[key].show;
		}
		this.filtersChange.emit(this.filters);
	}
}
