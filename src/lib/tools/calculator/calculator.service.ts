import * as math from 'mathjs';

export class CalculatorService {
	calculate(expression: string): number {
		try {
			// mathjs evaluation is safe and doesn't use eval() or new Function()
			return math.evaluate(expression);
		} catch (error: any) {
			throw new Error(`Invalid mathematical expression: ${error.message}`);
		}
	}
}
