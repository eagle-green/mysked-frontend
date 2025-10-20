import { useEffect } from 'react';

import { JwtSignInView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

const metadata = { 
  title: 'MySked - Workforce Management by Eagle Green',
  description: 'Professional workforce management software for scheduling, timesheets, job tracking, and field operations. Built for traffic control companies and service businesses by Eagle Green.'
};

export default function Page() {
  useEffect(() => {
    // Set document title
    document.title = metadata.title;
    
    // Set or update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', metadata.description);

    // Set or update Open Graph tags for social media
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', metadata.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', metadata.description);
  }, []);

  return <JwtSignInView />;
}
