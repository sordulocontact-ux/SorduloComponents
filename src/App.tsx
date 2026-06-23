import Header from './components/layout/Header';
import Home from './pages/Home';

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <Home />
    </div>
  );
}

export default App;
