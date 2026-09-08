import { Storefront } from '@mui/icons-material';

function Footer() {
  return (
    <footer className="footer">
      <Storefront className="footer-icon" />
      <p>© {new Date().getFullYear()} SomeShop. All rights reserved.</p>
    </footer>
  );
}

export default Footer;