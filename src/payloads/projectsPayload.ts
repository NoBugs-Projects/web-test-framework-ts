export type CommonAcceptableValues =
  | string
  | number
  | boolean
  | null
  | object
  | 'true'
  | 'false';

export type locatorAcceptableValues = CommonAcceptableValues;
export type nameAcceptableValues = CommonAcceptableValues;
export type idAcceptableValues = CommonAcceptableValues;
export type copyAllAssociatedSettingsAcceptableValues = boolean;

export const projectData = (
  locator: locatorAcceptableValues,
  name: nameAcceptableValues,
  id: idAcceptableValues,
  copyAllAssociatedSettings: copyAllAssociatedSettingsAcceptableValues
) => {
  return {
    parentProject: {
      locator: locator,
    },
    name: name,
    id: id,
    copyAllAssociatedSettings: copyAllAssociatedSettings,
  };
};
