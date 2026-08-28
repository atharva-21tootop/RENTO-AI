# AI Diabetic Retinopathy Detection Model

## Overview

This directory contains the machine-learning component of the
AI-powered Diabetic Retinopathy (DR) Screening System.

The model is designed to analyze retinal fundus photographs and
classify Diabetic Retinopathy into five severity grades.

The ML pipeline contains:

1. Fundus image quality assessment
2. EfficientNet-B0 DR classification
3. Confidence/probability estimation
4. Grad-CAM explainability
5. Structured JSON inference output

---

# Model Architecture

## Backbone

NVIDIA EfficientNet-B0 pretrained on ImageNet.

The NVIDIA pretrained checkpoint is used as the backbone and
the original ImageNet classifier is replaced with a 5-class
Diabetic Retinopathy classifier.

```text
Input Fundus Image
        |
        v
Image Quality Assessment
        |
        +---- INSUFFICIENT ---> Recapture Image
        |
        v
NVIDIA EfficientNet-B0
        |
        v
5-Class DR Classifier
        |
        v
DR Grade + Confidence
        |
        v
Grad-CAM
        |
        v
JSON Result