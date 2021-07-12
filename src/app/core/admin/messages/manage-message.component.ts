import { HttpErrorResponse } from '@angular/common/http';
import { OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { ModalService } from 'src/app/common/modal.module';
import { SystemAlertService } from 'src/app/common/system-alert.module';
import { ConfigService } from '../../config.service';
import { Message } from '../../messages/message.class';

export abstract class ManageMessageComponent implements OnInit {
	message: Message;
	error?: string;
	okDisabled: boolean;

	// Variables that will be set by implementing classes
	title: string;
	subtitle: string;
	okButtonText: string;

	typeOptions: any[] = [
		{ value: 'MOTD', display: 'MOTD' },
		{ value: 'INFO', display: 'INFO' },
		{ value: 'WARN', display: 'WARN' },
		{ value: 'ERROR', display: 'ERROR' }
	];

	protected config: any;
	protected navigateOnSuccess: string;

	constructor(
		protected modalService: ModalService,
		protected router: Router,
		protected configService: ConfigService,
		public alertService: SystemAlertService
	) {}

	ngOnInit() {
		this.configService
			.getConfig()
			.pipe(first(), untilDestroyed(this))
			.subscribe((config: any) => {
				this.config = config;

				this.initialize();
			});
	}

	abstract initialize(): void;

	abstract submitMessage(message: Message): Observable<any>;

	previewMessage() {
		const { body, title } = this.message;
		this.modalService.alert(title, body);
	}

	submit() {
		this.submitMessage(this.message)
			.pipe(untilDestroyed(this))
			.subscribe(
				() => this.router.navigate([this.navigateOnSuccess]),
				(response: HttpErrorResponse) => {
					if (response.status >= 400 && response.status < 500) {
						const errors = response.message.split('\n');
						this.error = errors.join(', ');
					}
				}
			);
	}
}
