/*-
 * ========================LICENSE_START=================================
 * TeamApps
 * ---
 * Copyright (C) 2014 - 2019 TeamApps.org
 * ---
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =========================LICENSE_END==================================
 */

import {UiToolbar} from "./tool-container/toolbar/UiToolbar";
import {UiToolbarConfig} from "../generated/UiToolbarConfig";
import {UiSplitPaneConfig} from "../generated/UiSplitPaneConfig";
import {UiSplitPane} from "./UiSplitPane";
import {UiComponent} from "./UiComponent";
import {UiApplicationLayoutConfig} from "../generated/UiApplicationLayoutConfig";
import {TeamAppsUiContext} from "./TeamAppsUiContext";
import {TeamAppsUiComponentRegistry} from "./TeamAppsUiComponentRegistry";
import {parseHtml} from "./Common";

export class UiApplicationLayout extends UiComponent<UiApplicationLayoutConfig> {
	private $mainDiv: HTMLElement;
	private _toolbar: UiToolbar;
	private _rootSplitPane: UiSplitPane;

	private _$toolbarContainer: HTMLElement;
	private _$contentContainer: HTMLElement;

	constructor(config: UiApplicationLayoutConfig,
	            context: TeamAppsUiContext) {
		super(config, context);
		this.$mainDiv = parseHtml('<div id="' + config.id + '" class="UiApplicationLayout"></div>');

		this._$toolbarContainer = parseHtml('<div class="UiApplicationLayout_toolbarContainer"></div>');
		this.$mainDiv.appendChild(this._$toolbarContainer);
		this.setToolbar(config.toolbar as UiToolbar);

		var $contentContainerWrapper = parseHtml('<div class="UiApplicationLayout_contentContainerWrapper"></div>');
		this.$mainDiv.appendChild($contentContainerWrapper);
		this._$contentContainer = parseHtml('<div class="UiApplicationLayout_contentContainer"></div>');
		$contentContainerWrapper.appendChild(this._$contentContainer);
		this.setRootSplitPane(config.rootSplitPane as UiSplitPane);
	}

	public onResize(): void {
		this._toolbar && this._toolbar.reLayout();
		this._rootSplitPane && this._rootSplitPane.reLayout();
	}

	public setToolbar(toolbar: UiToolbar): void {
		if (this._toolbar) {
			this._$toolbarContainer.innerHTML = '';
		}
		this._toolbar = toolbar;
		this._$toolbarContainer.classList.toggle('hidden', !toolbar);
		if (toolbar) {
			this._$toolbarContainer.appendChild(this._toolbar.getMainDomElement());
			this._toolbar.attachedToDom = this.attachedToDom;
		}
	}

	public setRootSplitPane(splitPane: UiSplitPane): void {
		if (this._rootSplitPane) {
			this._$contentContainer.innerHTML = '';
			this._rootSplitPane = null;
		}
		if (splitPane) {
			this._rootSplitPane = splitPane;
			this._$contentContainer.appendChild(this._rootSplitPane.getMainDomElement());
			this._rootSplitPane.attachedToDom = this.attachedToDom;
		}
	}

	public getMainDomElement(): HTMLElement {
		return this.$mainDiv;
	}


	protected onAttachedToDom() {
		if (this._toolbar) this._toolbar.attachedToDom = true;
		if (this._rootSplitPane) this._rootSplitPane.attachedToDom = true;
	}

	public destroy(): void {
	}
}

TeamAppsUiComponentRegistry.registerComponentClass("UiApplicationLayout", UiApplicationLayout);
