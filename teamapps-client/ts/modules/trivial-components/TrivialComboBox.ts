/*-
 * ========================LICENSE_START=================================
 * TeamApps
 * ---
 * Copyright (C) 2014 - 2021 TeamApps.org
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
/*!
Trivial Components (https://github.com/trivial-components/trivial-components)

Copyright 2016 Yann Massard (https://github.com/yamass) and other contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
	DEFAULT_TEMPLATES,
	EditingMode,
	keyCodes,
	objectEquals,
	RenderingFunction,
	setTimeoutOrDoImmediately,
	TrivialComponent,
	unProxyEntry
} from "./TrivialCore";
import {TrivialEvent} from "./TrivialEvent";
import {Instance as Popper} from '@popperjs/core';
import {parseHtml} from "../Common";
import {DropDownComponent, SelectionDirection} from "./dropdown/DropdownComponent";
import {createComboBoxPopper} from "./ComboBoxPopper";

export interface TrivialComboBoxConfig<E> {
	/**
	 * Rendering function used to display a _selected_ entry
	 * (i.e. an entry inside the editor area of the component, not the dropdown).
	 *
	 * @param entry
	 * @return HTML string
	 * @default `wrapWithDefaultTagWrapper(entryRenderingFunction(entry))`
	 */
	selectedEntryRenderingFunction: RenderingFunction<E>,

	/**
	 * Performance setting. Defines the maximum number of entries until which text highlighting is performed.
	 * Set to `0` to disable text highlighting.
	 *
	 * @default `100`
	 */
	textHighlightingEntryLimit?: number,

	/**
	 * Whether or not to provide auto-completion.
	 *
	 * @default `true`
	 */
	autoComplete?: boolean,

	/**
	 * The number of milliseconds to wait until auto-completion is performed.
	 *
	 * @default `0`
	 */
	autoCompleteDelay?: number,

	/**
	 * Used to set the editor's text when focusing the component.
	 * Additionally used to generate an autocompletion string for the current input of the user.
	 *
	 * @param entry the currently selected entry in the dropdown
	 */
	entryToEditorTextFunction: (entry: E) => string,

	/**
	 * Creates an entry (object) from a string entered by the user.
	 *
	 * @param freeText the text entered by the user
	 * @default `{ displayValue: freeText, _isFreeTextEntry: true }`
	 */
	textToEntryFunction?: (freeText: string) => E | any,

	/**
	 * The clear button is a the small 'x' at the right of the entry display that can be clicked to clear the selection.
	 */
	showClearButton?: boolean,

	/**
	 * The trigger is the button on the right side of the component that can be clicket to open the dropdown.
	 *
	 * @default `true`
	 */
	showTrigger?: boolean,

	editingMode?: EditingMode,

	/**
	 * It `true`, opening the dropdown will be delayed until the result callback of the [[queryFunction]] is called.
	 *
	 * @default `false`
	 */
	showDropDownOnResultsOnly?: boolean,

	/**
	 * HTML string defining the spinner to be displayed while entries are being retrieved.
	 */
	spinnerTemplate?: string,

	/**
	 * When typing, preselect the first returned query result.
	 */
	preselectFirstQueryResult?: boolean,

	placeholderText?: string
}

export class TrivialComboBox<E> implements TrivialComponent {

	public readonly onSelectedEntryChanged = new TrivialEvent<E>(this);
	public readonly onFocus = new TrivialEvent<void>(this);
	public readonly onBlur = new TrivialEvent<void>(this);
	public readonly onBeforeQuery = new TrivialEvent<string>(this);
	public readonly onBeforeDownOpens = new TrivialEvent<string>(this);

	private config: TrivialComboBoxConfig<E>;

	private $comboBox: HTMLElement;
	private $dropDown: HTMLElement;
	private $editor: HTMLInputElement;
	private $selectedEntryWrapper: HTMLElement;
	private $trigger: HTMLElement;
	private $clearButton: HTMLElement;

	private popper: Popper;
	private dropDownComponent: DropDownComponent<E>;

	private selectedEntry: E = null;

	private blurCausedByClickInsideComponent = false;

	private autoCompleteTimeoutId = -1;
	private doNoAutoCompleteBecauseBackspaceWasPressed = false;

	private editingMode: EditingMode;
	private dropDownOpen = false;
	private isEditorVisible = false;


