import { Companies } from "./companies/Companies";
import ProductsList from "./projects/ProductsList";
import styles from "./styles.module.css";

import { Title } from "@react-components/title/Title";


// const NoLogo = ()=><></>
function ExperiencesSection() {
  return (
    <section className={styles.experiencesSectionWrapper}>
      <Title>Experiences</Title>
      <ProductsList/>
      <Companies/>
    </section>
  );
}

export default ExperiencesSection;
