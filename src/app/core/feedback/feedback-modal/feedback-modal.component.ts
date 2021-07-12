import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import isEmpty from 'lodash/isEmpty';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { first } from 'rxjs/operators';
import { ConfigService } from '../../config.service';
import { Feedback } from '../feedback.model';
import { FeedbackService } from '../feedback.service';

@UntilDestroy()
@Component({
	templateUrl: 'feedback-modal.component.html',
	styleUrls: ['feedback-modal.component.scss']
})
export class FeedbackModalComponent implements OnInit {
	error: string | null;

	success: string;

	submitting = false;

	classificationOptions: any[];

	baseUrl = '';

	feedback: Feedback = new Feedback();

	constructor(
		private router: Router,
		private configService: ConfigService,
		private feedbackService: FeedbackService,
		public modalRef: BsModalRef
	) {}

	ngOnInit() {
		this.configService
			.getConfig()
			.pipe(first(), untilDestroyed(this))
			.subscribe((config: any) => {
				this.baseUrl = config.app.clientUrl || '';

				if (
					Array.isArray(config.feedback.classificationOpts) &&
					!isEmpty(config.feedback.classificationOpts)
				) {
					this.classificationOptions = config.feedback.classificationOpts;
				}
			});
	}

	submit() {
		this.error = null;
		this.submitting = true;

		// Get the current URL from the router at the time of submission.
		this.feedback.currentRoute = `${this.baseUrl}${this.router.url}`;

		this.feedbackService
			.submit(this.feedback)
			.pipe(untilDestroyed(this))
			.subscribe(
				() => {
					this.success = 'Feedback successfully submitted!';
					setTimeout(() => this.modalRef.hide(), 1500);
				},
				(error: HttpErrorResponse) => {
					this.submitting = false;
					this.error = error.error.message;
				}
			);
	}
}
