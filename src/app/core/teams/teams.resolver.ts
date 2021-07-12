import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve } from '@angular/router';

import { Team } from './team.model';
import { TeamsService } from './teams.service';

@Injectable()
export class TeamsResolve implements Resolve<Team | null> {
	constructor(private teamsService: TeamsService) {}

	resolve(route: ActivatedRouteSnapshot) {
		const id = route.paramMap.get('id');
		if (id == null) {
			return null;
		}
		return this.teamsService.get(id);
	}
}
