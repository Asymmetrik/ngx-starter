import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

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
import { take } from 'rxjs/operators';
import { ExportConfigService } from '../../export-config.service';
import { Feedback, FeedbackStatusOption } from '../../feedback/feedback.model';
import { FeedbackService } from '../../feedback/feedback.service';
import { AdminUsersService } from '../user-management/admin-users.service';

@UntilDestroy()
@Component({
	templateUrl: 'admin-list-feedback.component.html',
	styleUrls: ['admin-list-feedback.component.scss']
})
export class AdminListFeedbackComponent extends AbstractPageableDataComponent<any>
	implements OnInit {
	// Columns to show/hide in user table
	columns: ColumnConfig = {
		'creator.name': { show: true, display: 'Submitted By' },
		'creator.username': { show: false, display: 'Username' },
		'creator.email': { show: false, display: 'Email' },
		'creator.organization': { show: false, display: 'Organization' },
		created: { show: true, display: 'Submitted Date' },
		type: { show: false, display: 'Type' },
		body: { show: true, display: 'Feedback' },
		status: { show: true, display: 'Status' },
		assignee: { show: true, display: 'Assignee' },
		updated: { show: false, display: 'Updated' },
		browser: { show: false, display: 'Browser' },
		os: { show: false, display: 'OS' },
		url: { show: false, display: 'Submitted From' }
	};

	defaultColumns: ColumnConfig = JSON.parse(JSON.stringify(this.columns));

	headers: SortableTableHeader[] = [
		{
			name: 'Submitted By',
			sortable: false,
			sortField: 'creator.name'
		},
		{
			name: 'Username',
			sortable: false,
			sortField: 'creator.username'
		},
		{ name: 'Email', sortable: false, sortField: 'creator.email' },
		{
			name: 'Organization',
			sortable: false,
			sortField: 'creator.organization'
		},
		{
			name: 'Submitted Date',
			sortable: true,
			sortField: 'created',
			sortDir: SortDirection.desc,
			default: true
		},
		{ name: 'Type', sortable: true, sortField: 'type', sortDir: SortDirection.asc },
		{ name: 'Feedback', sortable: false, sortField: 'body' },
		{
			name: 'Status',
			sortable: true,
			sortField: 'status',
			sortDir: SortDirection.desc
		},
		{
			name: 'Assignee',
			sortable: true,
			sortField: 'assignee',
			sortDir: SortDirection.asc
		},
		{
			name: 'Last Updated',
			sortable: false,
			sortField: 'updated',
			sortDir: SortDirection.desc
		},
		{ name: 'Browser', sortable: true, sortField: 'browser', sortDir: SortDirection.asc },
		{ name: 'OS', sortable: true, sortField: 'os', sortDir: SortDirection.asc },
		{ name: 'Submitted From', sortable: true, sortField: 'url', sortDir: SortDirection.asc }
	];
	headersToShow: SortableTableHeader[] = [];

	feedbackStatusOptions = FeedbackStatusOption;

	assigneeUsernames: string[];

	constructor(
		private feedbackService: FeedbackService,
		private exportConfigService: ExportConfigService,
		private alertService: SystemAlertService,
		private adminUsersService: AdminUsersService
	) {
		super();
		this.adminUsersService
			.getAll({ 'roles.admin': true }, 'username')
			.pipe(take(1), untilDestroyed(this))
			.subscribe({
				next: usernames => {
					this.assigneeUsernames = usernames as string[];
				}
			});
	}

	ngOnInit() {
		this.alertService.clearAllAlerts();
		this.sortEvent$.next(this.headers.find((header: any) => header.default) as SortChange);
		this.columnsUpdated(this.columns);
		this.filterEvent$.next(this.getDefaultQuickFilters());
		super.ngOnInit();
	}

	columnsUpdated(updatedColumns: ColumnConfig) {
		this.columns = cloneDeep(updatedColumns);
		this.headersToShow = this.headers.filter(
			(header: SortableTableHeader) =>
				header.sortField && this.columns?.[header.sortField].show
		);
	}

	exportCurrentView() {
		const viewColumns = Object.keys(this.columns)
			.filter((key: string) => this.columns[key].show)
			.map((key: string) => {
				return { key, title: this.columns[key].display };
			});

		this.exportConfigService
			.postExportConfig('feedback', {
				q: this.getQuery(),
				s: this.search,
				cols: viewColumns,
				sort: this.pagingOptions.sortField,
				dir: this.pagingOptions.sortDir
			})
			.pipe(untilDestroyed(this))
			.subscribe((response: any) => {
				window.open(`/api/admin/feedback/csv/${response._id}`);
			});
	}

	getDefaultQuickFilters() {
		return { open: { show: false, display: 'New/Open Issues' } };
	}

	getQuery(): any {
		let query: any;

		if (this.filters.open.show) {
			query = {
				status: { $ne: FeedbackStatusOption.CLOSED }
			};
		}
		return query;
	}

	loadData(
		pagingOptions: PagingOptions,
		search: string,
		query: any
	): Observable<PagingResults<Feedback>> {
		return this.feedbackService.getFeedback(pagingOptions, query, search, {});
	}

	updateFeedbackAssignee(index: number, assignee: string) {
		this.feedbackService
			.updateFeedbackAssignee(this.items[index].id, assignee)
			.pipe(take(1), untilDestroyed(this))
			.subscribe({
				next: updatedFeedback => {
					this.items[index] = updatedFeedback;
				},
				error: (err: HttpErrorResponse) => {
					this.alertService.addAlert(err.error.message);
				}
			});
	}

	updateFeedbackStatus(index: number, status: FeedbackStatusOption) {
		this.feedbackService
			.updateFeedbackStatus(this.items[index].id, status)
			.pipe(take(1), untilDestroyed(this))
			.subscribe({
				next: updatedFeedback => {
					this.items[index] = updatedFeedback;
				},
				error: (err: HttpErrorResponse) => {
					this.alertService.addAlert(err.error.message);
				}
			});
	}
}
