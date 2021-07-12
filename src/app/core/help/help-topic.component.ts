import {
	Component,
	ComponentFactory,
	ComponentFactoryResolver,
	ComponentRef,
	Injectable,
	Input,
	ViewChild,
	ViewContainerRef
} from '@angular/core';

import { StringUtils } from '../../common/string-utils.service';

@Injectable()
export class HelpTopics {
	static topics: any = {};
	private static topicOrder: any = {};

	static registerTopic(key: string, topicComponent: any, ordinal?: number) {
		HelpTopics.topics[key] = topicComponent;
		this.topicOrder[key] = { key, ordinal };
	}

	static getTopicList(): string[] {
		return Object.values(this.topicOrder)
			.sort((a: any, b: any) => a.ordinal - b.ordinal)
			.map((v: any) => v.key);
	}

	static getTopicTitle(title: string, short: boolean = false) {
		return StringUtils.hyphenToHuman(title);
	}
}

@Component({
	selector: 'help-topic',
	template: '<div #content></div>'
})
export class HelpTopicComponent {
	@ViewChild('content', { read: ViewContainerRef, static: true }) content: ViewContainerRef;

	@Input()
	set key(key: string) {
		if (null != this.componentRef) {
			this.componentRef.destroy();
		}

		if (null != key && null != HelpTopics.topics[key]) {
			// Dynamically create the component
			const factory: ComponentFactory<HelpTopicComponent> = this.resolver.resolveComponentFactory(
				HelpTopics.topics[key]
			);
			this.componentRef = this.content.createComponent(factory);
		} else {
			console.warn(`WARNING: No handler for help topic: ${key}.`);
		}
	}

	componentRef: ComponentRef<any>;

	constructor(private resolver: ComponentFactoryResolver) {}
}
