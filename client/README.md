# PM Internship Portal - Frontend

A multilingual React frontend designed to make internship discovery accessible to youth across India, including first-generation learners from rural areas, tribal districts, and urban communities with limited digital exposure.

## Overview

The PM Internship Scheme receives applications from diverse backgrounds across India. This portal addresses the challenge of helping candidates with varying levels of digital literacy find relevant internship opportunities through a simple, intuitive interface that works across devices and supports multiple Indian languages.

## Key Features

- **Indian Language Support**: Comprehensive support for major Indian languages including Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and others
- **Mobile-First Design**: Optimized for smartphones and low-bandwidth connections common in rural and remote areas
- **Simple User Experience**: Minimal text interface with visual cues designed for users with limited digital exposure
- **Smart Recommendations**: Lightweight recommendation system that suggests 3-5 most relevant internships based on candidate profile
- **Accessible Interface**: Built with accessibility standards to support users with varying technical skills
- **Offline-Ready**: Progressive Web App capabilities for areas with intermittent connectivity

## Target Users

- **First-generation learners** with limited digital exposure
- **Rural youth** accessing opportunities through common service centers
- **Students from tribal districts** and remote colleges
- **Urban candidates** from diverse socioeconomic backgrounds
- **Mobile-first users** with basic smartphones

## Design Philosophy

### Simplicity First
- Clean, uncluttered interface with minimal cognitive load
- Visual icons and graphics to reduce reliance on text
- Step-by-step guided flows for complex processes

### Cultural Sensitivity
- Regional language support with culturally appropriate content
- Location-aware recommendations considering local opportunities
- Familiar UI patterns that resonate with Indian users

### Technical Accessibility
- Works on basic Android devices and low-end smartphones
- Optimized for 2G/3G networks
- Progressive enhancement for better devices

## Tech Stack

- **Frontend Framework**: React with Vite for fast development and optimized builds
- **Styling**: CSS Modules for component-scoped, maintainable styles
- **Icons & Graphics**: Heroicons with custom Indian-context iconography
- **Internationalization**: Real-time translation system supporting Indian languages
- **Mobile Optimization**: Responsive design with touch-first interactions
- **Performance**: Lazy loading and code splitting for faster load times

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Multi-language navigation
│   ├── LanguageSelector.jsx    # Indian language switcher
│   └── RecommendationCard.jsx  # Internship suggestion cards
├── pages/
│   ├── Login.jsx              # Simple authentication
│   ├── Registration.jsx       # Youth onboarding
│   ├── Profile.jsx           # Candidate profile management
│   ├── Internships.jsx       # Browse all opportunities
│   ├── Recommendations.jsx    # AI-suggested matches
│   └── Applications.jsx      # Track applied internships
├── styles/
│   ├── mobile-first.css      # Mobile-optimized styles
│   ├── accessibility.css     # WCAG compliance
│   └── indian-themes.css     # Culturally appropriate themes
├── utils/
│   ├── translation.js        # Indian language support
│   ├── recommendations.js    # Lightweight matching logic
│   └── accessibility.js      # Screen reader support
└── assets/
    ├── icons/               # Indian context icons
    └── illustrations/       # Cultural graphics
```

## Language Support

### Supported Indian Languages
- **Hindi** (हिन्दी) - Primary interface language
- **Bengali** (বাংলা) - Eastern India
- **Tamil** (தமிழ்) - Tamil Nadu, Puducherry
- **Telugu** (తెలుగు) - Andhra Pradesh, Telangana
- **Marathi** (मराठी) - Maharashtra, Goa
- **Gujarati** (ગુજરાતી) - Gujarat, Dadra and Nagar Haveli
- **Kannada** (ಕನ್ನಡ) - Karnataka
- **Malayalam** (മലയാളം) - Kerala, Lakshadweep
- **Punjabi** (ਪੰਜਾਬੀ) - Punjab, Haryana
- **Odia** (ଓଡ଼ିଆ) - Odisha
- **Assamese** (অসমীয়া) - Assam
- **Urdu** (اردو) - Multiple states

### Translation Features
- **Real-time switching** between languages without page reload
- **Content adaptation** for regional cultural context
- **Automatic detection** of user's preferred language from browser/location
- **Fallback support** to Hindi/English for unsupported content

## Installation and Setup

### Prerequisites
- Node.js 18+ (works on basic development machines)
- Modern web browser (Chrome 70+, Firefox 65+, Safari 12+)

### Environment Setup
Create `.env` file:
```env
VITE_API_BASE=https://your-api-domain.gov.in
VITE_TRANSLATION_ENABLED=true
VITE_MOBILE_FIRST=true
```

### Quick Start
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy build
npm run preview
```

## User Journey

### 1. Language Selection
- Automatic detection of user's language preference
- Easy language switcher in regional scripts
- Visual language selector for low-literacy users

### 2. Simple Registration
- Minimal required fields (Name, Education, Location, Interests)
- Visual progress indicators
- Mobile number verification for rural users

### 3. Profile Building
- Step-by-step guided process
- Optional fields with helpful tooltips
- Visual skill selection interface

### 4. Smart Recommendations
- 3-5 carefully curated suggestions
- Clear internship cards with key information
- Simple "Interested" / "Not for me" feedback

### 5. Application Process
- Streamlined application flow
- Progress tracking with visual indicators
- SMS/WhatsApp notifications for updates

## Mobile Optimization

### Touch-First Design
- Large, finger-friendly buttons (minimum 44px touch targets)
- Swipe gestures for navigation
- Pull-to-refresh functionality

### Network Efficiency
- Compressed images and assets
- Lazy loading for non-critical content
- Offline capability for basic browsing

### Device Compatibility
- Works on devices with 1GB RAM
- Optimized for screen sizes from 320px to 1920px
- Battery-efficient interactions

## Accessibility Features

### Digital Literacy Support
- Visual cues for all actions
- Confirmation dialogs for important actions
- Undo functionality where appropriate

### Technical Accessibility
- Screen reader compatibility
- High contrast mode for visual impairments
- Keyboard navigation for all functions
- ARIA labels in regional languages

### Inclusive Design
- Simple language and clear instructions
- Cultural sensitivity in imagery and content
- Support for right-to-left text (Urdu)

## Deployment Considerations

### Government Infrastructure
- Compatible with government hosting environments
- Security compliance for sensitive user data
- Integration capabilities with existing PM Internship systems

### Scalability
- Handles high concurrent users during application seasons
- State-wise load balancing for regional traffic
- CDN optimization for faster loading across India

### Maintenance
- Minimal server dependencies for easy updates
- Automated deployment pipelines
- Monitoring for performance across different regions

## Performance Metrics

- **Load Time**: Under 3 seconds on 3G networks
- **Bundle Size**: Less than 1MB for initial load
- **Accessibility**: WCAG 2.1 AA compliant
- **Language Coverage**: 12+ Indian languages supported
- **Mobile Score**: 90+ on Google PageSpeed Insights

## Security & Privacy

- **Data Protection**: Minimal data collection with user consent
- **Regional Compliance**: Adherence to Indian data protection laws
- **Secure Communication**: HTTPS encryption for all data transfer
- **Privacy by Design**: No tracking of personal browsing behavior

## Contributing

This project welcomes contributions that improve accessibility and language support for Indian users. Priority areas include:

- Additional regional language support
- Enhanced mobile optimizations
- Improved accessibility features
- Cultural adaptation for different regions

## License

[Government/Public License - Specify as per PM Internship Scheme guidelines]

---

**Built for Digital India Initiative** - Empowering youth across India with accessible technology solutions.