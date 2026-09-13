import { adapterDefinition, contentAdapterDefinition, containerAdapterDefinition, inputEvents, dateEvents, timeEvents, textValidation, rangedTextValidation, allowedValuesValidation } from "../adapter-factories";

export const adapterData = adapterDefinition("jb-select", "select", ["load", "init", "change", "input", "keyup", "filter-change"], allowedValuesValidation);

