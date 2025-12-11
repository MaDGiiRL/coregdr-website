// src/App.jsx
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Routing from "./routes/Routing";

function App() {
  return (
    <div className="min-h-screen w-full text-slate-50">
      <Navbar />
      <main className="pt-20">
        <Routing />
      </main>
      <Footer/>
    </div>
  );
}

export default App;
