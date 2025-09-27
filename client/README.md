# PM Internship Portal - Frontend

A multilingual React (Vite) frontend for internships and applications portal designed to connect Indian youth with relevant opportunities. Features comprehensive authentication, dynamic navigation, job search and listing, applied jobs tracking, and client-side internationalization for both UI and API-sourced content.

## Overview

Built specifically for the PM Internship Scheme to serve candidates from diverse backgrounds including rural areas, tribal districts, urban slums, and remote colleges. The portal addresses the challenge of helping first-generation learners with limited digital exposure find relevant internships among hundreds of available opportunities.

## Core Features

- **Comprehensive Authentication System**: Secure login/signup with cross-tab session synchronization
- **Indian Language Support**: Full multilingual interface with live language switching for Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, and other regional languages
- **Dynamic Navigation**: Context-aware menus that adapt based on user authentication status
- **Advanced Job Management**: Paginated listings, keyword filtering, detailed job views, and application tracking
- **Profile Management**: Youth registration and comprehensive profile/preferences forms with validation and optional resume parsing
- **Smart Recommendations**: AI-powered suggestion engine showing 3-5 most relevant internship matches
- **Accessibility First**: Keyboard navigation, ARIA compliance, screen reader support, and assistive technology compatibility
- **Mobile-Optimized**: Responsive design optimized for smartphones and low-bandwidth connections

## Key Features

- **Multilingual UI and Data**: Client-side batch translation of labels and all job fields with caching and live language switching across major Indian languages
- **Secure Authentication**: Login/signup system with token management and cross-tab synchronization
- **Conditional Navigation**: Dynamic menu system where career options appear based on authentication status
- **Comprehensive Forms**: Youth registration and profile management with validation and optional resume parsing capabilities
- **Advanced Job Discovery**: Paginated job listings with keyword filtering, detailed views, and application tracking
- **Applied Jobs Management**: Dedicated interface for viewing and managing job applications with filtering capabilities
- **Full Accessibility**: Keyboard navigable menus, ARIA attributes, escape handlers, and assistive technology support
- **Mobile-First Design**: Touch-friendly interface optimized for entry-level smartphones and low-bandwidth connections
- **Smart Recommendations**: Rule-based recommendation engine suggesting 3-5 personalized internship matches based on profile, education, and preferences

## Tech Stack

- **Frontend Framework**: React with Vite for fast, lightweight builds
- **Styling**: CSS Modules for maintainable, mobile-optimized styling
- **Translation**: Client-side translation system supporting Indian languages
- **State Management**: Browser storage with offline capability
- **Icons & UI**: Heroicons with culturally appropriate visual elements
- **Performance**: Optimized for 2G/3G networks and entry-level smartphones

## Application Architecture

### Core Components

#### Authentication System
- **Login/Signup Flow**: Secure authentication with multilingual labels and validation
- **Session Management**: Persistent login sessions with cross-tab synchronization
- **User Profile Integration**: Dynamic user information display in navigation

#### Navigation & UI
- **Dynamic Navbar**: Language dropdown, authentication buttons, and conditional career menu
- **Responsive Design**: Mobile-optimized interface with touch-friendly interactions
- **Accessibility Features**: Keyboard navigation, ARIA labels, and escape handlers

#### Job Management
- **Job Listings**: Paginated display with search toolbar and compact pagination controls
- **Filtering System**: Keyword-based filtering with debounced search functionality
- **Detail Views**: Comprehensive job information with application links and compensation details
- **Application Tracking**: Applied jobs interface with status management

#### Internationalization
- **Live Translation**: Real-time language switching without page refresh
- **Content Caching**: Optimized translation caching to avoid redundant API calls
- **Comprehensive Coverage**: Both UI elements and dynamic API content translation

### Page Components

#### Login.jsx
- **Multilingual Interface**: Translated labels, messages, and validation feedback
- **Authentication Flow**: Token persistence and event broadcasting on successful login
- **Form Validation**: Client-side validation for required fields with user-friendly error messages

#### YouthRegistration.jsx  
- **Registration Process**: Comprehensive signup form with multilingual hints and feedback
- **Profile Creation**: Initial profile setup with education, skills, and preference capture
- **Success Handling**: Token storage and automatic redirection after successful registration

#### Form.jsx (Profile Management)
- **Authentication Gate**: Protected access requiring valid authentication
- **Profile Integration**: Handles profile data loading and management
- **Structured Input**: Education, work experience, skills, and voluntary work sections
- **Resume Parsing**: Optional resume upload and parsing functionality
- **Validation System**: Comprehensive form validation with real-time feedback

#### JobListings.jsx
- **Data Management**: Handles job data with optional keyword filtering
- **Pagination**: Client-side pagination with configurable page sizes (default 100)
- **Search Interface**: Search toolbar with debounced input for performance
- **Translation Integration**: Full i18n support for both UI and job content
- **Detail Display**: Expandable job details with description, tags, and compensation
- **Application Management**: Apply/withdraw functionality with local state persistence

