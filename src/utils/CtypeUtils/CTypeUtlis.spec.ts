import { CType, IClaim, ICType } from '@kiltprotocol/sdk-js'
import {
  fromInputModel,
  getClaimInputModel,
  getCTypeInputModel,
} from './CtypeUtils'
import { ICTypeInput } from '../../types/Ctype'

describe('CType', () => {
  const ctypeModel = {
    schema: {
      $id: 'http://example.com/ctype-1',
      $schema: 'http://kilt-protocol.org/draft-01/ctype#',
      title: 'Ctype',
      properties: {
        'first-property': { type: 'integer' },
        'second-property': { type: 'string' },
      },
      type: 'object',
    },
    owner: '',
    hash: '',
  } as ICType

  it('verify model transformations', () => {
    const ctypeInput: ICTypeInput = {
      $id: 'http://example.com/ctype-1',
      $schema: 'http://kilt-protocol.org/draft-01/ctype-input#',
      title: 'Ctype',
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
      description: '',
      owner: '',
      required: ['first-property', 'second-property'],
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
      description: '',
      required: ['first-property', 'second-property'],
    }
    const goodClaim: IClaim = {
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
        'second-property': 12,
        'third-property': true,
      },
      cTypeHash: '',
    }
    const ctypeFromInput = fromInputModel(ctypeInput)
    const ctypeFromModel = CType.fromCType(ctypeModel)
    expect(JSON.stringify(ctypeFromInput.cType)).toEqual(
      JSON.stringify(ctypeFromModel)
    )

    expect(JSON.stringify(getClaimInputModel(ctypeFromInput, 'en'))).toEqual(
      JSON.stringify(claimInput)
    )
    expect(JSON.stringify(getCTypeInputModel(ctypeFromInput))).toEqual(
      JSON.stringify(ctypeInput)
    )

    expect(
      CType.fromCType(ctypeFromInput.cType).verifyClaimStructure(goodClaim)
    ).toBeTruthy()
    expect(
      CType.fromCType(ctypeFromInput.cType).verifyClaimStructure(badClaim)
    ).toBeFalsy()

    expect(() => {
      // @ts-ignore
      CType.fromCType(goodClaim)
    }).toThrow(new Error('CType does not correspond to schema'))
    expect(() => {
      ctypeInput.$schema = 'object'
      fromInputModel(ctypeInput)
    }).toThrow(
      new Error('CType input does not correspond to input model schema')
    )
  })
})
