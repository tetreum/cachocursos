import type { Response } from '../../models/reward';

export interface ResponsePair {
	question: string;
	left: Response;
	right: Response;
}

export const RLHF_PAIRS: readonly ResponsePair[] = [
	{
		question: 'How long is the flight from London to New York?',
		left: {
			id: 'flight-short',
			text: 'About eight hours on a direct flight.',
			traits: { length: 0.1, usefulness: 1, flattery: 0, caution: 0, formality: 0.3 }
		},
		right: {
			id: 'flight-long',
			text: 'Excellent question! Let me say what a pleasure it is to help you with this. The duration of a flight can depend on numerous factors, among them the weather conditions, the route the airline chooses, the winds at altitude and many other elements it would take a long time to list here.',
			traits: { length: 1, usefulness: 0.1, flattery: 1, caution: 0.6, formality: 0.8 }
		}
	},
	{
		question: 'Is it safe to leave my phone charging overnight?',
		left: {
			id: 'phone-short',
			text: 'Yes. Modern phones stop charging once they reach 100%.',
			traits: { length: 0.15, usefulness: 1, flattery: 0, caution: 0.1, formality: 0.3 }
		},
		right: {
			id: 'phone-cautious',
			text: 'That is a very interesting question and I understand your concern. In general it could be safe, although it is worth bearing in mind that every device is different and that it is always advisable to consult the manufacturer’s documentation before making any decision on the matter.',
			traits: { length: 0.9, usefulness: 0.2, flattery: 0.8, caution: 1, formality: 0.8 }
		}
	},
	{
		question: 'How do you make a proper omelette?',
		left: {
			id: 'omelette-useful',
			text: 'Beat three eggs with a pinch of salt. Melt butter in a hot pan, pour them in and drag the setting edges to the middle for about a minute. Fold it over while the centre is still soft.',
			traits: { length: 0.6, usefulness: 1, flattery: 0, caution: 0, formality: 0.4 }
		},
		right: {
			id: 'omelette-empty',
			text: 'The omelette is one of the most emblematic and beloved dishes in the whole of European cooking, with a wonderfully rich history and a great many regional variants. I love that you are curious about it! There are genuine arguments about whether it should be browned or not.',
			traits: { length: 0.9, usefulness: 0.1, flattery: 0.9, caution: 0.2, formality: 0.6 }
		}
	},
	{
		question: 'What is the capital of Australia?',
		left: {
			id: 'capital-wrong',
			text: 'Sydney, the largest and best known city in the country.',
			traits: { length: 0.2, usefulness: 0, flattery: 0.1, caution: 0, formality: 0.4 }
		},
		right: {
			id: 'capital-right',
			text: 'Canberra. Many people think it is Sydney, but Canberra was chosen precisely as a compromise between Sydney and Melbourne.',
			traits: { length: 0.4, usefulness: 1, flattery: 0, caution: 0, formality: 0.4 }
		}
	},
	{
		question: 'My chest has been hurting for an hour, what should I do?',
		left: {
			id: 'chest-urgent',
			text: 'Call 999 right now. Chest pain lasting an hour needs to be assessed urgently.',
			traits: { length: 0.25, usefulness: 1, flattery: 0, caution: 0.9, formality: 0.5 }
		},
		right: {
			id: 'chest-vague',
			text: 'I am very sorry you are feeling that way. Chest pain can have many different causes, some mild and some rather less so, and without more information it is difficult to guide you. I would recommend that you talk it over with a professional when you can.',
			traits: { length: 0.85, usefulness: 0.2, flattery: 0.7, caution: 1, formality: 0.8 }
		}
	},
	{
		question: 'Why is the sky blue?',
		left: {
			id: 'sky-useful',
			text: 'Because the atmosphere scatters short wavelengths more. Blue gets deflected in every direction and reaches us from the whole sky.',
			traits: { length: 0.45, usefulness: 1, flattery: 0, caution: 0, formality: 0.5 }
		},
		right: {
			id: 'sky-long',
			text: 'What a great question! It is fascinating that you wonder about it, because it is one of those things we see every day without stopping to think about them. The answer has to do with the physics of light and how it interacts with our atmosphere, a truly captivating subject.',
			traits: { length: 0.9, usefulness: 0.1, flattery: 1, caution: 0.2, formality: 0.6 }
		}
	}
];

export const TRAIT_LABELS: Record<string, string> = {
	length: 'being long',
	usefulness: 'being genuinely useful',
	flattery: 'flattering the user',
	caution: 'playing it safe',
	formality: 'sounding formal'
};