	constructor(options: TrivialComboBoxConfig<E>, dropDownComponent?: DropDownComponent<E>) {
		this.config = {
			spinnerTemplate: DEFAULT_TEMPLATES.defaultSpinnerTemplate,
			textHighlightingEntryLimit: 100,
			autoComplete: true,
			autoCompleteDelay: 0,
			textToEntryFunction: (freeText: string) => null,
			showClearButton: false,
			showTrigger: true,
			editingMode: "editable", // one of 'editable', 'disabled' and 'readonly'
			showDropDownOnResultsOnly: false,
			preselectFirstQueryResult: true,
			placeholderText: "",

			...options
		};

		this.$comboBox = parseHtml(`<div class="tr-combobox tr-input-wrapper editor-hidden">
			<div class="tr-combobox-main-area">
				<input type="text" class="tr-combobox-editor tr-editor" autocomplete="off"></input>
				<div class="tr-combobox-selected-entry-wrapper"></div>			
			</div>
            <div class="tr-remove-button ${this.config.showClearButton ? '' : 'hidden'}"></div>
            <div class="tr-trigger ${this.config.showTrigger ? '' : 'hidden'}"><span class="tr-trigger-icon"></span></div>
        </div>`);
		this.$selectedEntryWrapper = this.$comboBox.querySelector(':scope .tr-combobox-selected-entry-wrapper');
		this.$clearButton = this.$comboBox.querySelector(':scope .tr-remove-button');
		this.$clearButton.addEventListener("mousedown", (e) => {
			this.$editor.value = (console.log(""), "")
			this.setValue(null, true, e);
		});
		this.$trigger = this.$comboBox.querySelector(':scope .tr-trigger');
		this.$dropDown = parseHtml('<div class="tr-dropdown"></div>');
		this.$dropDown.addEventListener("scroll", e => {
			e.stopPropagation();
			e.preventDefault();
		});
		this.setEditingMode(this.config.editingMode);
		this.$editor = this.$comboBox.querySelector(':scope .tr-editor');
		this.$editor.addEventListener("focus", () => {
			this.onFocus.fire();
			this.$comboBox.classList.add('focus');
			if (!this.blurCausedByClickInsideComponent) {
				this.showEditor();
			}
		})
		this.$editor.addEventListener("blur", (e: FocusEvent) => {
			if (this.blurCausedByClickInsideComponent) {
				this.$editor.focus();
			} else {
				this.onBlur.fire();
				this.$comboBox.classList.remove('focus');
				if (this.isEditorVisible) {
					let freeTextEntry = this.getFreeTextEntry();
					if (freeTextEntry != null) {
						this.setValue(freeTextEntry, true, e);
					}
				}
				this.hideEditor();
				this.closeDropDown();
			}
		})
		this.$editor.addEventListener("keydown", (e: KeyboardEvent) => {
			if (keyCodes.isModifierKey(e)) {
				return;
			} else if (e.which == keyCodes.tab || e.which == keyCodes.enter) {
				if (this.isEditorVisible) {
					e.which == keyCodes.enter && e.preventDefault(); // do not submit form
					let highlightedEntry = this.dropDownComponent.getValue();
					if (this.dropDownOpen && highlightedEntry) {
						this.setValue(highlightedEntry, true, e);
					} else {
						let freeTextEntry = this.getFreeTextEntry();
						if (freeTextEntry != null) {
							this.setValue(freeTextEntry, true, e);
						}
					}
					this.closeDropDown();
					this.hideEditor();
				}
				return;
			} else if (e.which == keyCodes.left_arrow || e.which == keyCodes.right_arrow) {
				if (this.dropDownOpen && this.dropDownComponent.handleKeyboardInput(e)) {
					this.setAndSelectEditorValue(this.dropDownComponent.getValue());
					e.preventDefault();
					return;
				} else {
					this.showEditor();
					return; // let the user navigate freely left and right...
				}
			} else if (e.which == keyCodes.backspace || e.which == keyCodes.delete) {
				this.doNoAutoCompleteBecauseBackspaceWasPressed = true; // we want query results, but no autocomplete
				setTimeout(() => this.query(this.getEditorValueLeftOfSelection(), 0)); // asynchronously to make sure the editor has been updated
			} else if (e.which == keyCodes.up_arrow || e.which == keyCodes.down_arrow) {
				if (!this.isEditorVisible) {
					this.$editor.select();
					this.showEditor();
				}
				const direction = e.which == keyCodes.up_arrow ? -1 : 1;
				if (!this.dropDownOpen) {
					this.query(this.getEditorValueLeftOfSelection(), direction);
					this.openDropDown(); // directly open the dropdown (the user definitely wants to see it)
				} else {
					if (this.dropDownComponent.handleKeyboardInput(e)) {
						this.setAndSelectEditorValue(this.dropDownComponent.getValue());
					}
				}
				e.preventDefault(); // some browsers move the caret to the beginning on up key
			} else if (e.which == keyCodes.escape) {
				if (!(!this.isEntrySelected() && this.$editor.value.length > 0 && this.dropDownOpen)) {
					this.hideEditor();
					this.$editor.value = (console.log(""), "")
				}
				this.closeDropDown();
			} else {
				if (!this.isEditorVisible) {
					this.showEditor();
					this.$editor.select();
				}
				if (!this.config.showDropDownOnResultsOnly) {
					this.openDropDown();
				}

				// We need the new editor value (after the keydown event). Therefore setTimeout().
				setTimeout(() => this.query(this.getEditorValueLeftOfSelection(), this.config.preselectFirstQueryResult && this.$editor.value ? 1 : 0))
			}
		});

		[this.$comboBox, this.$dropDown].forEach(element => {
			element.addEventListener("mousedown", () => {
				this.blurCausedByClickInsideComponent = true;
				setTimeout(() => this.blurCausedByClickInsideComponent = false);
			}, true);
			element.addEventListener("mouseup", () => {
				if (this.blurCausedByClickInsideComponent) {
					this.$editor.focus();
					this.blurCausedByClickInsideComponent = false;
				}
			});
			element.addEventListener("mouseout", () => {
				if (this.blurCausedByClickInsideComponent) {
					this.$editor.focus();
					this.blurCausedByClickInsideComponent = false;
				}
			});
		});

		this.setDropDownComponent(dropDownComponent);

		this.$editor.addEventListener("mousedown", () => {
			if (this.editingMode === "editable") {
				if (!this.config.showDropDownOnResultsOnly) {
					this.openDropDown();
				}
				this.query(this.getEditorValueLeftOfSelection());
			}
		});
		this.$trigger.addEventListener("mousedown", () => {
			if (this.dropDownOpen) {
				this.closeDropDown();
				this.showEditor();
			} else if (this.editingMode === "editable") {
				this.showEditor();
				this.$editor.select();
				this.dropDownComponent.setValue(this.getValue())
				this.openDropDown();
			}
		});
		this.$selectedEntryWrapper.addEventListener("click", () => {
			if (this.editingMode === "editable") {
				this.showEditor();
				this.$editor.select()
				if (!this.config.showDropDownOnResultsOnly) {
					this.openDropDown();
				}
				this.dropDownComponent.setValue(this.getValue())
			}
		});

		this.popper = createComboBoxPopper(this.$comboBox, this.$dropDown, () => this.closeDropDown());
	}

