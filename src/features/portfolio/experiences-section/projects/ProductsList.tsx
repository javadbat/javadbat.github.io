import experienceStyles from "../styles.module.css";
import styles from "./styles.module.css";
import cardStyles from "@react-components/card/RoundCard.module.css";
import agileverseImage from "./agileverse.jpg";
import formBuilderImage from "./form-builder.png";
import designSystemImage from "./banner-small.jpg";
export default function ProductsList() {
  return (
    <div className={styles.productsSectionWrapper}>
      <h3 className={experienceStyles.h3Title}>Products I’ve worked on:</h3>
      <div className={styles.productList}>
        <a className={styles.productLink} href="/design-system" target="_blank" rel="noopener">
          <div className={`${cardStyles.roundCard} ${styles.productCard}`}>
            <img className={styles.productImage} src={designSystemImage.src} alt="JB Design System" />
            <h3 className={styles.productTitle}>JB Design System</h3>
            <p className={styles.productDescription}>Web-Component Based Design System that Works With Every Framework Like (React, Angular, Vue,...)</p>
          </div>
        </a>
        <a className={styles.productLink} href="https://agileverse.io" target="_blank" rel="noopener">
          <div className={`${cardStyles.roundCard} ${styles.productCard}`}>
            <img className={styles.productImage} src={agileverseImage.src} alt="Agileverse" />
            <h3 className={styles.productTitle}>Agileverse</h3>
            <p className={styles.productDescription}>Website About Agile Methodologies and Frameworks with Great Tools for Feedback And Team Assessments</p>
          </div>
        </a>
        <a className={styles.productLink} href="https://javadbat.github.io/form/" target="_blank" rel="noopener">
          <div className={`${cardStyles.roundCard} ${styles.productCard}`}>
            <img className={styles.productImage} src={formBuilderImage.src} alt="Form Builder" />
            <h3 className={styles.productTitle}>Form Builder</h3>
            <p className={styles.productDescription}>A Simple and Easy-to-Use Form Builder for Creating Beautiful Forms With JB Design System Elements
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
