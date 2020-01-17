import {
  fromInputModel,
  getClaimInputModel,
  getCTypeInputModel,
} from './CtypeUtils'
import * as sdk from '@kiltprotocol/sdk-js'
import { CTypeInputModel } from './CtypeInputSchema'

describe('CType', () => {
  const ctypeInput = {
    $id: 'http://example.com/ctype-1',
    $schema: 'http://kilt-protocol.org/draft-01/ctype-input#',
    properties: [
      {
        title: 'First Property',
        $id: 'first-property',
        type: 'integer',
      },
      {
        title: 'Second Property',
        $id: 'second-property',
        type: 'string',
      },
    ],
    type: 'object',
    title: 'CType Title',
    required: ['first-property', 'second-property'],
  }
  it('verify model transformations', () => {
    const claimInput = {
      $id: 'http://example.com/ctype-1',
      $schema: 'http://kilt-protocol.org/draft-01/ctype#',
      properties: {
        'first-property': { type: 'integer', title: 'First Property' },
        'second-property': { type: 'string', title: 'Second Property' },
      },
      type: 'object',
      title: 'CType Title',
      required: ['first-property', 'second-property'],
    }
    const goodClaim = {
      'first-property': 10,
      'second-property': '12',
    }

    const ctypeFromInput = fromInputModel(ctypeInput)

    expect(JSON.stringify(getClaimInputModel(ctypeFromInput, 'en'))).toEqual(
      JSON.stringify(claimInput)
    )
    expect(JSON.stringify(getCTypeInputModel(ctypeFromInput))).toEqual(
      JSON.stringify(ctypeInput)
    )

    expect(() => {
      // @ts-ignore
      new CType(goodClaim).verifyClaimStructure(goodClaim)
    }).toThrow(new Error('CType does not correspond to schema'))
    expect(() => {
      ctypeInput.$schema = 'object'
      fromInputModel(ctypeInput)
    }).toThrow(
      new Error('CType input does not correspond to input model schema')
    )
  })

  it('verifies CType Input Model', () => {
    const ctypeWrapperModel: sdk.ICType['schema'] = {
      $id: 'http://example.com/ctype-1',
      $schema: 'http://kilt-protocol.org/draft-01/ctype#',
      properties: {
        'first-property': { type: 'integer' },
        'second-property': { type: 'string' },
      },
      type: 'object',
    }
    expect(
      sdk.CTypeUtils.verifySchema(ctypeInput, CTypeInputModel)
    ).toBeTruthy()
    expect(
      sdk.CTypeUtils.verifySchema(ctypeWrapperModel, CTypeInputModel)
    ).toBeFalsy()
    expect(
      sdk.CTypeUtils.verifySchema(ctypeWrapperModel, CTypeInputModel)
    ).toBeFalsy()
    expect(
      sdk.CTypeUtils.verifySchema(
        {
          $id: 'http://example.com/ctype-1',
          $schema: 'http://kilt-protocol.org/draft-01/ctype-input#',
          properties: [],
          type: 'object',
          title: '',
        },
        CTypeInputModel
      )
    ).toBeFalsy()
  })
})
