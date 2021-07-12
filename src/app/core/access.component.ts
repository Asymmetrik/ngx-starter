import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	template: `
		<div class="container">
			<div class="row">
				<div class="col-md-8 offset-2 jumbotron" style="margin-top: 4rem;">
					<h1>{{ status }}</h1>
					<p>{{ message }}</p>
					<p>Once your account is updated, <a href="/">go back home</a> and try again.</p>
				</div>
			</div>
		</div>
	`,
	styles: ['']
})
export class AccessComponent {
	status = '403';
	message = 'User is missing authorizations for access.';

	constructor(private router: Router) {
		const navigation = this.router.getCurrentNavigation();
		const state = navigation?.extras?.state;

		if (state) {
			this.status = state.status;
			this.message = state.message;
		}
	}
}
