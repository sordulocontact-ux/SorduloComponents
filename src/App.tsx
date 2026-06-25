import { useEffect } from 'react';
import Header from './components/layout/Header';
import Home from './pages/Home';
import ComponentDetail from './pages/ComponentDetail';
import Inspirations from './pages/Inspirations';
import InspirationDetail from './pages/InspirationDetail';
import { useRoute } from './router';

function App() {
  const route = useRoute();
  const detail = route.match(/^\/c\/(.+)$/);
  const inspiDetail = route.match(/^\/i\/(.+)$/);
  const isInspirations = route === '/inspirations';

  // Remonte en haut à chaque navigation (et seulement là — pas sur un clic dont
  // la navigation a été annulée, ex. interaction avec un aperçu sur l'accueil).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      {detail ? (
        <ComponentDetail id={decodeURIComponent(detail[1])} />
      ) : inspiDetail ? (
        <InspirationDetail slug={decodeURIComponent(inspiDetail[1])} />
      ) : isInspirations ? (
        <Inspirations />
      ) : (
        <Home />
      )}
    </div>
  );
}

export default App;
