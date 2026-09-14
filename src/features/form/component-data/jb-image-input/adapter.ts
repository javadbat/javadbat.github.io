import { adapterDefinition, contentAdapterDefinition, containerAdapterDefinition, inputEvents, dateEvents, timeEvents, textValidation, rangedTextValidation, allowedValuesValidation } from "../adapter-factories";

export const adapterData = adapterDefinition("jb-image-input", "image", ["load", "init", "change", "image-selected", "max-size-exceed", "download-start", "invalid"], []);