#### AppliedJobs.jsx
- **Application Tracking**: Dedicated view for user's applied jobs
- **Consistent Interface**: Mirrors JobListings UI with identical translation behavior
- **Filtering Support**: Search and filter applied jobs functionality
- **Status Management**: Application status tracking and updates

## Accessibility & Inclusion

- **Language Accessibility**: Real-time translation of all content
- **Digital Literacy Support**: Step-by-step guidance and help tooltips
- **Keyboard Navigation**: Full functionality without mouse/touch
- **Screen Reader Support**: Proper ARIA labels and semantic structure
- **High Contrast Mode**: Better visibility for users with visual impairments
- **Simplified Interactions**: One-click actions and minimal form fields

## Mobile Optimization

- **Touch-Friendly**: Large touch targets and thumb-friendly navigation
- **Offline Support**: Key features work without internet connection
- **Data Conservation**: Optimized images and minimal data usage
- **Battery Efficient**: Lightweight animations and efficient rendering
- **Cross-Platform**: Works on Android, iOS, and KaiOS devices

## Regional Adaptation

- **Cultural Sensitivity**: Design elements appropriate for Indian users
- **Local Context**: Location-based customization and regional preferences
- **Government Integration**: Seamless connection with PM Internship Scheme backend
- **Vernacular Content**: Native language content beyond translation
- **Regional Partnerships**: Integration with local employment exchanges and colleges

## Installation and Setup

### Prerequisites
- Node.js 18+ and npm or pnpm/yarn
- Modern web browser with JavaScript enabled

### Environment Configuration
Create a `.env` file:
```env
# Add any required environment variables here
```

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev


## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Multi-language navigation with conditional menus
│   ├── LanguageSelector.jsx    # Indian language switcher component
│   └── RecommendationCard.jsx  # Internship suggestion cards
├── pages/
│   ├── Login.jsx              # Authentication with multilingual support
│   ├── YouthRegistration.jsx  # User registration and profile creation
│   ├── Form.jsx               # Profile management and preferences update
│   ├── JobListings.jsx        # Job search, filtering, and detailed views
│   └── AppliedJobs.jsx        # Application tracking and management
├── styles/
│   ├── Navbar.module.css      # Navigation styling with responsive design
│   ├── Auth.module.css        # Authentication forms styling
│   ├── Form.module.css        # Profile forms and validation styling
│   ├── JobListings.module.css # Job display and pagination styling
│   └── Accessibility.module.css # Accessibility enhancements
├── lib/
│   ├── translateClient.js     # Translation batch processing utility
│   └── recommendation.js      # Client-side recommendation engine
└── assets/
    ├── icons/                 # Heroicons and cultural icons
    ├── images/               # Optimized images and logos
    ├── MCA.svg               # Government branding assets
    └── pm_internship_logo_eng.svg # Portal logo
```

**Technical Notes:**
- CSS Modules used for encapsulated, maintainable styling
- Icons imported from `@heroicons/react/24/outline`
- Translation client handles batch processing of content
- Assets optimized for low-bandwidth connections

## Performance Optimizations

- **Bundle Size**: < 300KB gzipped for fast loading on 2G networks
- **Image Optimization**: WebP format with fallbacks, lazy loading
- **Caching Strategy**: Aggressive caching for repeat visits
- **Code Splitting**: Load only required features on demand
- **Compression**: Brotli/Gzip compression for all assets

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile Browsers**: Chrome Mobile, Safari iOS, Samsung Internet
- **Legacy Support**: Internet Explorer 11 with polyfills
- **Feature Phones**: Basic functionality on KaiOS browsers

## Security & Privacy

- **Data Minimization**: Collect only essential user information
- **Local Storage**: Sensitive data kept client-side when possible
- **HTTPS Only**: Secure communication with backend services
- **Privacy First**: Clear data usage policies and user consent
- **Audit Trail**: Transparent logging of user interactions


### Configuration
- Set appropriate `VITE_API_BASE` for production environment
- Enable compression and caching headers
- Configure CSP headers for security
- Set up monitoring and analytics

## Future Roadmap

- **Voice Interface**: Support for voice-based navigation in regional languages
- **Offline Mode**: Full offline functionality with sync capabilities
- **WhatsApp Integration**: Application updates and notifications via WhatsApp
- **Video Guidance**: Tutorial videos in regional languages
- **AI Enhancement**: More sophisticated recommendation algorithms
- **Government Integration**: Direct connection with other skill development schemes

## Contributing

This project welcomes contributions that improve accessibility, add regional language support, or enhance the user experience for Indian youth from diverse backgrounds.

## License

[Government of India License - specify appropriate license]