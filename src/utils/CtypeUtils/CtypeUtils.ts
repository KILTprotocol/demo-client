import * as sdk from '@kiltprotocol/sdk-js'

import { ICTypeInput, IClaimInput, CType, ICType } from '../../types/Ctype'
import { IMetadata } from '@kiltprotocol/sdk-js/build/types/CTypeMetedata'
/**
 * Create the CTYPE model from a CTYPE input model (used in CTYPE editing components).
 * This is necessary because component editors rely on editing arrays of properties instead of
 * arbitrary properties of an object. Additionally the default language translations are integrated
 * into the input model and need to be separated for the CTYPE model.
 * This is the reverse function of CType.getCTypeInputModel(...).
 * @returns The CTYPE for the input model.
 */

export const fromInputModel = (ctypeInput: ICTypeInput): any => {
  if (!sdk.CTypeUtils.verifySchema(ctypeInput, sdk.CTypeInputModel)) {
    throw new Error('CType input does not correspond to input model schema')
  }
  const ctype = {
    schema: {
      $id: ctypeInput.$id,
      $schema: sdk.CTypeModel.properties.$schema.default,
      properties: {},
      type: 'object',
    },
    owner: ctypeInput.owner,
  }

  const sdkMetadata = {
    title: {
      type: ctypeInput.title,
    },
    description: {
      type: ctypeInput.description,
    },
    properties: {},
    type: 'object',
  } as IMetadata

  const properties = {}
  ctypeInput.properties.forEach((p: any) => {
    const { title, $id, description, ...rest } = p
    properties[$id] = rest
    sdkMetadata.properties[$id] = {
      title: {
        type: title,
      },
      description: {
        type: description,
      },
    }
  })
  ctype.schema.properties = properties

  const sdkCType = new sdk.CType(ctype as sdk.CType)
  const combined = { sdkCType, sdkMetadata }
  return combined
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

export const getCTypeInputModel = (ctype: CType): ICTypeInput => {
  // create clone
  const result = JSON.parse(JSON.stringify(ctype.cType.schema))
  result.$schema = sdk.CTypeInputModel.$id
  result.title = getLocalized(ctype.metadata.title)
  result.description = getLocalized(ctype.metadata.description)
  result.required = []
  result.properties = []

  Object.entries(ctype.cType.schema.properties as object).forEach(
    ([key, value]) => {
      result.properties.push({
        title: getLocalized(ctype.metadata.properties[key].title),
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
  ctype: sdk.CType,
  lang?: string
): IClaimInput => {
  // create clone
  const result = JSON.parse(JSON.stringify(ctype.schema))
  result.required = []

  return result
}
