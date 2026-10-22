import { Footer } from './components/Footer';
import { Nav } from './components/Nav';
import { PointerSystem } from './components/PointerSystem';
import { RouteView } from './components/RouteView';
import { RouterProvider } from './lib/router';
import { ThemeProvider } from './lib/theme';
import Contact from './pages/Contact';
import Drivers from './pages/Drivers';
import Faq from './pages/Faq';
import Home from './pages/Home';
import Hosts from './pages/Hosts';
import HowItWorks from './pages/HowItWorks';
import NotFound from './pages/NotFound';
import Safety from './pages/Safety';

const routes = {
  '/': Home,
  '/how-it-works': HowItWorks,
  '/drivers': Drivers,
  '/hosts': Hosts,
  '/safety': Safety,
  '/faq': Faq,
  '/contact': Contact,
};

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Nav />
        <RouteView routes={routes} fallback={NotFound} />
        <Footer />
        <PointerSystem />
        <div className="grain" aria-hidden="true" />
      </RouterProvider>
    </ThemeProvider>
  );
}
