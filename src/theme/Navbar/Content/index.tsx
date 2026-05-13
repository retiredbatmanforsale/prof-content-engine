import React, { type ReactNode, useEffect } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import SearchBar from '@theme/SearchBar';

const HOME_URL = 'https://prof.lexailabs.com';

export default function NavbarContent(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const logoUrl = useBaseUrl('/img/lexailogo.svg');

  useEffect(() => {
    const onScroll = () => {
      document.body.classList.toggle('prof-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="navbar__inner prof-navbar-inner">
      {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}

      <a href={HOME_URL} className="navbar__brand prof-navbar__brand">
        <img src={logoUrl} alt="Lex AI Labs" width={28} height={28} />
        <span className="prof-navbar__title">Prof</span>
      </a>

      <div className="prof-navbar__spacer" />

      <div className="navbar__items navbar__items--right prof-navbar__right">
        <div className="prof-navbar__search">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}
