export const CTypeInputModel = {
  $id: 'http://kilt-protocol.org/draft-01/ctype-input#',
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'CTYPE',
  type: 'object',
  properties: {
    $id: {
      title: 'Identifier',
      type: 'string',
      format: 'uri-reference',
      minLength: 1,
    },
    $schema: {
      title: 'Schema',
      type: 'string',
      format: 'uri',
      enum: ['http://kilt-protocol.org/draft-01/ctype-input#'],
      default: 'http://kilt-protocol.org/draft-01/ctype-input#',
      readonly: true,
      className: 'hidden',
    },
    title: {
      title: 'Title',
      type: 'string',
      minLength: 1,
    },
    properties: {
      title: 'Data',
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: {
            title: 'Title',
            type: 'string',
            default: 'New Property',
            minLength: 1,
          },
          $id: {
            title: 'Identifier',
            type: 'string',
            format: 'uri-reference',
            minLength: 1,
          },
          type: {
            title: 'Type',
            type: 'string',
            enum: ['string', 'integer', 'number', 'boolean'],
            enumTitles: ['Text', 'Number', 'Decimal', 'Yes/No'],
          },
          format: {
            title: 'Format',
            type: 'string',
            enum: ['date', 'time', 'uri'],
          },
        },
        required: ['$id', 'title', 'type'],
      },
      collapsed: false,
    },
    type: {
      title: 'Object Type',
      type: 'string',
      default: 'object',
      readonly: true,
      className: 'hidden',
    },
  },
  required: ['$id', '$schema', 'title', 'properties', 'type'],
}
