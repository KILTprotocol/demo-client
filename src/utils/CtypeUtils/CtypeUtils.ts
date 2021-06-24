import { CType, CTypeUtils, CTypeSchemaWithoutId } from '@kiltprotocol/sdk-js'
import { ICTypeMetadata } from '@kiltprotocol/types'
import {
  ICTypeInput,
  IClaimInput,
  ICTypeWithMetadata,
  ICType,
  ICTypeInputProperty,
} from '../../types/Ctype'

import CTypeInputModel from './CtypeInputSchema'
/**
 * Create the CTYPE model from a CTYPE input model (used in CTYPE editing components).
 * This is necessary because component editors rely on editing arrays of properties instead of
 * arbitrary properties of an object. Additionally the default language translations are integrated
 * into the input model and need to be separated for the CTYPE model.
 * This is the reverse function of CType.getCTypeInputModel(...).
 * @returns The CTYPE for the input model.
 */

export const fromInputModel = (
  ctypeInput: ICTypeInput
): { cType: CType; metaData: ICTypeMetadata } => {
  if (!CTypeUtils.verifySchema(ctypeInput, CTypeInputModel)) {
    throw new Error('CType input does not correspond to input model schema')
  }
  const schema: CTypeSchemaWithoutId = {
    $schema: CTypeInputModel.properties.$schema.default,
    title: ctypeInput.title,
    properties: {},
    type: 'object',
  }
  const sdkMetadata: ICTypeMetadata['metadata'] = {
    title: {
      default: ctypeInput.title,
    },
    description: {
      default: ctypeInput.description,
    },
    properties: {},
  }

  const properties: Record<string, typeof schema['properties']['']> = {}
  ctypeInput.properties.forEach((p: ICTypeInputProperty) => {
    const { title, $id, ...rest } = p
    properties[$id] = rest
    sdkMetadata.properties[$id] = {
      title: {
        default: title,
      },
    }
  })

  schema.properties = properties

  const sdkCType = CType.fromSchema(schema, ctypeInput.owner)
  const sdkCTypeMetadata: ICTypeMetadata = {
    metadata: sdkMetadata,
    ctypeHash: sdkCType.hash,
  }

  return { cType: sdkCType, metaData: sdkCTypeMetadata }
}
/**
 * This method returns the default title of the given property of the supplied CType
 * @param propertyName the property for which to get the title for
 * @param cType CType containing the property
 * @returns {string} default title of the supplied property
 */
export const getCtypePropertyTitle = (
  propertyName: string,
  cType: ICType
): string => {
  const metadataDefaultTitle =
    cType.metadata.properties[propertyName].title.default
  return metadataDefaultTitle || propertyName
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

export const getCTypeInputModel = (ctype: ICTypeWithMetadata): ICTypeInput => {
  // create clone
  const result = JSON.parse(JSON.stringify(ctype.cType.schema))
  result.$schema = CTypeInputModel.$id
  result.title = getLocalized(ctype.metaData.metadata.title)
  result.description = getLocalized(ctype.metaData.metadata.description)
  result.owner = ctype.cType.owner
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
  ctype: ICTypeWithMetadata,
  lang?: string
): IClaimInput => {
  // create clone
  const result = JSON.parse(JSON.stringify(ctype.cType.schema))
  result.title = getLocalized(ctype.metaData.metadata.title, lang)
  result.description = getLocalized(ctype.metaData.metadata.description, lang)
  result.required = []
  Object.entries(ctype.metaData.metadata.properties).forEach(([key, value]) => {
    result.properties[key].title = getLocalized(value.title, lang)
    result.required.push(key)
  })
  return result
}
