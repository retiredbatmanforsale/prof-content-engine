import React from 'react';
import styles from './styles.module.css';

interface Step {
  keyword: string;
  time: string;
  subtitle: string;
}

interface StepperProps {
  steps: Step[];
  active?: string;
}

export default function Stepper({steps, active}: StepperProps) {
  return (
    <div className={styles.stepper}>
      {steps.map((step, idx) => {
        const isActive = active && step.keyword === active.toUpperCase();
        return (
          <React.Fragment key={step.keyword}>
            <div
              className={`${styles.step} ${isActive ? styles.stepActive : ''}`}
            >
              <div className={styles.stepCircle}>{idx + 1}</div>
              <div className={styles.stepBody}>
                <p className={styles.stepKeyword}>{step.keyword}</p>
                <span className={styles.stepTime}>{step.time}</span>
                <p className={styles.stepSubtitle}>{step.subtitle}</p>
              </div>
            </div>
            {idx < steps.length - 1 && <div className={styles.stepConnector} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
