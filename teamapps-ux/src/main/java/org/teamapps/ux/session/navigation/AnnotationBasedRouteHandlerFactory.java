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
package org.teamapps.ux.session.navigation;

import jakarta.ws.rs.ext.ParamConverter;
import jakarta.ws.rs.ext.ParamConverterProvider;
import org.apache.commons.lang3.StringUtils;
import org.teamapps.util.ReflectionUtil;
import org.teamapps.ux.session.navigation.annotation.PathParameter;
import org.teamapps.ux.session.navigation.annotation.QueryParameter;
import org.teamapps.ux.session.navigation.annotation.RoutingPath;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.lang.reflect.Type;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class AnnotationBasedRouteHandlerFactory {

	private final ParamConverterProvider converterProvider;

	public AnnotationBasedRouteHandlerFactory() {
		this(new ParameterConverterProvider());
	}

	public AnnotationBasedRouteHandlerFactory(ParamConverterProvider converterProvider) {
		this.converterProvider = converterProvider;
	}

	public List<AnnotationBasedRouteHandler> createRouteHandlers(Object annotatedClassInstance) {
		RoutingPath classLevelPathAnnotation = annotatedClassInstance.getClass().getAnnotation(RoutingPath.class);
		String pathPrefix = classLevelPathAnnotation != null ? classLevelPathAnnotation.value() : "";
		List<Method> routingMethods = ReflectionUtil.findMethods(annotatedClassInstance.getClass(), method -> method.isAnnotationPresent(RoutingPath.class));
		return routingMethods.stream()
				.peek(m -> {
					if (!m.trySetAccessible()) {
						throw new RuntimeException("Cannot make method " + m + " accessible!");
					}
				})
				.map(m -> createRoutingMethodInfo(m, pathPrefix))
				.map(routingMethodInfo -> new AnnotationBasedRouteHandler(routingMethodInfo, annotatedClassInstance))
				.collect(Collectors.toList());
	}

	private RoutingMethodInfo createRoutingMethodInfo(Method m, String pathPrefix) {
		RoutingPath pathAnnotation = m.getAnnotation(RoutingPath.class);
		String pathTemplate = RoutingUtil.concatenatePaths(pathPrefix, pathAnnotation.value());

		Class<?>[] parameterTypes = m.getParameterTypes();
		Type[] genericParameterTypes = m.getGenericParameterTypes();
		Parameter[] methodParameters = m.getParameters();
		ParameterValueExtractor[] methodParameterExtractors = new ParameterValueExtractor[methodParameters.length];
		for (int i = 0; i < methodParameters.length; i++) {
			Parameter parameter = methodParameters[i];
			PathParameter pathParam = parameter.getAnnotation(PathParameter.class);
			QueryParameter queryParam = parameter.getAnnotation(QueryParameter.class);
			ParamConverter<?> converter = converterProvider.getConverter(parameterTypes[i], genericParameterTypes[i], parameter.getAnnotations());

			if (pathParam != null) {
				methodParameterExtractors[i] = (path, pathParams, queryParams) -> converter.fromString(pathParams.get(pathParam.value()));
			} else if (queryParam != null) {
				methodParameterExtractors[i] = (path, pathParams, queryParams) -> {
					String paramValue = queryParams.get(queryParam.value());
					return StringUtils.isNotBlank(paramValue) ? converter.fromString(paramValue) : null;
				};
			} else {
				methodParameterExtractors[i] = (path, pathParams, queryParams) -> null;
			}
		}
		return new RoutingMethodInfo(pathTemplate, pathAnnotation.exact(), m, methodParameterExtractors);
	}

	interface ParameterValueExtractor {
		Object extract(String path, Map<String, String> pathParams, Map<String, String> queryParams);
	}

	private static class RoutingMethodInfo {
		private final String pathTemplate;
		private final boolean exact;
		private final Method method;
		private final ParameterValueExtractor[] methodParameterExtractors;

		public RoutingMethodInfo(String pathTemplate, boolean exact, Method method, ParameterValueExtractor[] methodParameterExtractors) {
			this.pathTemplate = pathTemplate;
			this.exact = exact;
			this.method = method;
			this.methodParameterExtractors = methodParameterExtractors;
		}

		public String getPathTemplate() {
			return pathTemplate;
		}

		public boolean isExact() {
			return exact;
		}

		public Method getMethod() {
			return method;
		}

		public ParameterValueExtractor[] getMethodParameterExtractors() {
			return methodParameterExtractors;
		}
	}

	public static class AnnotationBasedRouteHandler implements RouteHandler {
		private final RoutingMethodInfo routingMethodInfo;
		private final Object annotatedClassInstance;

		public AnnotationBasedRouteHandler(RoutingMethodInfo routingMethodInfo, Object annotatedClassInstance) {
			this.routingMethodInfo = routingMethodInfo;
			this.annotatedClassInstance = annotatedClassInstance;
		}

		@Override
		public void handle(String path, Map<String, String> pathParams, Map<String, String> queryParams) {
			Object[] argumentValues = Arrays.stream(routingMethodInfo.getMethodParameterExtractors())
					.map(extractor -> extractor.extract(path, pathParams, queryParams))
					.toArray();
			try {
				routingMethodInfo.getMethod().invoke(annotatedClassInstance, argumentValues);
			} catch (Exception e) {
				throw new RuntimeException(e); // TODO more specific exception class here
			}
		}

		public String getPathTemplate() {
			return routingMethodInfo.getPathTemplate();
		}

		public boolean isExact() {
			return routingMethodInfo.isExact();
		}
	}
}
