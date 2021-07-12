import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter, first, switchMap } from 'rxjs/operators';
import { ModalAction, ModalService } from 'src/app/common/modal.module';
import {
	AbstractPageableDataComponent,
	PagingOptions,
	PagingResults,
	SortableTableHeader,
	SortChange,
	SortDirection
} from 'src/app/common/paging.module';
import { SystemAlertService } from 'src/app/common/system-alert.module';
import { Message } from '../../messages/message.class';
import { MessageService } from '../../messages/message.service';

@UntilDestroy()
@Component({
	templateUrl: './list-messages.component.html'
})
export class ListMessagesComponent extends AbstractPageableDataComponent<Message>
	implements OnInit {
	filters: any = {};
	sort: any;

	headers: SortableTableHeader[] = [
		{ name: 'Title', sortField: 'title', sortDir: SortDirection.asc, sortable: true },
		{ name: 'Type', sortField: 'type', sortDir: SortDirection.asc, sortable: true },
		{ name: 'Created', sortField: 'created', sortDir: SortDirection.desc, sortable: true },
		{
			name: 'Updated',
			sortField: 'updated',
			sortDir: SortDirection.desc,
			sortable: true,
			default: true
		}
	];

	constructor(
		private messageService: MessageService,
		public alertService: SystemAlertService,
		private modalService: ModalService,
		private route: ActivatedRoute
	) {
		super();
	}

	ngOnInit() {
		this.alertService.clearAllAlerts();
		this.route.params.pipe(untilDestroyed(this)).subscribe((params: Params) => {
			const clearCachedFilter = params?.[`clearCachedFilter`] ?? '';
			if (clearCachedFilter === 'true' || null == this.messageService.cache.listMessages) {
				this.messageService.cache.listMessages = {};
			}

			this.sortEvent$.next(this.headers.find((header: any) => header.default) as SortChange);

			this.initializeFromCache();

			super.ngOnInit();
		});
	}

	/**
	 * Initialize query, search, and paging options, possibly from cached user settings
	 */
	private initializeFromCache() {
		const cachedFilter = this.messageService.cache.listMessages;

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
	): Observable<PagingResults<Message>> {
		this.messageService.cache.messages = { search, paging: pagingOptions };

		return this.messageService.search(query, search, pagingOptions);
	}

	confirmDeleteMessage(message: Message) {
		this.modalService
			.confirm(
				'Delete message?',
				`Are you sure you want to delete message: "${message.title}" ?`,
				'Delete'
			)
			.pipe(
				first(),
				filter(action => action === ModalAction.OK),
				switchMap(() => this.messageService.remove(message)),
				untilDestroyed(this)
			)
			.subscribe(
				() => {
					this.alertService.addAlert(`Deleted message.`, 'success');
					this.load$.next(true);
				},
				(error: HttpErrorResponse) => {
					this.alertService.addAlert(error.message);
				}
			);
	}

	/**
	 * Opens a preview modal containing the body and title of this message.
	 *
	 * @param message - the message used to populate the modal
	 */
	previewMessage(message: Message) {
		const { body, title } = message;
		this.modalService.alert(title, body);
	}
}
