import React from 'react';
import styles from './styles.module.css';

interface Company {
  name: string;
  logo: string;
  href?: string;
}

interface CompanyLogosProps {
  intro?: string;
  companies: Array<string | Company>;
}

const CATALOG: Record<string, Company> = {
  google: {
    name: 'Google',
    logo: '/img/companies/google.png',
    href: '/courses/ai-for-engineering/mle-interview/guides/google/l5',
  },
  amazon: {
    name: 'Amazon',
    logo: '/img/companies/amazon.png',
    href: '/courses/ai-for-engineering/mle-interview/guides/amazon/sde-iii',
  },
  microsoft: {
    name: 'Microsoft',
    logo: '/img/companies/microsoft.png',
    href: '/courses/ai-for-engineering/mle-interview/guides/microsoft/mle',
  },
};

export default function CompanyLogos({intro, companies}: CompanyLogosProps) {
  const resolved: Company[] = companies.map((c) =>
    typeof c === 'string' ? CATALOG[c.toLowerCase()] : c,
  ).filter(Boolean);

  return (
    <div className={styles.companyStrip}>
      {intro && <p className={styles.companyIntro}>{intro}</p>}
      <div className={styles.companyRow}>
        {resolved.map((company) => {
          const inner = (
            <>
              <img
                src={company.logo}
                alt={`${company.name} logo`}
                className={styles.companyLogo}
              />
              <span className={styles.companyName}>{company.name}</span>
            </>
          );
          return company.href ? (
            <a
              key={company.name}
              href={company.href}
              className={styles.companyLink}
            >
              {inner}
            </a>
          ) : (
            <div key={company.name} className={styles.companyTile}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
