export const QuoteInputSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'KILT:quote:v1',
  type: 'object',
  title: 'Quote',
  properties: {
    attesterAddress: {
      type: 'string',
      minLength: 1,
    },
    cTypeHash: {
      type: 'string',
      minLength: 1,
    },
    cost: {
      type: 'object',
      required: ['net', 'gross', 'tax'],
      properties: {
        net: {
          type: 'number',
          minLength: 1,
        },
        gross: {
          type: 'number',
          minLength: 1,
        },
        tax: {
          type: 'object',
        },
      },
    },
    currency: {
      type: 'string',
      minLength: 1,
    },
    termsAndConditions: {
      type: 'string',
      minLength: 1,
    },
    timeframe: {
      type: 'string',
      format: 'date-time',
      minLength: 1,
    },
  },
  required: [
    'attesterAddress',
    'cTypeHash',
    'cost',
    'currency',
    'termsAndConditions',
    'timeframe',
  ],
}
