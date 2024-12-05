import katex from 'katex';

const DELIMITER_LIST = [
	{ left: '$$', right: '$$', display: true },
	{ left: '$', right: '$', display: false },
	{ left: '\\pu{', right: '}', display: false },
	{ left: '\\ce{', right: '}', display: false },
	{ left: '\\(', right: '\\)', display: false },
	{ left: '\\[', right: '\\]', display: true },
	{ left: '\\begin{equation}', right: '\\end{equation}', display: true }
];

let inlinePatterns = [];
let blockPatterns = [];

function escapeRegex(string) {
	return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function generateRegexRules(delimiters) {
	delimiters.forEach((delimiter) => {
		const { left, right, display } = delimiter;
		// Ensure regex-safe delimiters
		const escapedLeft = escapeRegex(left);
		const escapedRight = escapeRegex(right);

		if (!display) {
			// For inline delimiters, we match everything
			inlinePatterns.push(`${escapedLeft}((?:\\\\[^]|[^\\\\])+?)${escapedRight}`);
		} else {
			// Block delimiters doubles as inline delimiters when not followed by a newline
			inlinePatterns.push(`${escapedLeft}(?!\\n)((?:\\\\[^]|[^\\\\])+?)(?!\\n)${escapedRight}`);
			blockPatterns.push(`${escapedLeft}\\n((?:\\\\[^]|[^\\\\])+?)\\n${escapedRight}`);
		}
	});

	// Math formulas can end in special characters
	const inlineRule = new RegExp(
		`^(${inlinePatterns.join('|')})(?=[\\s?。，!-\/:-@[-\`{-~]|$)`,
		'u'
	);
	const blockRule = new RegExp(`^(${blockPatterns.join('|')})(?=[\\s?。，!-\/:-@[-\`{-~]|$)`, 'u');

	// Math formulas can end in special characters
	const inlineRuleinlineTolerantNoSpace = new RegExp(
		`^(${inlinePatterns.join('|')})`,
		'u'
	);

	return { inlineRule, blockRule, inlineRuleinlineTolerantNoSpace };
}

const { inlineRule, blockRule, inlineRuleinlineTolerantNoSpace } = generateRegexRules(DELIMITER_LIST);

export default function(options = {}) {
  return {
    extensions: [
      inlineKatex(options, createRenderer(options, false)),
      blockKatex(options, createRenderer(options, true)),
    ],
  };
}

function createRenderer(options, newlineAfter) {
  return (token) => katex.renderToString(token.text, { ...options, displayMode: token.displayMode }) + (newlineAfter ? '\n' : '');
}

function katexStart(src, displayMode, inlineTolerantNoSpace) {
	let ruleReg  = null;
	if (displayMode) {
		ruleReg = blockRule;
	} else {
		ruleReg = inlineTolerantNoSpace ? inlineRuleinlineTolerantNoSpace : inlineRule;
	}

	let indexSrc = src;

	while (indexSrc) {
		let index = -1;
		let startIndex = -1;
		let startDelimiter = '';
		let endDelimiter = '';
		for (let delimiter of DELIMITER_LIST) {
			if (delimiter.display !== displayMode) {
				continue;
			}

			startIndex = indexSrc.indexOf(delimiter.left);
			if (startIndex === -1) {
				continue;
			}

			index = startIndex;
			startDelimiter = delimiter.left;
			endDelimiter = delimiter.right;
		}

		if (index === -1) {
			return;
		}

		// Check if the delimiter is preceded by a special character.
		// If it does, then it's potentially a math formula.
		const f = !displayMode && inlineTolerantNoSpace ? index > - 1 : index === 0 || indexSrc.charAt(index - 1).match(/[\s?。，!-\/:-@[-`{-~]/);
		if (f) {
			const possibleKatex = indexSrc.substring(index);

			if (possibleKatex.match(ruleReg)) {
				return index;
			}
		}

		indexSrc = indexSrc.substring(index + startDelimiter.length).replace(endDelimiter, '');
	}
}

function katexTokenizer(src, tokens, displayMode, inlineTolerantNoSpace) {
	let type = null;
	let ruleReg  = null;
	if (displayMode) {
		type = 'blockKatex';
		ruleReg = blockRule;
	} else {
		type = 'inlineKatex';
		ruleReg = inlineTolerantNoSpace ? inlineRuleinlineTolerantNoSpace : inlineRule;
	}

	const match = src.match(ruleReg);

	if (match) {
		const text = match
			.slice(2)
			.filter((item) => item)
			.find((item) => item.trim());

		return {
			type,
			raw: match[0],
			text: text,
			displayMode
		};
	}
}

function inlineKatex(options, renderer) {
  return {
    name: 'inlineKatex',
    level: 'inline',
    start(src) {
      return katexStart(src, false, options.inlineTolerantNoSpace);
    },
    tokenizer(src, tokens) {
      return katexTokenizer(src, tokens, false, options.inlineTolerantNoSpace);
    },
    renderer,
  };
}

function blockKatex(options, renderer) {
  return {
    name: 'blockKatex',
    level: 'block',
    start(src) {
      return katexStart(src, true, options.inlineTolerantNoSpace);
    },
    tokenizer(src, tokens) {
      return katexTokenizer(src, tokens, true, options.inlineTolerantNoSpace);
    },
    renderer,
  };
}
