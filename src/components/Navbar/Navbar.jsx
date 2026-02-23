import React from 'react';
import styles from './Navbar.module.css';

// You can replace this with your actual logo image
// For now, I'll create a placeholder logo component
const Logo = () => (
  <div className={styles.logoContainer}>
    <img 
      src="/logo.jpeg" 
      alt="Logo" 
      className={styles.logo}
    />
  </div>
);

const Navbar = () => {
  // Handle smooth scrolling to sections
  const handleScroll = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <>
    <nav className={styles.navbar}>
      <Logo />
      
      <ul className={styles.navMenu}>
        <li className={styles.navItem}>
          <a 
            href="#home" 
            className={styles.navLink}
            onClick={(e) => handleScroll(e, 'home')}
          >
            Home
          </a>
        </li>
        <li className={styles.navItem}>
          <a 
            href="#about" 
            className={styles.navLink}
            onClick={(e) => handleScroll(e, 'about')}
          >
            About
          </a>
        </li>
      </ul>
    </nav>

    </>
  );
};

export default Navbar;