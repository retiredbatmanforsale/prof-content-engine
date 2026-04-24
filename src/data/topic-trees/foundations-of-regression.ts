import type { CourseTopicTreeData } from '@site/src/components/CourseTopicTree';

export const regressionTopicTree: CourseTopicTreeData = {
  prerequisites: [
    {
      title: 'High School Algebra & Basic Calculus',
      description: 'Linear equations, slope-intercept form, derivatives, chain rule',
    },
    {
      title: 'Python & NumPy',
      description: 'Basic programming, array operations, for loops',
    },
  ],
  lessons: [
    {
      id: 'linear-regression-line-ssr-gradient-descent',
      title: 'Linear regression: lines, SSR & gradient descent',
      oneLiner: 'Find the line that minimises prediction error',
      why: 'Linear regression is the foundation for all supervised learning. The loop — compute error, take derivatives, update parameters — is the template for every optimisation algorithm in deep learning.',
      difficulty: 'beginner',
      minutes: 16,
      lessonPrereqs: ['Algebra (slope-intercept form)', 'Basic calculus (derivatives)'],
    },
    {
      id: 'why-logistic-regression',
      title: 'Why logistic regression?',
      oneLiner: 'Linear outputs break classification; you need bounded probabilities',
      why: 'Classification is fundamentally different from regression — you need probabilities, not unbounded real numbers. This lesson shows exactly why linear regression fails for yes/no questions and motivates everything that follows.',
      difficulty: 'beginner',
      minutes: 12,
      lessonPrereqs: ['Lesson 1 — Linear regression'],
    },
    {
      id: 'sigmoid-function-logistic-regression',
      title: 'The sigmoid: secret sauce of logistic regression',
      oneLiner: 'Sigmoid squashes any number into (0, 1)',
      why: 'The sigmoid is not just a trick — it is the key to probabilistic reasoning in every neural network. Understanding its shape, differentiability, and saturation behaviour is prerequisite to every activation function you will ever use.',
      difficulty: 'beginner',
      minutes: 13,
      lessonPrereqs: ['Lesson 2 — Why logistic regression'],
    },
    {
      id: 'logistic-regression-decision-boundaries',
      title: 'Decision boundaries',
      oneLiner: 'The boundary where P(y=1) = 0.5 is a line in feature space',
      why: 'Decision boundaries make the classifier geometric. This intuition — that classification is about drawing lines in input space — unlocks your ability to reason about why features matter and what linearly inseparable data means.',
      difficulty: 'beginner',
      minutes: 12,
      lessonPrereqs: ['Lesson 3 — Sigmoid'],
    },
    {
      id: 'intuition-behind-logistic-regression',
      title: 'Intuition behind logistic regression',
      oneLiner: 'SSE fails for probabilities; MLE creates a convex objective',
      why: 'Why cross-entropy instead of squared error? Non-convex losses lead to local minima and failed optimisation. This lesson teaches you why the loss function choice matters — a principle that extends to all of deep learning.',
      difficulty: 'intermediate',
      minutes: 14,
      lessonPrereqs: ['Lesson 4 — Decision boundaries'],
    },
    {
      id: 'log-likelihood-instead-of-squared-error',
      title: 'Log-likelihood instead of squared error',
      oneLiner: 'Bernoulli likelihood → log-likelihood → binary cross-entropy loss',
      why: 'Binary cross-entropy is not just a formula — it is the language of maximum likelihood estimation. Deriving it from first principles teaches you how to design losses for any new problem you encounter.',
      difficulty: 'intermediate',
      minutes: 14,
      lessonPrereqs: ['Lesson 5 — MLE intuition'],
    },
  ],
  unlocks: [
    {
      title: 'Deep Neural Networks',
      description: 'Stack nonlinearities and repeat gradient descent at scale',
    },
    {
      title: 'Multi-class classification & softmax',
      description: 'Extend binary ideas to K > 2 classes',
    },
  ],
};