	private getFreeTextEntry() {
		let editorValue = this.getEditorValueLeftOfSelection();
		return editorValue ? this.config.textToEntryFunction(editorValue) : null;
	}

	private setAndSelectEditorValue(value: E) {
		if (value != null) {
			this.$editor.value = (console.log(this.config.entryToEditorTextFunction(value)), this.config.entryToEditorTextFunction(value))
			this.$editor.select();
		} else {
			this.$editor.value = (console.log(""), "")
		}
	}

	private handleDropDownValueChange(eventData: { value: E; finalSelection: boolean }) {
		if (eventData.finalSelection) {
			this.setValue(eventData.value, true);
			this.closeDropDown();
			this.hideEditor();
		}
	}

	private async query(nonSelectedEditorValue: string, highlightDirection: SelectionDirection = 0) {
		this.onBeforeQuery.fire(nonSelectedEditorValue);
		let gotResultsForQuery = await this.dropDownComponent.handleQuery(nonSelectedEditorValue, highlightDirection);

		if (highlightDirection !== 0) {
			this.autoCompleteIfPossible(this.config.autoCompleteDelay);
		}

		if (this.config.showDropDownOnResultsOnly && gotResultsForQuery && document.activeElement == this.$editor) {
			this.openDropDown();
		}
	}

	private fireChangeEvents(entry: E, originalEvent?: unknown) {
		this.onSelectedEntryChanged.fire(unProxyEntry(entry), originalEvent);
	}

	public setValue(entry: E, fireEventIfChanged?: boolean, originalEvent?: unknown) {
		let changing = !objectEquals(entry, this.selectedEntry);
		this.selectedEntry = entry;
		this.$selectedEntryWrapper.innerHTML = '';
		let $selectedEntry = parseHtml(this.config.selectedEntryRenderingFunction(entry));
		if ($selectedEntry != null) {
			$selectedEntry.classList.add("tr-combobox-entry");
			this.$selectedEntryWrapper.append($selectedEntry);
		} else {
			this.$selectedEntryWrapper.append(parseHtml(`<div class="placeholder-text">${this.config.placeholderText ?? ""}</div>`))
		}
		if (entry != null) {
			this.$editor.value = (console.log(this.config.entryToEditorTextFunction(entry)), this.config.entryToEditorTextFunction(entry))
		}

		if (changing && fireEventIfChanged) {
			this.fireChangeEvents(entry, originalEvent);
		}
		if (this.$clearButton) {
			this.$clearButton.classList.toggle("hidden", entry == null);
		}
		if (this.isEditorVisible) {
			this.showEditor(); // reposition editor
		}
		if (this.dropDownOpen) {
			this.popper.update();
		}
	}

