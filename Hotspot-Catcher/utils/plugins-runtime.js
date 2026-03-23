const crypto = require('crypto');

function createTraceId() {
  return `trace_${crypto.randomBytes(6).toString('hex')}`;
}

function isValidResponseSchema(response) {
  if (!response || typeof response !== 'object') {
    return false;
  }
  if (typeof response.ok !== 'boolean') {
    return false;
  }
  if (!('data' in response) || !('error_code' in response) || !('error_message' in response)) {
    return false;
  }
  return true;
}

function createPluginsRuntime(providersConfig = {}, options = {}) {
  const traces = [];
  const externalHandlers = options.externalHandlers || {};

  async function callExternal(method, payload) {
    if (typeof externalHandlers[method] === 'function') {
      return externalHandlers[method](payload);
    }
    const error = new Error(`external provider unavailable for ${method}`);
    error.code = 'E_PROVIDER_UNAVAILABLE';
    throw error;
  }

  async function callBuiltin(method, payload) {
    if (method === 'hotspot.search') {
      return {
        ok: true,
        data: {
          hotspots: []
        },
        error_code: '',
        error_message: ''
      };
    }
    if (method === 'viral.analyze') {
      return { ok: true, data: { hook_sentence: '示例钩子' }, error_code: '', error_message: '' };
    }
    if (method === 'prompt.optimize') {
      return { ok: true, data: { best_candidate_id: 'p2' }, error_code: '', error_message: '' };
    }
    if (method === 'image.generate') {
      return { ok: true, data: { image_url: '' }, error_code: '', error_message: '' };
    }
    return { ok: false, data: {}, error_code: 'E_UNKNOWN', error_message: `unknown method: ${method}` };
  }

  return {
    async call(method, payload = {}) {
      const capability = method.split('.')[0];
      const provider = providersConfig?.[capability]?.provider || 'builtin';
      const trace_id = createTraceId();
      const trace = {
        trace_id,
        method,
        provider,
        fallback_used: false,
        created_at: new Date().toISOString()
      };
      try {
        let response;
        if (provider === 'external') {
          response = await callExternal(method, payload);
        } else {
          response = await callBuiltin(method, payload);
        }
        if (!isValidResponseSchema(response)) {
          const schemaError = new Error(`invalid response schema for ${method}`);
          schemaError.code = 'E_SCHEMA_INVALID';
          throw schemaError;
        }
        traces.push(trace);
        return { ...response, trace_id, trace };
      } catch (error) {
        const fallbackResponse = await callBuiltin(method, payload);
        trace.fallback_used = true;
        trace.error_code = error.code || 'E_UNKNOWN';
        trace.error_message = error.message || 'unknown error';
        traces.push(trace);
        return { ...fallbackResponse, trace_id, trace };
      }
    },
    getTraces() {
      return traces.slice();
    }
  };
}

module.exports = {
  createPluginsRuntime
};
