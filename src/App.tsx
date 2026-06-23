import { useEffect } from 'react';
import Header from './components/layout/Header';
import Home from './pages/Home';
import ComponentDetail from './pages/ComponentDetail';
import { useRoute } from './router';

function App() {
  const route = useRoute();
  const detail = route.match(/^\/c\/(.+)$/);

  // Remonte en haut à chaque navigation (et seulement là — pas sur un clic dont
  // la navigation a été annulée, ex. interaction avec un aperçu sur l'accueil).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      {detail ? <ComponentDetail id={decodeURIComponent(detail[1])} /> : <Home />}
    </div>
  );
}

export default App;
