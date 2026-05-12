import type { CourseTopicTreeData } from '@site/src/components/CourseTopicTree';

export const cnnTopicTree: CourseTopicTreeData = {
  prerequisites: [
    {
      title: 'Deep Neural Networks',
      description: 'Stacking layers, backpropagation, activation functions, overfitting',
    },
    {
      title: 'Foundations of Regression',
      description: 'Logistic regression, loss functions, gradient descent',
    },
  ],
  lessons: [
    {
      id: 'visual-revolution',
      title: 'The visual revolution',
      oneLiner: 'Deep learning ended decades of hand-crafted vision',
      why: 'Before AlexNet (2012), computer vision was dominated by hand-engineered features like SIFT and HOG. Understanding what changed — and why — gives you the historical context to appreciate every architectural choice that followed.',
      difficulty: 'beginner',
      minutes: 10,
      lessonPrereqs: [],
    },
    {
      id: 'transformative-deep-learning-vision',
      title: 'Deep learning\'s role in computer vision',
      oneLiner: 'Learned features beat hand-crafted ones at every benchmark',
      why: 'The shift from engineered to learned features is not incremental — it is a paradigm change. This lesson quantifies the gap: pre-DL accuracy vs post-DL accuracy on ImageNet, and why that delta cascades into autonomous driving, medical imaging, and beyond.',
      difficulty: 'beginner',
      minutes: 12,
      lessonPrereqs: ['Lesson 1 — Visual revolution'],
    },
    {
      id: 'from-pixels-to-perception',
      title: 'From pixels to perception',
      oneLiner: 'Images are 3D tensors (H × W × C); models predict labels from them',
      why: 'Before training a vision model, you need to know how computers represent images as tensors, what kinds of supervision exist (classification, detection, segmentation), and why raw pixel arrays are harder than they look.',
      difficulty: 'beginner',
      minutes: 12,
      lessonPrereqs: ['Lesson 2 — DL role in vision'],
    },
    {
      id: 'feature-detection-hierarchy',
      title: 'Feature detection & spatial hierarchy',
      oneLiner: 'Networks learn edges → textures → shapes → objects automatically',
      why: 'Human vision is hierarchical: you perceive edges, then shapes, then objects. Deep networks learn the same cascade from data. This is why depth matters — shallow networks can only detect first-order patterns, not the multi-level structure needed for recognition.',
      difficulty: 'intermediate',
      minutes: 13,
      lessonPrereqs: ['Lesson 3 — Pixels to perception'],
    },
    {
      id: 'preserving-spatial-structure-cnns',
      title: 'Preserving spatial structure with CNNs',
      oneLiner: 'Convolutions respect locality; fully-connected layers discard it',
      why: 'Flattening an image and feeding it to a dense layer destroys spatial relationships — nearby pixels that define an edge are treated no differently from pixels at opposite corners. Convolutions preserve 2D structure through local receptive fields and weight sharing.',
      difficulty: 'intermediate',
      minutes: 14,
      lessonPrereqs: ['Lesson 4 — Feature hierarchy'],
    },
    {
      id: 'filters-features-convolutions',
      title: 'Filters, features & the power of convolutions',
      oneLiner: 'Slide a small learned filter across the image to detect one pattern',
      why: 'A convolution filter is just a learned detector: multiply-add over a neighbourhood, everywhere. Understanding this operation — stride, padding, depth, weight sharing — is the foundational literacy for every CNN architecture you will ever read about.',
      difficulty: 'intermediate',
      minutes: 14,
      lessonPrereqs: ['Lesson 5 — Spatial structure'],
    },
    {
      id: 'learning-to-see-cnns',
      title: 'Learning to see: CNN internals',
      oneLiner: 'Conv–ReLU–Pool stacks compress space while deepening channels',
      why: 'Modern vision models follow a rhythm: convolution detects patterns, ReLU introduces non-linearity, pooling reduces spatial resolution while keeping the strongest activations. Each layer widens the receptive field and raises the abstraction level.',
      difficulty: 'intermediate',
      minutes: 15,
      lessonPrereqs: ['Lesson 6 — Convolutions'],
    },
  ],
  unlocks: [
    {
      title: 'CNN Architectures (ResNet, EfficientNet)',
      description: 'Classic and modern networks that scale vision to ImageNet',
    },
    {
      title: 'Object Detection & Segmentation',
      description: 'Extend classification to localise and segment objects',
    },
    {
      title: 'Vision Transformers (ViT)',
      description: 'Apply attention to image patches as an alternative to convolutions',
    },
  ],
};