	private isEntrySelected() {
		return this.selectedEntry != null;
	}

	private showEditor() {
		this.$comboBox.classList.remove("editor-hidden");
		this.isEditorVisible = true;
	}

	private hideEditor() {
		this.$comboBox.classList.add("editor-hidden");
		this.isEditorVisible = false;
	}

	private parentElement: Element;

	public openDropDown() {
		if (this.isDropDownNeeded()) {
			if (this.getMainDomElement().parentElement !== this.parentElement) {
				this.popper.destroy();
				this.popper = createComboBoxPopper(this.$comboBox, this.$dropDown, () => this.closeDropDown());
				this.parentElement = this.getMainDomElement().parentElement;
			}
			if (!this.dropDownOpen) {
				this.onBeforeDownOpens.fire();
				this.$comboBox.classList.add("open");
				this.popper.update();
				this.dropDownOpen = true;
			}
		}
	}

	public closeDropDown() {
		this.$comboBox.classList.remove("open");
		this.dropDownOpen = false;
	}

	private getEditorValueLeftOfSelection() {
		return this.$editor.value.substring(0, Math.min(this.$editor.selectionStart, this.$editor.selectionEnd));
	}

	private autoCompleteIfPossible(delay?: number) {
		if (this.config.autoComplete) {
			clearTimeout(this.autoCompleteTimeoutId);
			const dropDownValue = this.dropDownComponent.getValue();
			if (dropDownValue && !this.doNoAutoCompleteBecauseBackspaceWasPressed) {
				this.autoCompleteTimeoutId = setTimeoutOrDoImmediately(() => {
					const currentEditorValue = this.getEditorValueLeftOfSelection();
					const entryAsString = this.config.entryToEditorTextFunction(dropDownValue);
					if (entryAsString.toLowerCase().indexOf(("" + currentEditorValue).toLowerCase()) === 0) {
						this.$editor.value = (console.log(currentEditorValue + entryAsString.substr(currentEditorValue.length)), currentEditorValue + entryAsString.substr(currentEditorValue.length))
						if (document.activeElement == this.$editor) {
							(this.$editor as any).setSelectionRange(currentEditorValue.length, entryAsString.length);
						}
					}
				}, delay);
			}
			this.doNoAutoCompleteBecauseBackspaceWasPressed = false;
		}
	}

	private isDropDownNeeded() {
		return this.editingMode == 'editable';
	}

	public setEditingMode(newEditingMode: EditingMode) {
		this.editingMode = newEditingMode;
		this.$comboBox.classList.remove("editable", "readonly", "disabled");
		this.$comboBox.classList.add(this.editingMode);
		if (this.isDropDownNeeded()) {
			this.$comboBox.append(this.$dropDown);
		}
	}

	public getValue(): E {
		return unProxyEntry(this.selectedEntry);
	}

	public getDropDownComponent(): DropDownComponent<E> {
		return this.dropDownComponent;
	}

	public setDropDownComponent(dropDownComponent: DropDownComponent<E>): void {
		if (this.dropDownComponent != null) {
			this.dropDownComponent.onValueChanged.removeListener(this.handleDropDownValueChange);
			this.$dropDown.innerHTML = '';
		}
		this.dropDownComponent = dropDownComponent;
		this.$dropDown.append(dropDownComponent.getMainDomElement());
		dropDownComponent.onValueChanged.addListener(this.handleDropDownValueChange.bind(this));
		dropDownComponent.setValue(this.getValue());
	}

	public focus() {
		this.showEditor();
		this.$editor.select();
	};

	public getEditor(): Element {
		return this.$editor;
	}

	public setShowClearButton(showClearButton: boolean) {
		this.config.showClearButton = showClearButton;
		this.$clearButton.classList.toggle('hidden', !showClearButton);
	}

	public setShowTrigger(showTrigger: boolean) {
		this.config.showTrigger = showTrigger;
		this.$trigger.classList.toggle('hidden', !showTrigger);
	}


	public isDropDownOpen(): boolean {
		return this.dropDownOpen;
	}

	public destroy() {
		this.$comboBox.remove();
		this.$dropDown.remove();
	};

	getMainDomElement(): HTMLElement {
		return this.$comboBox;
	}

	setPlaceholderText(placeholderText: string) {
		this.config.placeholderText = placeholderText;
		let $placeholderText: HTMLElement = this.$selectedEntryWrapper.querySelector(":scope .placeholder-text");
		if ($placeholderText != null) {
			$placeholderText.innerText = placeholderText ?? "";
		}
	}
}
