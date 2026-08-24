// @vitest-environment happy-dom

import { describe, expect, it } from "vitest";
import type { ValidationItem } from "jb-validation";
import { localizedText } from "../domain/form-document";
import { compileValidationRule, createValidationRule } from "./validation-rule-registry";
import { formElementRegistry, createDefaultElement } from "./form-element-registry";
import type { RuntimeFormElement } from "./form-element-adapter";

describe("JB element registry adapters", () => {
  it("declares complete adapter metadata for every inventory component", () => {
    expect(formElementRegistry).toHaveLength(24);

    for (const entry of formElementRegistry) {
      expect(entry.packageName).toBe(entry.type === "jb-listbox" ? "jb-select/listbox" : entry.type);
      expect(entry.tagName).toBe(entry.type === "text" ? "p" : entry.type === "image" ? "img" : entry.type === "voice" ? "audio" : entry.type === "link" ? "a" : entry.type);
      expect(entry.adapterVersion).toBe(1);
      expect(entry.supportedSchemaVersions).toEqual([1]);
      expect(entry.valueType.length).toBeGreaterThan(0);
      expect(entry.iconId.length).toBeGreaterThan(0);
      expect(entry.eventNames.length).toBeGreaterThanOrEqual(entry.isContent ? 0 : 1);
      expect(entry.loadComponent).toBeTypeOf("function");
      expect(entry.applyToRuntime).toBeTypeOf("function");
      expect(entry.validate).toBeTypeOf("function");
    }
  });

  it("creates defaults using only supported common fields", () => {
    for (const entry of formElementRegistry) {
      const element = createDefaultElement(entry, entry.defaultName);
      expect(entry.validate(element, entry)).toEqual([]);

      for (const field of ["required", "disabled", "label", "placeholder"] as const) {
        expect(Object.hasOwn(element, field)).toBe(entry.commonFields[field]);
      }
      expect(Object.hasOwn(element, "initialValue")).toBe(false);
    }
  });

  it("round-trips portable data without retaining mutable references", () => {
    for (const entry of formElementRegistry) {
      const source = createDefaultElement(entry, `${entry.defaultName}_field`);
      if (entry.validationRules.length > 0) {
        source.validation.push(createValidationRule(entry.validationRules[0], "en"));
      }

      const serialized = entry.serialize(source);
      const restored = entry.deserialize(serialized);

      expect(restored).toEqual(source);
      expect(restored).not.toBe(source);
      expect(restored.props).not.toBe(source.props);
      expect(restored.validation).not.toBe(source.validation);
    }
  });

  it("reports non-portable properties and incompatible validation", () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-button")!;
    const element = createDefaultElement(entry, "submit");
    element.props.callback = "not-approved";
    element.validation.push(createValidationRule("pattern"));

    const issues = entry.validate(element, entry);

    expect(issues.map(issue => issue.code)).toContain("unknown-property");
    expect(issues.map(issue => issue.code)).toContain("unsupported_validation_rule");
  });

  it("applies localized data, declarative options, and compiled rules at runtime", () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-select")!;
    const element = createDefaultElement(entry, "contactMethod");
    element.label = {
      translations: { en: "Contact method", fa: "روش تماس" },
    };
    element.props.options = [
      {
        id: "phone",
        value: "phone",
        label: { translations: { en: "Phone", fa: "تلفن" } },
        disabled: false,
      },
    ];
    element.validation = [
      {
        id: "allowed-contact",
        rule: "allowedValues",
        params: { values: ["phone"] },
        message: localizedText("Choose a contact method."),
      },
    ];

    const target = document.createElement("div") as unknown as RuntimeFormElement;
    const validation = { list: [] as ValidationItem<unknown>[] };
    Object.defineProperty(target, "validation", { value: validation });
    entry.applyToRuntime(target, element, "fa");

    expect(target.getAttribute("name")).toBe("contactMethod");
    expect(target.getAttribute("label")).toBe("روش تماس");
    expect(target.querySelector("jb-option")?.textContent).toBe("تلفن");
    expect(validation.list).toHaveLength(1);
    expect(validation.list[0].key).toBe("allowed-contact");
  });

  it("renders listbox options through the jb-select/listbox adapter", () => {
    const entry = formElementRegistry.find(candidate => candidate.type === "jb-listbox")!;
    const element = createDefaultElement(entry, "visibleChoices");
    element.initialValue = "option_1";
    const target = document.createElement("div") as unknown as RuntimeFormElement;

    entry.applyToRuntime(target, element, "en");

    expect(entry.packageName).toBe("jb-select/listbox");
    expect(element.props.useCheckbox).toBe(true);
    expect(target.initialValue).toBe("option_1");
    expect(target.querySelectorAll("jb-option")).toHaveLength(1);
    expect(target.querySelector("jb-option jb-checkbox")?.getAttribute("label")).toBe("Option 1");

    element.props.useCheckbox = false;
    entry.applyToRuntime(target, element, "en");

    expect(target.querySelector("jb-option jb-checkbox")).toBeNull();
    expect(target.querySelector("jb-option")?.textContent).toBe("Option 1");
  });

  it("keeps user rules declarative while compiling trusted runtime validators", () => {
    const rule = createValidationRule("pattern");
    if (rule.rule !== "pattern") {
      throw new Error("Expected a pattern rule.");
    }
    rule.params.source = "^value$";
    const portable = JSON.stringify(rule);
    const compiled = compileValidationRule(rule, "en");

    expect(portable).not.toContain("function");
    expect(compiled.validator).toBeTypeOf("function");
    const validator = compiled.validator as (value: unknown) => boolean;
    expect(validator("")).toBe(true);
    expect(validator("value")).toBe(true);
    expect(validator("no spaces")).toBe(false);
  });

  it("keeps one isolated lazy loader per component", () => {
    expect(new Set(formElementRegistry.map(entry => entry.loadComponent)).size).toBe(formElementRegistry.length);
  });

  it("applies content elements to safe native HTML", () => {
    const textEntry = formElementRegistry.find(entry => entry.type === "text")!;
    const textElement = createDefaultElement(textEntry, "intro");
    textElement.props.content = { translations: { en: "Welcome", fa: "خوش آمدید" } };
    textElement.props.color = "rebeccapurple";
    textElement.props.fontSize = 1.5;
    textElement.props.fontWeight = "bold";
    textElement.props.textAlign = "center";
    textElement.props.lineHeight = 2;
    const paragraph = document.createElement("p") as unknown as RuntimeFormElement;
    textEntry.applyToRuntime(paragraph, textElement, "fa");
    expect(paragraph.textContent).toBe("خوش آمدید");
    expect(paragraph.hasAttribute("name")).toBe(false);
    expect(paragraph.style.color).toBe("rebeccapurple");
    expect(paragraph.style.fontSize).toBe("1.5rem");
    expect(paragraph.style.fontWeight).toBe("700");
    expect(paragraph.style.textAlign).toBe("center");
    expect(paragraph.style.lineHeight).toBe("2");

    const imageEntry = formElementRegistry.find(entry => entry.type === "image")!;
    const imageElement = createDefaultElement(imageEntry, "hero");
    imageElement.props.url = "https://example.com/hero.jpg";
    imageElement.props.alt = { translations: { en: "Hero" } };
    imageElement.props.size = "md";
    imageElement.props.containerType = "rounded";
    imageElement.props.aspectRatio = "landscape";
    imageElement.props.objectFit = "cover";
    imageElement.props.objectPosition = "top";
    imageElement.props.alignment = "end";
    const image = document.createElement("img") as unknown as RuntimeFormElement;
    imageEntry.applyToRuntime(image, imageElement, "en");
    expect(image.getAttribute("src")).toBe("https://example.com/hero.jpg");
    expect(image.getAttribute("alt")).toBe("Hero");
    expect(image.style.inlineSize).toBe("28rem");
    expect(image.style.borderRadius).toBe("0.875rem");
    expect(image.style.aspectRatio).toBe("16 / 9");
    expect(image.style.objectFit).toBe("cover");
    expect(image.style.objectPosition).toBe("top");
    expect(image.style.marginInlineStart).toBe("auto");
    expect(image.style.marginInlineEnd).toBe("0");

    const emptyImageElement = createDefaultElement(imageEntry, "emptyImage");
    const placeholderImage = document.createElement("img") as unknown as RuntimeFormElement;
    imageEntry.applyToRuntime(placeholderImage, emptyImageElement, "en");
    expect(placeholderImage.getAttribute("src")).toBe("/form/image-placeholder.svg");
    expect(placeholderImage.dataset.placeholder).toBe("true");

    const voiceEntry = formElementRegistry.find(entry => entry.type === "voice")!;
    const voiceElement = createDefaultElement(voiceEntry, "welcomeAudio");
    voiceElement.props.url = "https://example.com/welcome.mp3";
    const audio = document.createElement("audio") as unknown as RuntimeFormElement;
    voiceEntry.applyToRuntime(audio, voiceElement, "en");
    expect(audio.getAttribute("src")).toBe("https://example.com/welcome.mp3");
    expect(audio.hasAttribute("controls")).toBe(true);

    const linkEntry = formElementRegistry.find(entry => entry.type === "link")!;
    const linkElement = createDefaultElement(linkEntry, "learnMore");
    linkElement.props.content = { translations: { en: "Learn more", fa: "بیشتر بدانید" } };
    linkElement.props.url = "https://example.com/details";
    linkElement.props.openInNewTab = true;
    const link = document.createElement("a") as unknown as RuntimeFormElement;
    linkEntry.applyToRuntime(link, linkElement, "fa");
    expect(link.textContent).toBe("بیشتر بدانید");
    expect(link.getAttribute("href")).toBe("https://example.com/details");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");

    linkElement.props.url = "javascript:alert(1)";
    linkEntry.applyToRuntime(link, linkElement, "en");
    expect(link.hasAttribute("href")).toBe(false);
  });
});
