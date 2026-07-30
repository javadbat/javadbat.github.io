import "@mantine/core/styles.css";
import "@mantine/code-highlight/styles.css";

import { CodeHighlight, CodeHighlightAdapterProvider, createShikiAdapter, type CodeHighlightStylesNames } from "@mantine/code-highlight";
import { MantineProvider } from "@mantine/core";
import { memo } from "react";
import styles from "./CodeViewer.module.css";

export interface CodeViewerProps {
  code: string;
  language: string;
  copyLabel?: string;
  copiedLabel?: string;
  ariaLabel?: string;
}

async function loadShiki() {
  const { createHighlighter } = await import('shiki');
  return createHighlighter({
    langs: ['json','css', 'tsx', 'ts', 'js', 'jsx', 'html'],
    themes: ['github-dark', 'github-light'],
  });
}

/**
 * Shiki is intentionally loaded only after a CodeViewer is mounted.
 *
 * The form Builder's normal editing path therefore does not download or
 * initialize a syntax highlighter. The full Shiki language bundle is useful
 * here because this shared viewer is also intended for Markdown, MDX, and
 * other source files elsewhere on the site.
 */
const shikiAdapter = createShikiAdapter(loadShiki);

const codeHighlightClasses = {
  codeHighlight: styles.viewer,
  scrollarea: styles.scrollarea,
  code: styles.code,
  controls: styles.controls,
  control: styles.control,
} satisfies Partial<Record<CodeHighlightStylesNames, string>>;

/**
 * Reusable, read-only source viewer.
 *
 * Mantine is contained behind this small boundary so callers only provide
 * source text and a language identifier. That keeps replacing or tuning the
 * highlighting implementation from leaking into feature components.
 */
export const CodeViewer = memo(function CodeViewer({ code, language, copyLabel = "Copy", copiedLabel = "Copied", ariaLabel }: CodeViewerProps) {
  return (
    <MantineProvider forceColorScheme="light">
      <CodeHighlightAdapterProvider adapter={shikiAdapter}>
{        <CodeHighlight
          aria-label={ariaLabel}
          classNames={codeHighlightClasses}
          code={code}
          language={language}
          codeColorScheme="light"
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}

          withBorder
        />}
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  );
});
