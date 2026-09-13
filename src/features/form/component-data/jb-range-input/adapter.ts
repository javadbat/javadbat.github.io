import { adapterDefinition, contentAdapterDefinition, containerAdapterDefinition, inputEvents, dateEvents, timeEvents, textValidation, rangedTextValidation, allowedValuesValidation } from "../adapter-factories";

export const adapterData = adapterDefinition("jb-range-input", "range", ["input", "change", "invalid"], []);

