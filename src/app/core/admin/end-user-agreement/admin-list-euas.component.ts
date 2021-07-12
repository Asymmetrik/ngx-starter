import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { ModalAction, ModalService } from '../../../common/modal.module';
import {
	AbstractPageableDataComponent,
	PagingOptions,
	PagingResults,
	SortableTableHeader,
	SortChange,
	SortDirection
} from '../../../common/paging.module';
import { ColumnConfig } from '../../../common/paging/quick-column-toggle/quick-column-toggle.component';
import { SystemAlertService } from '../../../common/system-alert.module';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import cloneDeep from 'lodash/cloneDeep';
import { Observable } from 'rxjs';
import { filter, first, switchMap } from 'rxjs/operators';
import { EndUserAgreement } from './eua.model';
import { EuaService } from './eua.service';

@UntilDestroy()
@Component({
	templateUrl: './admin-list-euas.component.html'
})
export class AdminListEuasComponent extends AbstractPageableDataComponent<EndUserAgreement>
	implements OnInit {
	// Columns to show/hide in user table
	columns: ColumnConfig = {
		_id: { show: false, display: 'ID' },
		title: { show: true, display: 'Title' },
		text: { show: false, display: 'Text' },
		created: { show: true, display: 'Created' },
		published: { show: true, display: 'Published' },
		updated: { show: true, display: 'Updated' }
	};

	defaultColumns: ColumnConfig = JSON.parse(JSON.stringify(this.columns));

	headers: SortableTableHeader[] = [
		{ name: 'ID', sortable: false, sortField: '_id' },
		{
			name: 'Title',
			sortable: true,
			sortField: 'title',
			sortDir: SortDirection.asc,
			tooltip: 'Sort by Title',
			default: true
		},
		{ name: 'Text', sortable: false, sortField: 'text' },
		{
			name: 'Created',
			sortable: true,
			sortField: 'created',
			sortDir: SortDirection.desc,
			tooltip: 'Sort by Create Date'
		},
		{
			name: 'Published',
			sortable: true,
			sortField: 'published',
			sortDir: SortDirection.desc,
			tooltip: 'Sort by Publish Date'
		},
		{
			name: 'Updated',
			sortable: true,
			sortField: 'updated',
			sortDir: SortDirection.asc,
			tooltip: 'Sort by Title'
		}
	];

	headersToShow: SortableTableHeader[] = [];

	constructor(
		private modalService: ModalService,
		private euaService: EuaService,
		private route: ActivatedRoute,
		private alertService: SystemAlertService
	) {
		super();
	}

	ngOnInit() {
		this.alertService.clearAllAlerts();
		this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => {
			const clearCachedFilter = params?.[`clearCachedFilter`] ?? '';
			if (clearCachedFilter === 'true' || null == this.euaService.cache.listEuas) {
				this.euaService.cache.listEuas = {};
			}
		});

		this.headersToShow = this.headers.filter(
			(header: SortableTableHeader) =>
				header.sortField && this.columns?.[header.sortField].show
		);

		this.sortEvent$.next(this.headers.find((header: any) => header.default) as SortChange);

		this.initializeFromCache();

		super.ngOnInit();
	}

	columnsUpdated(updatedColumns: ColumnConfig) {
		this.columns = cloneDeep(updatedColumns);
		this.headersToShow = this.headers.filter(
			(header: SortableTableHeader) =>
				header.sortField && this.columns?.[header.sortField].show
		);
	}

	confirmDeleteEua(eua: EndUserAgreement) {
		const id = eua.euaModel._id;
		const title = eua.euaModel.title;

		this.modalService
			.confirm(
				'Delete End User Agreement?',
				`Are you sure you want to delete eua: "${eua.euaModel.title}" ?`,
				'Delete'
			)
			.pipe(
				first(),
				filter(action => action === ModalAction.OK),
				switchMap(() => this.euaService.remove(id)),
				untilDestroyed(this)
			)
			.subscribe(
				() => {
					this.alertService.addAlert(`Deleted EUA entitled: ${title}`, 'success');
					this.load$.next(true);
				},
				(response: HttpErrorResponse) => {
					this.alertService.addClientErrorAlert(response);
				}
			);
	}

	publishEua(eua: EndUserAgreement) {
		this.euaService
			.publish(eua.euaModel._id)
			.pipe(untilDestroyed(this))
			.subscribe(
				() => {
					this.alertService.addAlert(`Published ${eua.euaModel.title}`, 'success');
					this.load$.next(true);
				},
				(response: HttpErrorResponse) => {
					this.alertService.addClientErrorAlert(response);
				}
			);
		this.load$.next(true);
	}

	/**
	 * Initialize query, search, and paging options, possibly from cached user settings
	 */
	private initializeFromCache() {
		const cachedFilter = this.euaService.cache.listEuas;

		this.searchEvent$.next(cachedFilter.search);

		if (cachedFilter.paging) {
			this.pageEvent$.next(cachedFilter.paging);
			this.sortEvent$.next(cachedFilter.paging);
		}
	}

	loadData(
		pagingOptions: PagingOptions,
		search: string,
		query: any
	): Observable<PagingResults<EndUserAgreement>> {
		this.euaService.cache.listEuas = { search, paging: pagingOptions };

		return this.euaService.search(query, search, pagingOptions, {});
	}

	/**
	 * Opens a preview modal containing the text and title of this end user agreement.
	 *
	 * @param endUserAgreement - the end user agreement used to populate the modal
	 */
	previewEndUserAgreement(endUserAgreement: any) {
		const { text, title } = endUserAgreement;
		this.modalService.alert(title, text);
	}
}
