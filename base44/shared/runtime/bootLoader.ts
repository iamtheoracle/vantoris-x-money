import { createGuardian } from './guardian.ts';
import { createOracle } from './oracle.ts';
import { createSpark } from './spark.ts';
import { createOrbit } from './orbit.ts';
import { createNexus } from './nexus.ts';
import { ModelRegistry } from '../registries/ModelRegistry.ts';
import { PolicyRegistry } from '../registries/PolicyRegistry.ts';
import { PromptRegistry } from '../registries/PromptRegistry.ts';
import { logger } from './logger.ts';

function createServices(base44, request) {
  const authorization = request?.headers?.get?.('authorization') || '';
  const gatewayUrl = Deno.env.get('VANTAGE_AI_GATEWAY_URL') || '';
  const appUrl = Deno.env.get('VANTAGE_APP_URL') || '';
  let endpoint = '';
  try {
    const app = appUrl ? new URL(appUrl) : null;
    if (app?.protocol !== 'https:') throw new Error('VANTAGE_APP_URL must be a valid HTTPS origin');
    const candidate = gatewayUrl || new URL('/.netlify/functions/ask', app).toString();
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' && parsed.origin === app.origin) endpoint = parsed.toString();
    else throw new Error('AI gateway must use the configured Vantage application origin');
  } catch (error) {
    logger.error('AI gateway URL rejected', { reason: error.message });
  }

  return {
    model: {
      async invoke({ prompt, responseJsonSchema }) {
        if (!endpoint) throw new Error('AI gateway endpoint is not configured');
        if (!/^Bearer\s+\S+/i.test(authorization)) throw new Error('Authenticated member session is required');
        const instruction = responseJsonSchema
          ? `Return only valid JSON matching this schema: ${JSON.stringify(responseJsonSchema)}\n\n`
          : '';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { authorization, 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ prompt: instruction + prompt }),
          signal: AbortSignal.timeout(25000),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error || `AI gateway returned HTTP ${response.status}`);
        if (typeof result.text !== 'string' || !result.text.trim()) throw new Error('AI gateway returned an empty response');
        if (responseJsonSchema) {
          const raw = result.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          let parsed;
          try { parsed = JSON.parse(raw); }
          catch { throw new Error('AI gateway did not return valid structured JSON'); }
          if (!parsed || typeof parsed !== 'object' || typeof parsed.response !== 'string' || !parsed.response.trim()) {
            throw new Error('AI gateway structured response is missing its member-facing response');
          }
          return { ...parsed, response: parsed.response.trim() };
        }
        return result.text;
      },
    },
    conversation: {
      async getOrCreateThread(userId, title) {
        const rows = await base44.asServiceRole.entities.AIConversation.filter({ user_id: userId, status: 'active' }, '-updated_date', 1);
        if (rows?.length) return rows[0];
        return base44.asServiceRole.entities.AIConversation.create({ user_id: userId, title, status: 'active' });
      },
      async addMessage(threadId, userId, role, body) {
        return base44.asServiceRole.entities.AIMessage.create({ thread_id: threadId, user_id: userId, role, body: String(body).slice(0, 20000) });
      },
      async updateThread(threadId, updates) {
        return base44.asServiceRole.entities.AIConversation.update(threadId, {
          memory_summary: String(updates?.memory_summary || '').slice(-3000),
        });
      },
      async getRecentHistory(threadId, limit = 10) {
        const rows = await base44.asServiceRole.entities.AIMessage.filter({ thread_id: threadId }, '-created_date', Math.min(20, Math.max(1, limit)));
        return (rows || []).map(row => ({ sender: row.role, body: row.body }));
      },
    },
    metrics: {
      async increment(name, value = 1, dimensions = {}) {
        logger.info('metric.increment', { name, value, dimensions });
      },
    },
    audit: {
      async log(entry) {
        const record = {
          action_type: String(entry.actionType || 'assistant_event'),
          description: String(entry.description || 'Assistant event').slice(0, 500),
          details: String(entry.details || '').slice(0, 10000),
          target_user_id: String(entry.targetUserId || ''),
          actor_user_id: String(entry.actorUserId || ''),
          created_at: new Date().toISOString(),
        };
        await base44.asServiceRole.entities.AIAuditEvent.create(record);
        logger.info('audit.event', { actionType: record.action_type, targetUserId: record.target_user_id });
      },
    },
    health: {
      async runAll() {
        return {
          status: endpoint ? 'configured_unverified' : 'degraded',
          gateway: { status: endpoint ? 'configured_unverified' : 'not_configured' },
          conversationStore: { status: 'wired_unverified' },
          modelRegistry: { status: 'ok', models: ModelRegistry.list().length },
          promptRegistry: { status: 'ok', prompts: PromptRegistry.list().length },
          policyRegistry: { status: 'ok', policies: PolicyRegistry.list().length },
        };
      },
    },
  };
}

export async function boot(base44, request) {
  // Build request-scoped services so one member's bearer token is never cached
  // or reused by another invocation. Module instances may be cached by Deno,
  // but authentication context must remain per request.
  const services = createServices(base44, request);
  const registries = {
    model: ModelRegistry,
    prompt: PromptRegistry,
    policy: PolicyRegistry,
  };
  const guardian = createGuardian(registries);
  const nexus = createNexus();
  const spark = createSpark();
  const orbit = createOrbit(base44);
  const oracle = createOracle(services, registries, guardian, nexus, spark, orbit);
  const runtime = { oracle, guardian, nexus, spark, orbit };
  const stages = ['services', 'registries', 'guardian', 'nexus', 'spark', 'orbit', 'oracle'];
  logger.info('Vantage Oracle runtime initialized', { stages });
  return { services, runtime, stages };
}
