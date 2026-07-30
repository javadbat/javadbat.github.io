import { parseFormRoute } from "../application/form-route";
import { BuilderApp } from "../builder/BuilderApp";
import { DesignerPlaceholderApp } from "../designer/DesignerPlaceholderApp";
import { PreviewApp } from "../preview/PreviewApp";
import styles from "./RouteShell.module.css";

export function Form404App() {
  const route = parseFormRoute(window.location.pathname);

  switch (route?.surface) {
    case "builder":
      return <BuilderApp />;
    case "designer":
      return <DesignerPlaceholderApp />;
    case "preview":
      return <PreviewApp />;
    default:
      return (
        <main className={styles.placeholder}>
          <p className={styles.eyebrow}>404</p>
          <h1>Page not found</h1>
          <p className={styles.placeholderDescription}>The requested page does not exist.</p>
        </main>
      );
  }
}
