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
package org.teamapps.ux.component.field.datetime;

import org.teamapps.dto.UiField;
import org.teamapps.dto.UiLocalDateTimeField;

import java.time.LocalDateTime;
import java.util.List;

public class LocalDateTimeField extends AbstractDateTimeField<LocalDateTime> {

	public LocalDateTimeField() {
		super();
	}

	@Override
	public UiField createUiComponent() {
		UiLocalDateTimeField uiField = new UiLocalDateTimeField();
		mapAbstractDateTimeFieldUiValues(uiField);
		return uiField;
	}

	@Override
	public LocalDateTime convertUiValueToUxValue(Object value) {
		if (value == null) {
			return null;
		} else {
			List<Integer> values = (List<Integer>) value;
			return LocalDateTime.of(values.get(0), values.get(1), values.get(2), values.get(3), values.get(4), values.get(5), values.get(6));
		}
	}

}
