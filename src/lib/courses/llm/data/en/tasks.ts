import type { OnePassTask } from '../../models/onepass';

export const ONE_PASS_TASKS: readonly OnePassTask[] = [
	{
		id: 'capital',
		prompt: 'What is the capital of France?',
		answer: 'Paris',
		needsSubTokenAccess: false,
		serialSteps: 1,
		note: 'A memorised fact. It sits in the weights and comes out in one go.'
	},
	{
		id: 'letters',
		prompt: 'How many r’s are there in “strawberry”?',
		answer: '3',
		needsSubTokenAccess: true,
		serialSteps: 1,
		note: 'Counting is parallel: once the letters are visible, there are no chained steps.'
	},
	{
		id: 'reverse',
		prompt: 'Write “lighthouse” backwards.',
		answer: 'esuohthgil',
		needsSubTokenAccess: true,
		serialSteps: 1,
		note: 'Same case: the problem is access to the letters, not the length of the calculation.'
	},
	{
		id: 'short-sum',
		prompt: '347 + 285',
		answer: '632',
		needsSubTokenAccess: true,
		serialSteps: 3,
		note: 'Three columns, and each carry depends on the one before. It no longer fits in one pass.'
	},
	{
		id: 'long-sum',
		prompt: '48,395,716 + 27,868,459',
		answer: '76,264,175',
		needsSubTokenAccess: true,
		serialSteps: 8,
		note: 'Eight chained carries. This is where the chain of thought starts to break.'
	},
	{
		id: 'product',
		prompt: '463 × 287',
		answer: '132,881',
		needsSubTokenAccess: true,
		serialSteps: 9,
		note: 'Nine partial products plus the sums. No chain of text survives this reliably.'
	}
];

export const STRATEGY_LABELS: Record<string, { name: string; blurb: string }> = {
	direct: {
		name: 'Answer directly',
		blurb: 'A single pass through the layers. Free and lightning fast.'
	},
	retokenize: {
		name: 'Split into letters or digits',
		blurb: 'Spell it out, or separate the number digit by digit, and then answer.'
	},
	chain: {
		name: 'Write out the steps',
		blurb: 'Chain of thought: using its own output as working memory.'
	},
	tool: {
		name: 'Call a tool',
		blurb: 'Write code or use a calculator and actually run it.'
	}
};
