const isNode = typeof window === 'undefined';
const storage = isNode
	? { setItem: () => {}, getItem: () => null, removeItem: () => {} }
	: window.localStorage;

const DEFAULT_BASE44_APP_ID = '6a3d85c1632966fefe16f3d4';
const DEFAULT_BASE44_SERVER_URL = 'https://vantoris.base44.app';

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	// Only honor an explicit URL clear. A stored flag was wiping member sessions
	// on every reload, which sent them back to sign-in. Admin hosted login
	// survived because it put a fresh token in the URL.
	if (!isNode && new URLSearchParams(window.location.search).get('clear_access_token') === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
		storage.removeItem('base44_token');
		storage.removeItem('base44_clear_access_token');
	}
	return {
		// These are public application configuration values, not secrets.
		// Defaults keep the Netlify frontend functional even when Netlify
		// environment variables are missing.
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID || DEFAULT_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: typeof window !== "undefined" ? window.location.href : "" }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '') }),
		serverUrl: getAppParamValue("server_url", { defaultValue: import.meta.env.VITE_BASE44_SERVER_URL || DEFAULT_BASE44_SERVER_URL }),
	}
}

export const appParams = {
	...getAppParams()
}