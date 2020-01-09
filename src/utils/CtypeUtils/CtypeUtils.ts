import * as sdk from '@kiltprotocol/sdk-js'

import { ICTypeInput, IClaimInput, CTypeWithMetadata } from '../../types/Ctype'
import { IMetadata } from '@kiltprotocol/sdk-js/build/types/CTypeMetedata'
import { ICTypeSchema } from '@kiltprotocol/sdk-js/build/types/CType'
/**
 * Create the CTYPE model from a CTYPE input model (used in CTYPE editing components).
 * This is necessary because component editors rely on editing arrays of properties instead of
 * arbitrary properties of an object. Additionally the default language translations are integrated
 * into the input model and need to be separated for the CTYPE model.
 * This is the reverse function of CType.getCTypeInputModel(...).
 * @returns The CTYPE for the input model.
 */

export const fromInputModel = (ctypeInput: ICTypeInput): CTypeWithMetadata => {
  if (!sdk.CTypeUtils.verifySchema(ctypeInput, sdk.CTypeInputModel)) {
    throw new Error('CType input does not correspond to input model schema')
  }
  const schema: ICTypeSchema = {
    $id: ctypeInput.$id,
    $schema: sdk.CTypeModel.properties.$schema.default,
    properties: {},
    type: 'object',
  }

  const sdkMetadata: IMetadata = {
    title: {
      default: ctypeInput.title,
    },
    description: {
      default: ctypeInput.description,
    },
    properties: {},
  }

  const properties = {}
  ctypeInput.properties.forEach((p: any) => {
    const { title, $id, description, ...rest } = p
    properties[$id] = rest
    sdkMetadata.properties[$id] = {
      title: {
        default: title,
      },
      description: {
        default: description,
      },
    }
  })
  schema.properties = properties

  const ctype: sdk.ICType = {
    schema,
    owner: ctypeInput.owner,
    hash: sdk.CTypeUtils.getHashForSchema(schema),
  }
  const sdkCTypeMetadata: sdk.ICTypeMetadata = {
    metadata: sdkMetadata,
    ctypeHash: ctype.hash,
  }

  const sdkCType = sdk.CType.fromCType(ctype)
  return { cType: sdkCType, metaData: sdkCTypeMetadata }
}

export const getLocalized = (o: any, lang?: string): string => {
  if (lang == null || !o[lang]) {
    return o.default
  }
  return o[lang]
}

/**
 * Create the CTYPE input model for a CTYPE editing component form the CTYPE model.
 * This is necessary because component editors rely on editing arrays of properties instead of
 * arbitrary properties of an object. Additionally the default language translations are integrated
 * into the input model. This is the reverse function of CType.fromInputModel(...).
 * @returns The CTYPE input model.
 */

export const getCTypeInputModel = (ctype: CTypeWithMetadata): ICTypeInput => {
  // create clone
  const result = JSON.parse(JSON.stringify(ctype.cType.schema))
  result.$schema = sdk.CTypeInputModel.$id
  result.title = getLocalized(ctype.metaData.metadata.title)
  result.description = getLocalized(ctype.metaData.metadata.description)
  result.required = []
  result.properties = []

  Object.entries(ctype.cType.schema.properties as object).forEach(
    ([key, value]) => {
      result.properties.push({
        title: getLocalized(ctype.metaData.metadata.properties[key].title),
        $id: key,
        type: value.type,
      })
      result.required.push(key)
    }
  )

  return result
}

/**
 * This method creates an input model for a claim from a CTYPE.
 * It selects translations for a specific language from the localized part of the CTYPE meta data.
 * @param {string} lang the language to choose translations for
 * @returns {any} The claim input model
 */
export const getClaimInputModel = (
  ctype: sdk.ICType,
  lang?: string
): IClaimInput => {
  // create clone
  const result = JSON.parse(JSON.stringify(ctype.schema))
  result.required = []

  return result
}
