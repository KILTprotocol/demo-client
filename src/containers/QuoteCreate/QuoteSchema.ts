export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'KILT:quote:v2',
  type: 'object',
  title: 'Quote',
  properties: {
    attesterAddress: {
      type: 'string',
    },
    cTypeHash: {
      type: 'string',
    },
    cost: {
      type: 'object',
      required: ['net', 'gross', 'tax'],
      properties: {
        net: {
          type: 'number',
        },
        gross: {
          type: 'number',
        },
        tax: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: {
                title: 'Tax code',
                type: 'string',
                default: 'New Property',
              },
              value: {
                type: 'number',
              },
            },
            required: ['title', 'value'],
          },
          collapsed: false,
        },
      },
    },
    currency: {
      type: 'string',
    },
    termsAndConditions: {
      type: 'string',
    },
    timeframe: {
      type: 'string',
      format: 'date-time',
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
