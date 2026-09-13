import { adapterDefinition, contentAdapterDefinition, containerAdapterDefinition, inputEvents, dateEvents, timeEvents, textValidation, rangedTextValidation, allowedValuesValidation } from "../adapter-factories";

export const adapterData = adapterDefinition("jb-listbox", "select", ["load", "init", "change", "input", "invalid", "filter-change"], allowedValuesValidation, "jb-select/listbox");

