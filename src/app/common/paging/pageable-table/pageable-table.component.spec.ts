import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { PagingOptions, PageChange, Pager } from '../pager/pager.component';
import { PageableTable } from './pageable-table.component';
import { SortControls } from '../sort-controls/sort-controls.component';
import { FormsModule } from '@angular/forms';
import { DirectivesModule } from '../../directives.module';
import { PipesModule } from '../../pipes.module';

@Component({
	template:
		`
	<pageable-table [items]="items"
					[hasItems]="hasItems"
					[pagingOptions]="pagingOptions"
					(onPageChange)="pageChanged$.next($event)">

		<ng-template named-template="table-header">
			{{ headerContent }}
		</ng-template>

		<ng-template named-template="table-row" let-item let-index="index">
			{{ rowContent }}
			{{ item }}
			{{ index }}
		</ng-template>

		<ng-template named-template="table-no-data">
			{{ noDataContent }}
		</ng-template>

		<ng-template named-template="table-no-results">
			{{ noResultsContent }}
		</ng-template>

	</pageable-table>
`
})
export class PageableTableTestHost {
	@Input() items: Iterable<any>;
	@Input() hasItems: boolean;
	@Input() pagingOptions: PagingOptions = new PagingOptions();

	@Input() headerContent: string;
	@Input() rowContent: string;
	@Input() noDataContent: string;
	@Input() noResultsContent: string;

	pageChanged$ = new Subject<PageChange>();
}

describe('PageableTableComponent', () => {

	let fixture: ComponentFixture<PageableTableTestHost>;
	let testHost: PageableTableTestHost;
	let rootHTMLElement: HTMLElement;

	beforeEach(() => {
		const testbed = TestBed.configureTestingModule({
			imports: [
				TooltipModule.forRoot(),
				DirectivesModule,
				FormsModule,
				PipesModule
			],
			declarations: [
				PageableTableTestHost,
				PageableTable,
				Pager,
				SortControls,
			]
		});

		fixture = testbed.createComponent(PageableTableTestHost);
		testHost = fixture.componentInstance;
		rootHTMLElement = fixture.debugElement.nativeElement;
		fixture.detectChanges();
	});

	it('displays empty table template when no items are provided', () => {
		const expectedContent = 'EMPTY_TABLE';
		testHost.noDataContent = expectedContent;
		fixture.detectChanges();
		expect(rootHTMLElement.innerText).toContain(expectedContent);
	});

	it('displays no data template when items are empty', () => {
		const expectedContent = 'NO_DATA';
		testHost.noDataContent = expectedContent;
		testHost.items = [];
		fixture.detectChanges();
		expect(rootHTMLElement.innerText).toContain(expectedContent);
	});

	it('displays no results template when filtered items are empty', () => {
		const expectedContent = 'NO_RESULTS';
		testHost.noResultsContent = expectedContent;
		testHost.items = [];
		testHost.hasItems = true;
		fixture.detectChanges();
		expect(rootHTMLElement.innerText).toContain(expectedContent);
	});

	it('displays table header', () => {
		const expectedContent = 'TABLE_HEADER';
		testHost.headerContent = expectedContent;
		fixture.detectChanges();
		expect(rootHTMLElement.innerText).toContain(expectedContent);
	});

	it('displays row template for each item in items', () => {
		const rowContent = 'ROW_CONTENT';
		testHost.rowContent = rowContent;
		testHost.items = [1, 2, 3];
		fixture.detectChanges();

		const instancesOfRowContent = rootHTMLElement.innerText.match(new RegExp(rowContent, 'g'));
		expect(instancesOfRowContent).toBeDefined();
		expect(instancesOfRowContent.length).toEqual(3);
	});

	it('binds the item to the row template', () => {
		const items = [
			'ITEM_A',
			'ITEM_B',
			'ITEM_C'
		];

		testHost.items = items;
		fixture.detectChanges();

		items.forEach((item) => {
			expect(rootHTMLElement.innerText).toContain(item);
		});
	});

	it('binds the index of the item to the row template', () => {
		const items = [
			'ITEM_A',
			'ITEM_B',
			'ITEM_C'
		];

		testHost.items = items;
		fixture.detectChanges();

		items.forEach((value, index) => {
			expect(rootHTMLElement.innerText).toContain(String(index));
		});
	});

	it('handles null pagingOptions', () => {
		testHost.pagingOptions = null;
		expect(() => {
			fixture.detectChanges();
		}).not.toThrow();
	});

});
