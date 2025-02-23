/*-
 * ========================LICENSE_START=================================
 * TeamApps
 * ---
 * Copyright (C) 2014 - 2023 TeamApps.org
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
package org.teamapps.ux.component.table;

import org.teamapps.data.extract.PropertyExtractor;
import org.teamapps.data.extract.PropertyProvider;
import org.teamapps.data.extract.ValueExtractor;
import org.teamapps.data.extract.ValueInjector;
import org.teamapps.dto.UiTableColumn;
import org.teamapps.icons.Icon;
import org.teamapps.ux.component.field.AbstractField;
import org.teamapps.ux.component.field.FieldMessage;
import org.teamapps.ux.component.format.TextAlignment;
import org.teamapps.ux.component.template.Template;
import org.teamapps.ux.session.CurrentSessionContext;
import org.teamapps.ux.session.SessionContext;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class TableColumn<RECORD, VALUE> {
	public static final int DEFAULT_WIDTH = 150;
	private Table<RECORD> table;

	private final String propertyName;
	private Icon<?, ?> icon;
	private String title;
	private AbstractField<VALUE> field;
	private Template displayTemplate;
	private AbstractField<?> headerRowField;
	private AbstractField<?> footerRowField;
	private int minWidth;
	private int defaultWidth;
	private int maxWidth;
	private boolean visible = true;
	private boolean sortable = true;
	private boolean resizeable = true;
	private boolean hiddenIfOnlyEmptyCellsVisible = false;
	private TextAlignment headerAlignment = TextAlignment.LEFT;
	private ValueExtractor<RECORD, VALUE> valueExtractor;
	private ValueInjector<RECORD, VALUE> valueInjector;
	private PropertyProvider<RECORD> displayPropertyProvider;

	private List<FieldMessage> messages = new ArrayList<>();

	public TableColumn(String propertyName, AbstractField<VALUE> field) {
		this(propertyName, null, null, field, null, 0, DEFAULT_WIDTH, 0);
	}

	public TableColumn(String propertyName, String title, AbstractField<VALUE> field) {
		this(propertyName, null, title, field, null, 0, DEFAULT_WIDTH, 0);
	}

	public TableColumn(String propertyName, Icon<?, ?> icon, String title, AbstractField<VALUE> field) {
		this(propertyName, icon, title, field, null, 0, DEFAULT_WIDTH, 0);
	}

	public TableColumn(String propertyName, Icon<?, ?> icon, String title, AbstractField<VALUE> field, int defaultWidth) {
		this(propertyName, icon, title, field, null, 0, defaultWidth, 0);
	}

	public TableColumn(String propertyName, Icon<?, ?> icon, String title, Template displayTemplate) {
		this(propertyName, icon, title, null, displayTemplate, 0, DEFAULT_WIDTH, 0);
	}

	public TableColumn(String propertyName, Icon<?, ?> icon, String title, AbstractField<VALUE> field, Template displayTemplate, int minWidth, int defaultWidth, int maxWidth) {
		this.propertyName = propertyName;
		this.icon = icon;
		this.title = title;
		this.field = field;
		this.displayTemplate = displayTemplate;
		this.minWidth = minWidth;
		this.defaultWidth = defaultWidth;
		this.maxWidth = maxWidth;
	}

	public UiTableColumn createUiTableColumn() {
		SessionContext context = CurrentSessionContext.get();
		UiTableColumn uiTableColumn = new UiTableColumn(propertyName, context.resolveIcon(icon), title, field.createUiReference());
		uiTableColumn.setDefaultWidth(defaultWidth);
		uiTableColumn.setMinWidth(minWidth);
		uiTableColumn.setDefaultWidth(defaultWidth);
		uiTableColumn.setMaxWidth(maxWidth);
		uiTableColumn.setSortable(sortable);
		uiTableColumn.setResizeable(resizeable);
		uiTableColumn.setVisible(visible);
		uiTableColumn.setHeaderAlignment(headerAlignment.toUiTextAlignment());
		uiTableColumn.setHiddenIfOnlyEmptyCellsVisible(hiddenIfOnlyEmptyCellsVisible);
		uiTableColumn.setMessages(messages.stream().map(fieldMessage -> fieldMessage.createUiFieldMessage(FieldMessage.Position.POPOVER, FieldMessage.Visibility.ON_HOVER_OR_FOCUS)).collect(Collectors.toList()));
		uiTableColumn.setHeaderRowField(headerRowField != null ? headerRowField.createUiReference() : null);
		uiTableColumn.setFooterRowField(footerRowField != null ? footerRowField.createUiReference() : null);
		uiTableColumn.setDisplayTemplate(displayTemplate != null ? displayTemplate.createUiTemplate() : null);
		return uiTableColumn;
	}

	public List<FieldMessage> getMessages() {
		return messages;
	}

	public void addMessage(FieldMessage message) {
		this.messages.add(message);
		if (table != null) {
			table.updateColumnMessages(this);
		}
	}

	public void removeMessage(FieldMessage message) {
		this.messages.remove(message);
		if (table != null) {
			table.updateColumnMessages(this);
		}
	}

	public void setMessages(List<FieldMessage> messages) {
		this.messages = messages;
		if (table != null) {
			table.updateColumnMessages(this);
		}
	}

	public Icon<?, ?> getIcon() {
		return icon;
	}

	public TableColumn<RECORD, VALUE> setIcon(Icon<?, ?> icon) {
		this.icon = icon;
		return this;
	}

	public String getTitle() {
		return title;
	}

	public TableColumn<RECORD, VALUE> setTitle(String title) {
		this.title = title;
		return this;
	}

	public AbstractField<VALUE> getField() {
		return field;
	}

	public TableColumn<RECORD, VALUE> setField(AbstractField<VALUE> field) {
		this.field = field;
		return this;
	}

	public int getMinWidth() {
		return minWidth;
	}

	public TableColumn<RECORD, VALUE> setMinWidth(int minWidth) {
		this.minWidth = minWidth;
		return this;
	}

	public int getDefaultWidth() {
		return defaultWidth;
	}

	public TableColumn<RECORD, VALUE> setDefaultWidth(int defaultWidth) {
		this.defaultWidth = defaultWidth;
		return this;
	}

	public int getMaxWidth() {
		return maxWidth;
	}

	public TableColumn<RECORD, VALUE> setMaxWidth(int maxWidth) {
		this.maxWidth = maxWidth;
		return this;
	}

	public boolean isVisible() {
		return visible;
	}

	public TableColumn<RECORD, VALUE> setVisible(boolean visible) {
		this.visible = visible;
		if (table != null) {
			table.updateColumnVisibility(this);
		}
		return this;
	}

	public boolean isSortable() {
		return sortable;
	}

	public TableColumn<RECORD, VALUE> setSortable(boolean sortable) {
		this.sortable = sortable;
		return this;
	}

	public boolean isResizeable() {
		return resizeable;
	}

	public TableColumn<RECORD, VALUE> setResizeable(boolean resizeable) {
		this.resizeable = resizeable;
		return this;
	}

	public boolean isHiddenIfOnlyEmptyCellsVisible() {
		return hiddenIfOnlyEmptyCellsVisible;
	}

	public TableColumn<RECORD, VALUE> setHiddenIfOnlyEmptyCellsVisible(boolean hiddenIfOnlyEmptyCellsVisible) {
		this.hiddenIfOnlyEmptyCellsVisible = hiddenIfOnlyEmptyCellsVisible;
		return this;
	}

	/*package-private*/ void setTable(Table<RECORD> table) {
		this.table = table;
	}

	public String getPropertyName() {
		return propertyName;
	}

	public TextAlignment getHeaderAlignment() {
		return headerAlignment;
	}

	public TableColumn<RECORD, VALUE> setHeaderAlignment(TextAlignment headerAlignment) {
		this.headerAlignment = headerAlignment;
		return this;
	}

	public ValueExtractor<RECORD, VALUE> getValueExtractor() {
		return valueExtractor;
	}

	public TableColumn<RECORD, VALUE> setValueExtractor(ValueExtractor<RECORD, VALUE> valueExtractor) {
		this.valueExtractor = valueExtractor;
		if (table != null) {
			table.refreshData();
		}
		return this;
	}

	public ValueInjector<RECORD, VALUE> getValueInjector() {
		return valueInjector;
	}

	public TableColumn<RECORD, VALUE> setValueInjector(ValueInjector<RECORD, VALUE> valueInjector) {
		this.valueInjector = valueInjector;
		return this;
	}

	public AbstractField<?> getHeaderRowField() {
		return headerRowField;
	}

	public void setHeaderRowField(AbstractField<?> headerRowField) {
		this.headerRowField = headerRowField;
		table.updateHeaderRowField(this);
	}

	public AbstractField<?> getFooterRowField() {
		return footerRowField;
	}

	public void setFooterRowField(AbstractField<?> footerRowField) {
		this.footerRowField = footerRowField;
		table.updateFooterRowField(this);
	}

	public Table<RECORD> getTable() {
		return table;
	}

	public Template getDisplayTemplate() {
		return displayTemplate;
	}

	public TableColumn<RECORD, VALUE> setDisplayTemplate(Template displayTemplate) {
		this.displayTemplate = displayTemplate;
		return this;
	}

	public PropertyProvider<RECORD> getDisplayPropertyProvider() {
		return displayPropertyProvider;
	}

	public TableColumn<RECORD, VALUE> setDisplayPropertyProvider(PropertyProvider<RECORD> displayPropertyProvider) {
		this.displayPropertyProvider = displayPropertyProvider;
		return this;
	}

	public TableColumn<RECORD, VALUE> setDisplayPropertyExtractor(PropertyExtractor<RECORD> displayPropertyExtractor) {
		this.setDisplayPropertyProvider(displayPropertyExtractor);
		return this;
	}
}
