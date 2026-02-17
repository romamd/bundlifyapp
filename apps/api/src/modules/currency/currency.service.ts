import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@bundlify/prisma-client';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncRates(): Promise<number> {
    try {
      // Fetch from ECB (European Central Bank) — free, no API key needed
      const response = await fetch(
        'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
      );

      if (!response.ok) {
        this.logger.warn(`ECB rate fetch failed: ${response.status}`);
        return 0;
      }

      const xml = await response.text();
      const rates = this.parseEcbXml(xml);

      let count = 0;

      // ECB rates are EUR-based. Store EUR→X and also derive USD→X
      for (const [currency, rate] of Object.entries(rates)) {
        // EUR → currency
        await this.prisma.exchangeRate.upsert({
          where: {
            baseCurrency_targetCurrency: {
              baseCurrency: 'EUR',
              targetCurrency: currency,
            },
          },
          update: { rate, source: 'ecb', fetchedAt: new Date() },
          create: {
            baseCurrency: 'EUR',
            targetCurrency: currency,
            rate,
            source: 'ecb',
          },
        });
        count++;

        // currency → EUR (inverse)
        await this.prisma.exchangeRate.upsert({
          where: {
            baseCurrency_targetCurrency: {
              baseCurrency: currency,
              targetCurrency: 'EUR',
            },
          },
          update: { rate: 1 / rate, source: 'ecb', fetchedAt: new Date() },
          create: {
            baseCurrency: currency,
            targetCurrency: 'EUR',
            rate: 1 / rate,
            source: 'ecb',
          },
        });
        count++;
      }

      // Derive USD-based cross rates
      const usdToEur = rates['USD'] ? 1 / rates['USD'] : null;
      if (usdToEur) {
        for (const [currency, eurRate] of Object.entries(rates)) {
          if (currency === 'USD') continue;
          const usdRate = eurRate / rates['USD'];

          await this.prisma.exchangeRate.upsert({
            where: {
              baseCurrency_targetCurrency: {
                baseCurrency: 'USD',
                targetCurrency: currency,
              },
            },
            update: { rate: usdRate, source: 'ecb', fetchedAt: new Date() },
            create: {
              baseCurrency: 'USD',
              targetCurrency: currency,
              rate: usdRate,
              source: 'ecb',
            },
          });
          count++;

          // Inverse: currency → USD
          await this.prisma.exchangeRate.upsert({
            where: {
              baseCurrency_targetCurrency: {
                baseCurrency: currency,
                targetCurrency: 'USD',
              },
            },
            update: {
              rate: 1 / usdRate,
              source: 'ecb',
              fetchedAt: new Date(),
            },
            create: {
              baseCurrency: currency,
              targetCurrency: 'USD',
              rate: 1 / usdRate,
              source: 'ecb',
            },
          });
          count++;
        }
      }

      this.logger.log(`Synced ${count} exchange rates from ECB`);
      return count;
    } catch (error) {
      this.logger.error(
        `Exchange rate sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;

    const rate = await this.getRate(from, to);
    return amount * rate;
  }

  async getRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const record = await this.prisma.exchangeRate.findUnique({
      where: {
        baseCurrency_targetCurrency: {
          baseCurrency: from,
          targetCurrency: to,
        },
      },
    });

    if (!record) {
      this.logger.warn(`Exchange rate not found: ${from} → ${to}, using 1.0`);
      return 1;
    }

    return Number(record.rate);
  }

  private parseEcbXml(xml: string): Record<string, number> {
    const rates: Record<string, number> = {};
    const regex = /currency='([A-Z]{3})'\s+rate='([\d.]+)'/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      rates[match[1]] = parseFloat(match[2]);
    }

    return rates;
  }
}
