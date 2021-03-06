import { Component } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap/modal';
import { AbstractModalDirective } from '../abstract-modal.directive';
import { ModalAction, ModalCloseEvent, ModalInput } from '../modal.model';

@Component({
	templateUrl: 'configurable-modal.component.html',
	styleUrls: ['configurable-modal.component.scss']
})
export class ConfigurableModalComponent extends AbstractModalDirective {
	message: string;

	inputs: ModalInput[];

	formData: any = {};

	constructor(public modalRef: BsModalRef) {
		super(modalRef);
	}

	ok() {
		this.modalRef.hide();
		const event: ModalCloseEvent = { action: ModalAction.OK };
		if (this.inputs) {
			event.inputData = this.formData;
		}
		this.onClose.next(event);
	}
}
