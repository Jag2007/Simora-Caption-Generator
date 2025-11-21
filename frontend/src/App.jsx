import VideoUploader from "./components/VideoUploader";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  return (
    <div className="app min-h-screen bg-gray-50">
      {/* Alert Banner */}
      <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 px-4 py-3 text-center text-sm font-medium">
        ⚠️{" "}
        <span className="font-semibold">
          Backend Server is not deployed because of the size of the py module.
        </span>
        — Only Audio Attraction works perfectly. Please clone the project & run
        locally.
        <a
          href="https://github.com/Jag2007/Whisprite"
          target="_blank"
          className="underline font-semibold hover:text-yellow-800 ml-6"
        >
          View README →
        </a>
      </div>

      <Navbar />
      <VideoUploader />
    </div>
  );
}

export default App;
