import { Title } from "@react-components/title/Title";
import styles from "./styles.module.css";
import cardStyles from "@react-components/card/RoundCard.module.css";
import agileverseImage from "./agileverse.jpg";
export default function ProductsSection() {
  return (
    <div className={styles.productsSectionWrapper}>
      <Title>Products</Title>
      <div className={styles.productList}>
        <a className={styles.productLink} href="/design-system" target="_blank">
          <div className={`${cardStyles.roundCard} ${styles.productCard}`}>
            <img className={styles.productImage} src="https://github.com/javadbat/design-system/raw/main/public/images/banner-small.jpg" />
            <h3 className={styles.productTitle}>JB Design System</h3>
            <p className={styles.productDescription}>Web-Component Based Design System that Works With Every Framework Like (React, Angular, Vue,...)</p>
          </div>
        </a>
        <a className={styles.productLink} href="https://agileverse.io" target="_blank">
          <div className={`${cardStyles.roundCard} ${styles.productCard}`}>
            <img className={styles.productImage} src={agileverseImage.src} />
            <h3 className={styles.productTitle}>Agileverse</h3>
            <p className={styles.productDescription}>Website About Agile Methodologies and Frameworks with Great Tools for Feedback And Team Assessments</p>
          </div>
        </a>
      </div>
    </div>
  )
}
