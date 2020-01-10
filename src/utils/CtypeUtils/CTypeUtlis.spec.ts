import {
  fromInputModel,
  getClaimInputModel,
  getCTypeInputModel,
} from './CtypeUtils'
import * as sdk from '@kiltprotocol/sdk-js'
import { ICType, ICTypeInput } from 'src/types/Ctype'

describe('CType', () => {
  const ctypeModel = {
    schema: {
      $id: 'http://example.com/ctype-1',
      $schema: 'http://kilt-protocol.org/draft-01/ctype#',
      properties: {
        'first-property': { type: 'integer' },
        'second-property': { type: 'string' },
      },
      type: 'object',
    },
  } as sdk.ICType

  it('verify model transformations', () => {
    const ctypeInput: ICTypeInput = {
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
      description: '',
      owner: null,
    }

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
    const goodClaim: sdk.IClaim = {
      owner: '',
      contents: {
        'first-property': 10,
        'second-property': '12',
      },
      cTypeHash: '',
    }
    const badClaim = {
      owner: '',
      contents: {
        'first-property': 10,
        'second-property': '12',
        'third-property': true,
      },
      cTypeHash: '',
    }
    const ctypeFromInput = fromInputModel(ctypeInput)
    const ctypeFromModel = sdk.CType.fromCType(ctypeModel)
    expect(JSON.stringify(ctypeFromInput)).toEqual(
      JSON.stringify(ctypeFromModel)
    )

    expect(
      JSON.stringify(getClaimInputModel(ctypeFromInput.cType, 'en'))
    ).toEqual(JSON.stringify(claimInput))
    expect(JSON.stringify(getCTypeInputModel(ctypeFromInput))).toEqual(
      JSON.stringify(ctypeInput)
    )

    expect(
      sdk.CType.fromCType(ctypeFromInput.cType).verifyClaimStructure(goodClaim)
    ).toBeTruthy()
    expect(
      sdk.CType.fromCType(ctypeFromInput.cType).verifyClaimStructure(badClaim)
    ).toBeFalsy()

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
})
