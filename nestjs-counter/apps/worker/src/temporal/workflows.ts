import {
  continueAsNew,
  proxyActivities,
  setHandler,
  sleep,
} from '@temporalio/workflow';
import { IActivities } from './activities';
import { getExchangeRatesQuery } from '@app/shared';

const { getExchangeRates } = proxyActivities<IActivities>({
  startToCloseTimeout: '1 minute',
});

const maxIterations = 10000;

export async function exchangeRatesWorkflow(
  storedRates: any = null,
): Promise<any> {
  let rates: any = storedRates;

  // Register a query handler that allows querying for the current rates
  setHandler(getExchangeRatesQuery, () => rates);

  for (let i = 0; i < maxIterations; ++i) {
    // Get the latest rates
    rates = await getExchangeRates();

    // Sleep until tomorrow at 12pm server time, and then get the rates again
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setHours(12, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await sleep(tomorrow.valueOf() - today.valueOf());
  }

  await continueAsNew<typeof exchangeRatesWorkflow>(rates);
}
