/*-
 * ========================LICENSE_START=================================
 * TeamApps
 * ---
 * Copyright (C) 2014 - 2020 TeamApps.org
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
package org.teamapps.ux.application.model;

import org.teamapps.ux.component.calendar.AbstractCalendarEvent;
import org.teamapps.ux.component.calendar.CalendarEvent;
import org.teamapps.ux.component.calendar.CalendarModel;
import org.teamapps.ux.component.infiniteitemview.InfiniteItemViewModel;
import org.teamapps.ux.component.table.TableModel;
import org.teamapps.ux.component.timegraph.TimeGraphModel;
import org.teamapps.ux.component.tree.TreeNodeInfoExtractor;
import org.teamapps.ux.model.TreeModel;

import java.util.function.Function;

public interface PerspectiveDataModel<ENTITY> {

	TableModel<ENTITY> getTableModel();

	InfiniteItemViewModel<ENTITY> getInfiniteItemViewModel();

	TimeGraphModel getTimeGraphModel();

	TreeModel<ENTITY> getTreeModel();

	TreeNodeInfoExtractor<ENTITY> getTreeNodeParentExtractor(String parentPropertyName);

	CalendarModel<CalendarEvent> getCalendarModel(Function<ENTITY, AbstractCalendarEvent> eventProvider, String calendarFieldName);


}
