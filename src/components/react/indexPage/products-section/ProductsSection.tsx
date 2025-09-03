import { Title } from "@react-components/title/Title";
import { ProductCard, ProductDescription, ProductImage, ProductLink, ProductList, ProductsSectionWrapper, ProductTitle } from "./styles";
import agileverseImage from "./agileverse.jpg";
export default function ProductsSection() {
  return (
    <ProductsSectionWrapper>
      <Title>Products</Title>
      <ProductList>
        <ProductLink href="/design-system">
          <ProductCard>
            <ProductImage src="https://github.com/javadbat/design-system/raw/main/public/images/banner-small.jpg" />
            <ProductTitle>JB Design System</ProductTitle>
            <ProductDescription>Web-Component Based Design System that Works With Every Framework Like (React, Angular, Vue,...)</ProductDescription>
          </ProductCard>
        </ProductLink>
        <ProductLink href="https://agileverse.io">
          <ProductCard>
            <ProductImage src={agileverseImage.src} />
            <ProductTitle>Agileverse</ProductTitle>
            <ProductDescription>Website About Agile Methodologies and Frameworks with Great Tools for Feedback And Team Assessments</ProductDescription>
          </ProductCard>
        </ProductLink>
      </ProductList>
    </ProductsSectionWrapper>
  )
}
