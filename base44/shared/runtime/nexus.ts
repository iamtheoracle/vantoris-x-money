import { logger } from './logger.ts';

const SPECIALIST_GUIDANCE = {
  fraud: 'Fraud specialist: prioritize member safety, identify warning signs, advise immediate protective steps, and escalate suspected fraud. Never claim to freeze or reverse anything.',
  compliance: 'Compliance specialist: explain applicable controls, KYC/AML concepts, evidence requirements, and escalation paths. Do not make legal determinations or approve exceptions.',
  payments: 'Payments specialist: explain payment rails, timing, fees, wire details, and failure handling. Never initiate, approve, or claim a transfer.',
  credit: 'Credit specialist: explain lending terms, APR, repayment, affordability, and underwriting factors. Do not promise approval or invent rates.',
  investment: 'Investment specialist: explain risk, diversification, time horizon, and general investment concepts. Do not provide personalized investment instructions or invent performance.',
  documents: 'Documents specialist: help interpret, prepare, and organize statements, letters, forms, and receipts. Never fabricate official records.',
  banking: 'Banking specialist: explain accounts, cards, balances, and account servicing. Use verified account data only when an authorized data source supplies it.',
  general: 'General specialist: answer clearly, identify uncertainty, and ask only a useful follow-up when needed.',
};

const ROUTES = [
  { specialist: 'fraud', terms: /fraud|scam|unauthori[sz]ed|stolen|phishing|suspicious/i, action: false },
  { specialist: 'compliance', terms: /regulat|compliance|policy|sanction|aml|suspicious activity|kyc/i, action: true },
  { specialist: 'payments', terms: /wire|transfer|payment|send money|ach|deposit|withdraw/i, action: true },
  { specialist: 'credit', terms: /loan|credit|borrow|apr|interest rate/i, action: true },
  { specialist: 'investment', terms: /invest|portfolio|stock|bond|yield|dividend/i, action: false },
  { specialist: 'documents', terms: /statement|document|letter|form|receipt|tax form/i, action: false },
  { specialist: 'banking', terms: /account|balance|card|branch|routing number|checking|savings/i, action: false },
];

export function createNexus() {
  return {
    async orchestrate(request, services, registries) {
      const message = String(request.message || '');
      const route = ROUTES.find(item => item.terms.test(message)) || { specialist: 'general', action: false };
      const isActionImpacting = Boolean(route.action);
      const model = registries.model.select(request.priority || 'normal');
      const basePrompt = registries.prompt.getDefault();
      const prompt = { ...basePrompt, template: `${basePrompt.template}\\n\\n## Active specialist\\n${SPECIALIST_GUIDANCE[route.specialist] || SPECIALIST_GUIDANCE.general}` };
      let history = [];
      let memory = null;
      let thread = null;
      try {
        thread = await services.conversation.getOrCreateThread(request.userId, 'Vantage Assistant');
        history = await services.conversation.getRecentHistory(thread.id, 10);
        memory = thread.memory_summary || thread.preferences || null;
      } catch (error) {
        logger.warn('Conversation context unavailable', { requestId: request.id, error: error.message });
      }
      const capabilities = (request.capabilities || []).filter(name => ['reasoning', 'knowledge'].includes(name));
      logger.info('Nexus resolved request', { requestId: request.id, specialist: route.specialist, isActionImpacting });
      return {
        requiresReasoning: true,
        model,
        prompt,
        routing: {
          specialist: route.specialist,
          confidence: route.specialist === 'general' ? 'low' : 'medium',
          isActionImpacting,
          collaborators: [],
        },
        capabilities: capabilities.map(name => ({ name })),
        context: { threadId: thread?.id || null, history: Array.isArray(history) ? history.reverse() : [], memory, knowledge: [] },
        deferredJobs: [],
        escalate: route.specialist === 'fraud' || (isActionImpacting && route.specialist === 'compliance'),
      };
    },
  };
}
