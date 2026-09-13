import { adapterDefinition, contentAdapterDefinition, containerAdapterDefinition, inputEvents, dateEvents, timeEvents, textValidation, rangedTextValidation, allowedValuesValidation } from "../adapter-factories";

export const adapterData = adapterDefinition("jb-switch", "boolean", ["load", "init", "change", "before-change"], allowedValuesValidation);

